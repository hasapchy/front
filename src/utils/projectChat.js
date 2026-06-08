import ChatController from '@/api/ChatController';

export function hasChatsViewPermission(getters) {
  return getters.hasPermission('chats_view_all') || getters.hasPermission('chats_view');
}

export function getProjectChatFromStore(store, projectId) {
  const id = Number(projectId);
  if (!id) {
    return null;
  }
  return (store.getters.chats || []).find(
    (chat) => chat?.type === 'project' && Number(chat.projectId) === id
  ) || null;
}

export function getProjectChatUnread(store, projectId) {
  const chat = getProjectChatFromStore(store, projectId);
  const count = Number(chat?.unreadCount);
  return count > 0 ? count : 0;
}

export async function openProjectChat(router, projectId) {
  const chat = await ChatController.ensureProjectChat(projectId);
  if (!chat?.id) {
    return null;
  }
  await router.push({
    path: '/messenger',
    query: { open_chat: String(chat.id) },
  });
  return chat;
}
