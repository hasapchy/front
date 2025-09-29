export default {
  methods: {
    getApiErrorMessage(error) {
      const messages = [];

      if (error?.response?.data) {
        const data = error.response.data;

        // Проверяем специальные ошибки времени
        if (data.error_code === 'ORDER_EDIT_TIME_LIMIT_ACTIVE' || 
            data.error_code === 'ORDER_DELETE_TIME_LIMIT_ACTIVE') {
          const hoursRemaining = data.hours_remaining || 0;
          const createdAt = data.created_at ? new Date(data.created_at).toLocaleString('ru-RU') : '';
          
          messages.push(`${data.message}${createdAt ? ` (создан: ${createdAt})` : ''}`);
          return messages;
        }

        // Сначала проверяем наличие детальных ошибок валидации
        if (typeof data.errors === "object") {
          for (const field in data.errors) {
            if (Array.isArray(data.errors[field])) {
              messages.push(...data.errors[field]);
            }
          }
        }

        // Если нет детальных ошибок, добавляем общее сообщение
        if (messages.length === 0 && typeof data.message === "string") {
          messages.push(data.message);
        }
      }

      if (messages.length === 0 && error.message) {
        messages.push(error.message);
      }

      if (messages.length === 0) {
        messages.push("Неизвестная ошибка");
      }

      return messages;
    },
  },
};
