// src/services/messengerFacade.js
// Facade that glues realtime events + state transitions + Vue component updates.

import ChatController from "@/api/ChatController";
import { applyIncomingMessage, applyLocalMessageMeta } from "@/services/chatState";

const readDebounceMap = new Map(); // chatId -> { timer, lastMessageId }

/**
 * Handle WS incoming chat message event and update Vue component state.
 * Keeps behavior identical to the previous MessengerPage.handleIncomingMessage.
 *
 * @param {any} vm Vue component instance (Options API)
 * @param {any} event WS payload (.chat.message.sent)
 * @returns {any} result from applyIncomingMessage
 */
export function handleIncomingChatEvent(vm, event) {
  const myUserId = vm?.$store?.state?.user?.id;
  const next = applyIncomingMessage(
    {
      messages: vm.messages,
      chats: vm.chats,
      generalChat: vm.generalChat,
      selectedChatId: vm.selectedChatId,
      myUserId,
    },
    event
  );

  vm.messages = next.messages;
  vm.chats = next.chats;
  vm.generalChat = next.generalChat;

  if (next.shouldScroll) {
    vm.$nextTick(() => vm.scrollToBottom());
  }

  // Keep server-side last_read_message_id in sync when user is currently in this chat
  // (debounced to avoid spamming).
  try {
    const chatId = Number(event?.chat_id);
    const selectedChatId = Number(vm?.selectedChatId);
    const myUserId = vm?.$store?.state?.user?.id;
    const isCurrentChat = chatId && selectedChatId && chatId === selectedChatId;
    const isMyMessage = myUserId && Number(event?.user?.id) === Number(myUserId);

    if (isCurrentChat && !isMyMessage && event?.id) {
      const key = chatId;
      const prev = readDebounceMap.get(key);
      if (prev?.timer) clearTimeout(prev.timer);

      const lastMessageId = Number(event.id);
      const timer = setTimeout(async () => {
        try {
          await ChatController.markAsRead(chatId, lastMessageId);
        } catch (_) {
          // ignore
        }
      }, 800);

      readDebounceMap.set(key, { timer, lastMessageId });
    }
  } catch (_) {
    // ignore
  }

  return next;
}

/**
 * Apply post-send message effects for the sender:
 * - clear composer handled by component
 * - update chat list meta immediately
 * - scroll to bottom
 *
 * @param {any} vm Vue component instance
 * @param {any} msg message returned from API
 * @returns {{chats:any[], generalChat:any}}
 */
export function applySentMessage(vm, msg) {
  const meta = applyLocalMessageMeta(
    { chats: vm.chats, generalChat: vm.generalChat },
    msg,
    vm?.$store?.state?.user?.id
  );
  vm.chats = meta.chats;
  vm.generalChat = meta.generalChat;

  vm.$nextTick(() => vm.scrollToBottom());

  return meta;
}

/**
 * Handle WS read-receipt event and update component state used for ✓ / ✓✓ rendering.
 *
 * Expected payload: { chat_id, creator_id, last_read_message_id }
 */
export function handleChatReadEvent(vm, event) {
  try {
    const chatId = Number(event?.chat_id);
    const userId = Number(event?.creator_id);
    const lastReadId = Number(event?.last_read_message_id);
    if (!chatId || !userId || !lastReadId) return;

    const myUserId = Number(vm?.$store?.state?.user?.id);
    if (myUserId && userId === myUserId) {
      // This is our own read update; no need for ✓/✓✓.
      return;
    }

    // Store peer read id for direct chats (used by UI ticks)
    if (!vm.peerReadByChatId) vm.peerReadByChatId = {};
    const prev = Number(vm.peerReadByChatId[chatId] || 0);
    if (lastReadId > prev) {
      vm.peerReadByChatId = { ...vm.peerReadByChatId, [chatId]: lastReadId };
    }

    // Also update chat list items if they include peer_last_read_message_id (non-breaking extra field)
    vm.chats = (vm.chats || []).map((c) => {
      if (!c || Number(c.id) !== chatId) return c;
      return { ...c, peer_last_read_message_id: Math.max(Number(c.peer_last_read_message_id || 0), lastReadId) };
    });
    if (vm.generalChat && Number(vm.generalChat.id) === chatId) {
      vm.generalChat = { ...vm.generalChat, peer_last_read_message_id: Math.max(Number(vm.generalChat.peer_last_read_message_id || 0), lastReadId) };
    }
  } catch (_) {
    // ignore
  }
}


