export function isGroupLikeChat(chat) {
  return Boolean(chat && (chat.type === 'group' || chat.type === 'project'));
}

export function isChatListItem(item) {
  return Boolean(item && ['general', 'group', 'project'].includes(item.type));
}

export function chatIcon(chat) {
  if (!chat) {
    return 'fa-comments';
  }
  if (chat.type === 'general') {
    return 'fa-comments';
  }
  if (chat.type === 'direct') {
    return 'fa-user';
  }
  if (chat.type === 'project') {
    return 'fa-folder-open';
  }
  if (chat.type === 'group') {
    return 'fa-users';
  }
  return 'fa-comments';
}

export function groupLikeChatFallbackTitle(chat) {
  if (!chat) {
    return '';
  }
  if (chat.type === 'project') {
    return `Проект #${chat.projectId || chat.id}`;
  }
  if (chat.type === 'group') {
    return `Групповой чат #${chat.id}`;
  }
  return '';
}
