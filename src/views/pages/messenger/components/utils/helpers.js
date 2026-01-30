export const buildStorageUrl = (path) => `${import.meta.env.VITE_APP_BASE_URL}/storage/${path}`

export const parseDateSafe = (dateString) => {
  if (!dateString) return null
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString.replace(' ', 'T'))
  }
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export const extractHHmm = (raw) => {
  if (!raw) return ""
  const match = raw.match(/(\d{2}):(\d{2}):\d{2}/)
  if (match) {
    return `${match[1]}:${match[2]}`
  }
  const date = parseDateSafe(raw)
  if (!date) return ""
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}