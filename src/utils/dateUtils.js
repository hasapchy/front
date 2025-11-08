import dayjs from "dayjs";

export function dayjsDate(date, format = "DD MMM YYYYг") {
  return dayjs(date).locale("ru").format(format);
}

export function dayjsDateTime(date, format = "HH:mm DD MMM YYYYг") {
  return dayjs(date).locale("ru").format(format);
}

export function formatOrderDate(date) {
  if (!date) return '';
  const orderDate = new Date(date);
  return orderDate.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const dtoDateFormatters = {
  formatDate(date) {
    if (!date) return '';
    try {
      const formatted = dayjsDateTime(date);
      if (formatted && formatted.toLowerCase().includes('invalid')) {
        return '';
      }
      return formatted;
    } catch {
      return '';
    }
  },

  formatCreatedAt(createdAt) {
    return dayjsDate(createdAt);
  },

  formatUpdatedAt(updatedAt) {
    return dayjsDate(updatedAt);
  }
};