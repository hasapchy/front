import { translateFlatApiErrorPayload } from '@/api/apiErrorMessage';

export default {
  methods: {
    getApiErrorMessage(error) {
      if (!error) {
        return ["Unknown error"];
      }

      if (Array.isArray(error)) {
        return error.filter(Boolean);
      }

      if (!error?.response?.data && error?.trim?.()) return [error];

      const messages = [];

      if (error?.response?.data) {
        const data = error.response.data;

        if (data.error_code === 'ORDER_EDIT_TIME_LIMIT_ACTIVE' || 
            data.error_code === 'ORDER_DELETE_TIME_LIMIT_ACTIVE') {
          const createdAt = data.created_at ? new Date(data.created_at).toLocaleString('ru-RU') : '';
          messages.push(`${data.message}${createdAt ? ` (created: ${createdAt})` : ''}`);
          return messages;
        }

        const flatTranslated = translateFlatApiErrorPayload(data);
        if (flatTranslated) {
          messages.push(flatTranslated);
          return messages;
        }

        if (data.errors) {
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
        messages.push("Unknown error");
      }

      return messages;
    },

    apiErrorLinesAsString(error) {
      const lines = this.getApiErrorMessage(error);
      return Array.isArray(lines) ? lines.filter(Boolean).join(', ') : String(lines || '');
    },
  },
};
