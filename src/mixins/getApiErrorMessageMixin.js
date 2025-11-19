export default {
  methods: {
    getApiErrorMessage(error) {
      if (!error) {
        return ["Неизвестная ошибка"];
      }

      if (Array.isArray(error)) {
        return error.filter(Boolean);
      }

      if (typeof error === "string") {
        return [error];
      }

      const messages = [];

      if (error?.response?.data) {
        const data = error.response.data;

        if (data.error_code === 'ORDER_EDIT_TIME_LIMIT_ACTIVE' || 
            data.error_code === 'ORDER_DELETE_TIME_LIMIT_ACTIVE') {
          const createdAt = data.created_at ? new Date(data.created_at).toLocaleString('ru-RU') : '';
          messages.push(`${data.message}${createdAt ? ` (создан: ${createdAt})` : ''}`);
          return messages;
        }

        if (data.errors && typeof data.errors === "object") {
          for (const field in data.errors) {
            if (Array.isArray(data.errors[field])) {
              messages.push(...data.errors[field]);
            }
          }
        }

        if (messages.length === 0) {
          if (data.error) messages.push(data.error);
          else if (data.message) messages.push(data.message);
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
