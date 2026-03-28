// src/services/chatState.js
// Pure functions for updating messenger state (chats list + generalChat + messages)
// Keep behavior compatible with MessengerPage.vue (Options API).

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const getMessageUserId = (msg) => toNumberOrNull(msg?.creatorId ?? msg?.userId ?? msg?.user?.id);

const getMessageChatId = (msg) => toNumberOrNull(msg?.chatId);

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
 * Behavior: update lastMessage + lastMessageAt, and if it's my message set unreadCount=0,
 * otherwise keep current unreadCount (do not increment).
 */
export function applyLocalMessageMeta({ chats, generalChat }, msg, myUserId) {
  const chatId = getMessageChatId(msg);
  if (!chatId) return { chats, generalChat };

  const myIdNum = toNumberOrNull(myUserId);
  const isMyMessage = myIdNum && getMessageUserId(msg) && Number(getMessageUserId(msg)) === Number(myIdNum);

  return updateChatInLists(chats, generalChat, chatId, (c) => ({
    ...c,
    lastMessage: msg,
    lastMessageAt: msg?.createdAt || c.lastMessageAt || null,
    unreadCount: isMyMessage ? 0 : (c.unreadCount || 0),
  }));
}

/**
 * Builds message object from WS event payload (MessageSent::broadcastWith()).
 * Keep the shape compatible with existing code.
 */
export function buildIncomingMessage(event) {
  return {
    id: event.id,
    chatId: event.chat_id,
    creatorId: event.user?.id,
    body: event.body,
    files: event.files,
    createdAt: event.created_at,
    user: event.user,
    parentId: event.parent_id,
    parent: event.parent,
    forwardedFrom: event.forwarded_from,
    isEdited: event.is_edited,
  };
}

/**
 * Main state transition for incoming WS message.
 * - If message belongs to currently selected chat: append to messages if not duplicated, keep unreadCount unchanged.
 * - If belongs to another chat: increment unreadCount if not my message, otherwise only update lastMessage.
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
  let newMessage = buildIncomingMessage(event);

  // Resolve parent message if parentId exists but parent object doesn't
  if (newMessage.parentId && !newMessage.parent) {
    const parentMessage = (messages || []).find(m => Number(m.id) === Number(newMessage.parentId));
    if (parentMessage) {
      newMessage.parent = parentMessage;
    }
  }

  // Resolve forwardedFrom message if it exists
  if (newMessage.forwardedFrom && Number(newMessage.forwardedFrom) === newMessage.forwardedFrom) {
    const forwardedMessage = (messages || []).find(m => Number(m.id) === Number(newMessage.forwardedFrom));
    if (forwardedMessage) {
      newMessage.forwardedFrom = forwardedMessage;
    }
  }

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
      const withoutTemp = (messages || []).filter((m) => !String(m?.id).startsWith('temp-'));
      nextMessages = [...withoutTemp, newMessage];
    }

    // Keep unreadCount unchanged for current chat; update lastMessage.
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
      lastMessage: newMessage,
      lastMessageAt: newMessage?.createdAt || c.lastMessageAt || null,
      unreadCount: (c.unreadCount || 0) + 1,
    }));
    nextChats = meta.chats;
    nextGeneralChat = meta.generalChat;
  } else {
    const meta = updateChatInLists(nextChats, nextGeneralChat, chatId, (c) => ({
      ...c,
      lastMessage: newMessage,
      lastMessageAt: newMessage?.createdAt || c.lastMessageAt || null,
      // unreadCount unchanged
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


