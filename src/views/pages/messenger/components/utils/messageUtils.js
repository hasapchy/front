export const isMyMessage = (message, currentUserId) => {
    if (!message || !currentUserId) return false
    const userId = message.user_id || message.userId || message.user?.id
    return userId && Number(userId) === Number(currentUserId)
  }
  
  export const getMessageUser = (message) => {
    if (!message) return null
    if (message.user && message.user.id) {
      return message.user
    }
    const userId = message.user_id || message.userId
    // Возвращаем null, так как для получения полной информации нужен доступ к списку пользователей
    return { id: userId }
  }