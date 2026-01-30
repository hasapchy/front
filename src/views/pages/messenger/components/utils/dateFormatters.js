import { parseDateSafe, extractHHmm } from './helpers'

export const formatDayLabel = (date, i18n) => {
  if (!date) return i18n.t('today')
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.getTime())) return i18n.t('today')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const messageDay = new Date(dateObj)
  messageDay.setHours(0, 0, 0, 0)

  const diffTime = today - messageDay
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const locale = i18n.locale || 'ru'
  
  if (diffDays === 0) return i18n.t('today')
  if (diffDays === 1) return i18n.t('yesterday')
  if (diffDays === 2) return i18n.t('dayBeforeYesterday')
  
  if (diffDays < 7) {
    const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' }
    const dateLocale = localeMap[locale] || 'ru-RU'
    return dateObj.toLocaleDateString(dateLocale, { weekday: "long" })
  }
  
  const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' }
  const dateLocale = localeMap[locale] || 'ru-RU'
  return dateObj.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })
}

export const formatChatTime = (item, i18n) => {
  const raw = item.last_message_at || item.last_message?.created_at
  if (!raw) return ""
  
  const date = parseDateSafe(raw)
  if (!date) return extractHHmm(raw)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const messageDay = new Date(date)
  messageDay.setHours(0, 0, 0, 0)

  const diffTime = today - messageDay
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const locale = i18n.locale || 'ru'
  const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' }
  const dateLocale = localeMap[locale] || 'ru-RU'

  if (diffDays === 0) return extractHHmm(raw)
  if (diffDays === 1) return i18n.t('yesterday')
  if (diffDays < 7) return date.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })
  return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })
}

export const messageTime = (message) => {
  const raw = message.created_at || message.createdAt || null
  return extractHHmm(raw)
}