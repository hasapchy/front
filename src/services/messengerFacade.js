import ChatController from "@/api/ChatController";
import { applyIncomingMessage, applyLocalMessageMeta } from "@/services/chatState";

const readDebounceMap = new Map();

function normalizeMessageEvent(event) {
  if (!event) return event;
  return {
    ...event,
    chatId: event.chatId,
  };
}

function normalizeReadEvent(event) {
  if (!event) return event;
  return {
    ...event,
    chatId: event.chatId,
    creatorId: event.creatorId,
    lastReadMessageId: event.lastReadMessageId,
  };
}

export function handleIncomingChatEvent(vm, event) {
  const normalizedEvent = normalizeMessageEvent(event);
  const myUserId = vm?.$store?.state?.user?.id;
  const next = applyIncomingMessage(
    {
      messages: vm.messages,
      chats: vm.chats,
      generalChat: vm.generalChat,
      selectedChatId: vm.selectedChatId,
      myUserId,
    },
    normalizedEvent
  );

  vm.messages = next.messages;
  vm.chats = next.chats;
  vm.generalChat = next.generalChat;

  if (next.shouldScroll) {
    vm.$nextTick(() => vm.scrollToBottom(false));
  }

  try {
    const chatId = Number(normalizedEvent?.chatId);
    const selectedChatId = Number(vm?.selectedChatId);
    const myUserIdForRead = vm?.$store?.state?.user?.id;
    const isCurrentChat = chatId && selectedChatId && chatId === selectedChatId;
    const isMyMessage =
      myUserIdForRead && Number(normalizedEvent?.user?.id) === Number(myUserIdForRead);

    if (isCurrentChat && !isMyMessage && normalizedEvent?.id) {
      const key = chatId;
      const prev = readDebounceMap.get(key);
      if (prev?.timer) clearTimeout(prev.timer);

      const lastMessageId = Number(normalizedEvent.id);
      const timer = setTimeout(async () => {
        try {
          await ChatController.markAsRead(chatId, lastMessageId);
        } catch {
          return;
        }
      }, 800);

      readDebounceMap.set(key, { timer, lastMessageId });
    }
  } catch {
    return next;
  }

  return next;
}

export function applySentMessage(vm, msg) {
  const meta = applyLocalMessageMeta(
    { chats: vm.chats, generalChat: vm.generalChat },
    msg,
    vm?.$store?.state?.user?.id
  );
  vm.chats = meta.chats;
  vm.generalChat = meta.generalChat;

  vm.$nextTick(() => vm.scrollToBottom(true));

  return meta;
}

export function handleChatReadEvent(vm, event) {
  try {
    const normalizedEvent = normalizeReadEvent(event);
    const chatId = Number(normalizedEvent?.chatId);
    const userId = Number(normalizedEvent?.creatorId);
    const lastReadId = Number(normalizedEvent?.lastReadMessageId);
    if (!chatId || !userId || !lastReadId) return;

    const myUserId = Number(vm?.$store?.state?.user?.id);
    if (myUserId && userId === myUserId) {
      return;
    }

    if (!vm.peerReadByChatId) vm.peerReadByChatId = {};
    const prev = Number(vm.peerReadByChatId[chatId] || 0);
    if (lastReadId > prev) {
      vm.peerReadByChatId = { ...vm.peerReadByChatId, [chatId]: lastReadId };
    }

    vm.chats = (vm.chats || []).map((c) => {
      if (!c || Number(c.id) !== chatId) return c;
      return {
        ...c,
        peerLastReadMessageId: Math.max(
          Number(c.peerLastReadMessageId || 0),
          lastReadId
        ),
      };
    });
    if (vm.generalChat && Number(vm.generalChat.id) === chatId) {
      vm.generalChat = {
        ...vm.generalChat,
        peerLastReadMessageId: Math.max(
          Number(vm.generalChat.peerLastReadMessageId || 0),
          lastReadId
        ),
      };
    }
  } catch {
    return;
  }
}
