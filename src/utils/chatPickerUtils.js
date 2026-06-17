import { isChatListItem, isGroupLikeChat } from '@/utils/chatTypes';
import { getUserDisplayName } from '@/utils/displayUtils';

/**
 * @param {object|null|undefined} chat
 * @param {number|null|undefined} currentUserId
 * @returns {number|null}
 */
export function getChatPeerUserId(chat, currentUserId) {
  const participants = chat?.participants || [];
  const peer = participants.find((p) => Number(p.id ?? p.user_id ?? p.userId) !== Number(currentUserId));
  return peer ? Number(peer.id ?? peer.user_id ?? peer.userId) : null;
}

/**
 * @param {{ chats?: object[], users?: object[], currentUserId?: number|null, excludeChatId?: number|string|null }} params
 * @returns {object[]}
 */
export function buildChatPickerItems({
  chats = [],
  users = [],
  currentUserId = null,
  excludeChatId = null,
} = {}) {
  const list = [];
  const general = chats.find((c) => c.type === 'general');
  if (general) {
    list.push({ ...general, type: 'general' });
  }

  chats.filter((c) => c.type === 'direct').forEach((chat) => {
    const peerId = getChatPeerUserId(chat, currentUserId);
    const user = users.find((u) => Number(u.id) === Number(peerId));
    if (user) {
      list.push({
        ...chat,
        type: 'user',
        ...user,
        displayTitle: getUserDisplayName(user),
        chatId: chat.id,
      });
    }
  });

  chats.filter((c) => isGroupLikeChat(c)).forEach((chat) => {
    list.push({ ...chat, type: chat.type });
  });

  if (excludeChatId == null) {
    return list;
  }

  const excludeId = Number(excludeChatId);
  return list.filter((item) => {
    const id = item.chatId ?? item.id;
    return Number(id) !== excludeId;
  });
}

/**
 * @param {object|null|undefined} chat
 * @returns {string}
 */
export function getChatPickerTitle(chat) {
  if (chat?.displayTitle) {
    return chat.displayTitle;
  }
  if (chat?.type === 'user') {
    return getUserDisplayName(chat);
  }
  if (isChatListItem(chat)) {
    return chat.title || `#${chat.id}`;
  }
  return chat?.title || '';
}
