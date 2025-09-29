/**
 * Утилиты для работы с временными ограничениями
 */

// Смещение времени между клиентом и сервером (в миллисекундах)
let serverTimeOffset = 0

/**
 * Синхронизирует время клиента с сервером
 * @param {string|Date} serverTime - Время сервера
 */
export function syncServerTime(serverTime) {
  const serverTimestamp = new Date(serverTime).getTime()
  const clientTimestamp = Date.now()
  serverTimeOffset = serverTimestamp - clientTimestamp
}

/**
 * Получает текущее серверное время
 * @returns {Date} - Серверное время
 */
export function getServerTime() {
  return new Date(Date.now() + serverTimeOffset)
}

/**
 * Проверяет, можно ли редактировать заказ (не прошло ли ограничение по времени)
 * @param {string|Date} createdAt - Дата создания заказа
 * @param {number} timeLimitHours - Лимит времени в часах (по умолчанию 8)
 * @returns {boolean} - true если заказ можно редактировать, false если заблокирован
 */
export function canEditOrder(createdAt, timeLimitHours = 8) {
  if (!createdAt) return true
  
  const orderDate = new Date(createdAt)
  const timeLimitFromCreation = new Date(orderDate.getTime() + timeLimitHours * 60 * 60 * 1000)
  const now = getServerTime() // Используем серверное время
  
  return now >= timeLimitFromCreation
}

/**
 * Проверяет, заблокирован ли заказ для редактирования
 * @param {string|Date} createdAt - Дата создания заказа
 * @param {number} timeLimitHours - Лимит времени в часах (по умолчанию 8)
 * @returns {boolean} - true если заказ заблокирован, false если можно редактировать
 */
export function isOrderLocked(createdAt, timeLimitHours = 8) {
  return !canEditOrder(createdAt, timeLimitHours)
}

/**
 * Вычисляет количество часов до разблокировки заказа
 * @param {string|Date} createdAt - Дата создания заказа
 * @param {number} timeLimitHours - Лимит времени в часах (по умолчанию 8)
 * @returns {number} - Количество часов до разблокировки (0 если уже разблокирован)
 */
export function getHoursUntilUnlock(createdAt, timeLimitHours = 8) {
  if (!createdAt) return 0
  
  const orderDate = new Date(createdAt)
  const timeLimitFromCreation = new Date(orderDate.getTime() + timeLimitHours * 60 * 60 * 1000)
  const now = getServerTime() // Используем серверное время
  
  if (now >= timeLimitFromCreation) return 0
  
  return Math.ceil((timeLimitFromCreation - now) / (1000 * 60 * 60))
}

/**
 * Форматирует дату для отображения пользователю
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} - Отформатированная дата
 */
export function formatOrderDate(date) {
  if (!date) return ''
  
  const orderDate = new Date(date)
  return orderDate.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Получает конфигурацию времени ограничений
 * @returns {Object} - Объект с настройками времени
 */
export function getTimeConfig() {
  // Простые константы - можно изменить здесь при необходимости
  return {
    basementOrderEditLimitHours: 8,
    basementOrderDeleteLimitHours: 8
  }
}

