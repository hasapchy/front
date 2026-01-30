export const getItemTitle = (item) => {
  if (item.type === 'user') {
    return item.displayTitle || `${item.name || ""} ${item.surname || ""}`.trim() || "Пользователь"
  }
  return item.title || item.name || (item.type === 'general' ? "Общий чат" : `Чат #${item.id}`)
}

export const getItemPreview = (item) => {
  if (item.last_message?.body) {
    return item.last_message.body
  }
  if (item.type === 'user') {
    return item.position || "Сотрудник"
  }
  return ""
}

export const getMessageUserName = (message) => {
  const user = getMessageUser(message)
  if (!user) {
    const userId = message.user_id || message.userId || message.user?.id
    return userId ? `Пользователь #${userId}` : "Неизвестный"
  }
  const name = user.name || ""
  const surname = user.surname || ""
  return `${name} ${surname}`.trim() || user.displayTitle || "Пользователь"
}

export const getMessagePreview = (message) => {
  return message.body || (message.files?.length ? `Файлов: ${message.files.length}` : '')
}

export const getForwardedUserName = (forwardedMessage) => {
  if (!forwardedMessage) return "Неизвестный"
  const user = forwardedMessage.user
  if (!user) return "Неизвестный"
  const name = user.name || ""
  const surname = user.surname || ""
  return `${name} ${surname}`.trim() || "Пользователь"
}

export const getUserInitials = (user) => {
  if (!user) return ""
  const name = (user.name || "").charAt(0).toUpperCase()
  const surname = (user.surname || "").charAt(0).toUpperCase()
  return (name + surname) || "?"
}

// Для получения пользователя из сообщения с учетом текущего пользователя
export const getMessageUser = (message, usersForCompany, currentUser) => {
  if (!message) return null
  
  // Check if message has user object directly
  if (message.user && message.user.id) {
    const userId = message.user.id
    if (currentUser && Number(currentUser.id) === Number(userId)) {
      return currentUser
    }
    const users = usersForCompany || []
    return users.find(u => u && Number(u.id) === Number(userId)) || message.user
  }
  
  const userId = message.user_id || message.userId || message.user?.id
  if (!userId) return null
  
  // Проверяем, это текущий пользователь?
  if (currentUser && Number(currentUser.id) === Number(userId)) {
    return currentUser
  }
  
  // Ищем пользователя в списке пользователей компании
  const users = usersForCompany || []
  return users.find(u => u && Number(u.id) === Number(userId)) || null
}