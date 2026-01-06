// src/services/chatState.js
// Pure functions for updating messenger state (chats list + generalChat + messages)
// Keep behavior compatible with MessengerPage.vue (Options API).

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const getMessageUserId = (msg) => toNumberOrNull(msg?.user_id ?? msg?.userId ?? msg?.user?.id);

const getMessageChatId = (msg) => toNumberOrNull(msg?.chat_id ?? msg?.chatId);

/**
 * Updates chats[] and generalChat in an immutable way (Vue reactivity-friendly).
 * @param {Array} chats
 * @param {Object|null} generalChat
 * @param {number|string} chatId
 * @param {(chat:Object)=>Object} updater
 * @returns {{chats:Array, generalChat:Object|null}}
 */
export function updateChatInLists(chats, generalChat, chatId, updater) {
  const chatIdNum = toNumberOrNull(chatId);
  if (!chatIdNum) return { chats, generalChat };

  const nextChats = (chats || []).map((c) => {
    if (!c || Number(c.id) !== chatIdNum) return c;
    return updater(c);
  });

  let nextGeneralChat = generalChat;
  if (generalChat && Number(generalChat.id) === chatIdNum) {
    nextGeneralChat = updater(generalChat);
  }

  return { chats: nextChats, generalChat: nextGeneralChat };
}

/**
 * Applies "local message meta" update (used for sender after POST /messages, and for current chat on WS).
 * Behavior: update last_message + last_message_at, and if it's my message set unread_count=0,
 * otherwise keep current unread_count (do not increment).
 */
export function applyLocalMessageMeta({ chats, generalChat }, msg, myUserId) {
  const chatId = getMessageChatId(msg);
  if (!chatId) return { chats, generalChat };

  const myIdNum = toNumberOrNull(myUserId);
  const isMyMessage = myIdNum && getMessageUserId(msg) && Number(getMessageUserId(msg)) === Number(myIdNum);

  return updateChatInLists(chats, generalChat, chatId, (c) => ({
    ...c,
    last_message: msg,
    last_message_at: msg?.created_at || c.last_message_at || null,
    unread_count: isMyMessage ? 0 : (c.unread_count || 0),
  }));
}

/**
 * Builds message object from WS event payload (MessageSent::broadcastWith()).
 * Keep the shape compatible with existing code.
 */
export function buildIncomingMessage(event) {
  return {
    id: event.id,
    chat_id: event.chat_id,
    user_id: event.user?.id,
    body: event.body,
    files: event.files,
    created_at: event.created_at,
    user: event.user,
  };
}

/**
 * Main state transition for incoming WS message.
 * - If message belongs to currently selected chat: append to messages if not duplicated, keep unread_count unchanged.
 * - If belongs to another chat: increment unread_count if not my message, otherwise only update last_message.
 *
 * @returns {{
 *   messages: Array,
 *   chats: Array,
 *   generalChat: Object|null,
 *   appendedToMessages: boolean,
 *   shouldScroll: boolean,
 * }}
 */
export function applyIncomingMessage({ messages, chats, generalChat, selectedChatId, myUserId }, event) {
  const newMessage = buildIncomingMessage(event);

  const chatId = getMessageChatId(newMessage);
  const selectedIdNum = toNumberOrNull(selectedChatId);
  const isCurrentChat = chatId && selectedIdNum && Number(chatId) === Number(selectedIdNum);

  const myIdNum = toNumberOrNull(myUserId);
  const isMyMessage = myIdNum && getMessageUserId(newMessage) && Number(getMessageUserId(newMessage)) === Number(myIdNum);

  // Default: no changes
  let nextMessages = messages || [];
  let nextChats = chats || [];
  let nextGeneralChat = generalChat || null;

  if (isCurrentChat) {
    const exists = (messages || []).some((m) => Number(m?.id) === Number(newMessage.id));
    if (!exists) {
      nextMessages = [...(messages || []), newMessage];
    }

    // Keep unread_count unchanged for current chat; update last_message.
    const meta = applyLocalMessageMeta({ chats: nextChats, generalChat: nextGeneralChat }, newMessage, myUserId);
    nextChats = meta.chats;
    nextGeneralChat = meta.generalChat;

    return {
      messages: nextMessages,
      chats: nextChats,
      generalChat: nextGeneralChat,
      appendedToMessages: !exists,
      shouldScroll: !exists,
    };
  }

  // Not current chat: update chat list meta + unread logic
  if (!chatId) {
    return { messages: nextMessages, chats: nextChats, generalChat: nextGeneralChat, appendedToMessages: false, shouldScroll: false };
  }

  if (!isMyMessage) {
    const meta = updateChatInLists(nextChats, nextGeneralChat, chatId, (c) => ({
      ...c,
      last_message: newMessage,
      last_message_at: newMessage?.created_at || c.last_message_at || null,
      unread_count: (c.unread_count || 0) + 1,
    }));
    nextChats = meta.chats;
    nextGeneralChat = meta.generalChat;
  } else {
    const meta = updateChatInLists(nextChats, nextGeneralChat, chatId, (c) => ({
      ...c,
      last_message: newMessage,
      last_message_at: newMessage?.created_at || c.last_message_at || null,
      // unread_count unchanged
    }));
    nextChats = meta.chats;
    nextGeneralChat = meta.generalChat;
  }

  return {
    messages: nextMessages,
    chats: nextChats,
    generalChat: nextGeneralChat,
    appendedToMessages: false,
    shouldScroll: false,
  };
}


