import ChatController from '@/api/ChatController';
import { buildEntityShareRequest } from '@/utils/entityLinkUtils';

/**
 * @param {object} target
 * @returns {Promise<number|null>}
 */
export async function resolveChatTargetId(target) {
  if (!target) {
    return null;
  }
  if (target.type === 'user') {
    if (target.chatId) {
      return Number(target.chatId);
    }
    const chat = await ChatController.startDirectChat(target.id);
    return chat?.id ? Number(chat.id) : null;
  }
  return target.id != null ? Number(target.id) : null;
}

/**
 * @param {{ chatId: number, entityType: string, item: object, comment?: string }} params
 * @returns {Promise<object>}
 */
export async function sendEntityShareMessage({ chatId, entityType, item, comment = '' }) {
  const request = buildEntityShareRequest(entityType, item);
  if (!request) {
    throw new Error('Invalid entity share payload');
  }
  const body = String(comment || '').trim() || request.url;
  return ChatController.sendMessage(chatId, {
    body,
    files: [],
    parentId: null,
  });
}

/**
 * @param {{ entityType: string, item: object, target: object, comment?: string }} params
 * @returns {Promise<object>}
 */
export async function shareEntityToChat({ entityType, item, target, comment = '' }) {
  const chatId = await resolveChatTargetId(target);
  if (!chatId) {
    throw new Error('chat target not found');
  }
  const message = await sendEntityShareMessage({ chatId, entityType, item, comment });
  return { message, chatId };
}
