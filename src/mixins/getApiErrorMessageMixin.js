export default {
  methods: {
    getApiErrorMessage(error) {
      const messages = [];

      if (error?.response?.data) {
        const data = error.response.data;

        if (typeof data.message === "string") {
          messages.push(data.message);
        }

        if (typeof data.errors === "object") {
          for (const field in data.errors) {
            if (Array.isArray(data.errors[field])) {
              messages.push(...data.errors[field]);
            }
          }
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
