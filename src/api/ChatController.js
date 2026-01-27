import BaseController from "./BaseController";
import api from "./axiosInstance";

export default class ChatController extends BaseController {
  static async getChats() {
    return super.handleRequest(
      async () => {
        const { data } = await api.get("/chats");
        return data.data || data.items || data;
      },
      "Ошибка при загрузке чатов:"
    );
  }

  static async ensureGeneralChat() {
    return super.handleRequest(
      async () => {
        const { data } = await api.post("/chats/general");
        return data.data || data.chat || data;
      },
      "Ошибка при создании общего чата:"
    );
  }

  static async getMessages(chatId, params = {}) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/chats/${chatId}/messages`, { params });
        return data.data || data.items || data;
      },
      "Ошибка при загрузке сообщений:"
    );
  }

  static async markAsRead(chatId, lastMessageId = null) {
    return super.handleRequest(
      async () => {
        const payload = {};
        if (lastMessageId) {
          payload.last_message_id = lastMessageId;
        }
        const { data } = await api.post(`/chats/${chatId}/read`, payload);
        return data.data || data;
      },
      "Ошибка при отметке чата как прочитанного:"
    );
  }

  static async startDirectChat(userId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.post("/chats/direct", { user_id: userId });
        return data.data || data.chat || data;
      },
      "Ошибка при создании личного чата:"
    );
  }

  static async createGroupChat(payload) {
    return super.handleRequest(
      async () => {
        const { data } = await api.post("/chats/groups", payload);
        return data.data || data.chat || data;
      },
      "Ошибка при создании группового чата:"
    );
  }

  static async sendMessage(chatId, { body = "", files = [], parent_id = null } = {}) {
    return super.handleRequest(
      async () => {
        const formData = new FormData();
        if (body) {
          formData.append("body", body);
        }
        if (parent_id) {
          formData.append("parent_id", parent_id);
        }
        (files || []).forEach((file) => {
          formData.append("files[]", file);
        });

        const { data } = await api.post(`/chats/${chatId}/messages`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        return data.data || data.message || data;
      },
      "Ошибка при отправке сообщения:"
    );
  }

  static async updateMessage(chatId, messageId, body) {
    return super.handleRequest(
      async () => {
        const { data } = await api.put(`/chats/${chatId}/messages/${messageId}`, { body });
        return data.data || data.message || data;
      },
      "Ошибка при редактировании сообщения:"
    );
  }

  static async deleteMessage(chatId, messageId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.delete(`/chats/${chatId}/messages/${messageId}`);
        return data.data || data;
      },
      "Ошибка при удалении сообщения:"
    );
  }

  static async forwardMessage(chatId, messageId, targetChatId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.post(`/chats/${chatId}/messages/${messageId}/forward`, {
          target_chat_id: targetChatId,
        });
        return data.data || data.message || data;
      },
      "Ошибка при пересылке сообщения:"
    );
  }

  static async deleteChat(chatId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.delete(`/chats/${chatId}`);
        return data.data || data;
      },
      "Ошибка при удалении чата:"
    );
  }
}


