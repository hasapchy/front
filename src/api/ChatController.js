import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class ChatController extends BaseController {
  static normalizeFile(file) {
    if (!file) return file;
    return {
      ...file,
      mimeType: file.mime_type,
    };
  }

  static normalizeReaction(reaction) {
    if (!reaction) return reaction;
    return {
      ...reaction,
      creatorId: reaction.creator_id,
    };
  }

  static normalizeMessage(message) {
    if (!message) return message;
    return {
      ...message,
      chatId: message.chat_id,
      creatorId: message.creator_id,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      editedAt: message.edited_at,
      isEdited: message.is_edited,
      parentId: message.parent_id,
      forwardedFrom: message.forwarded_from,
      files: (message.files || []).map((file) => this.normalizeFile(file)),
      reactions: (message.reactions || []).map((reaction) => this.normalizeReaction(reaction)),
    };
  }

  static normalizeChat(chat) {
    if (!chat) return chat;
    return {
      ...chat,
      unreadCount: chat.unread_count,
      lastMessageAt: chat.last_message_at,
      lastMessage: this.normalizeMessage(chat.last_message),
      pinnedMessage: this.normalizeMessage(chat.pinned_message),
      peerLastReadMessageId: chat.peer_last_read_message_id,
      directKey: chat.direct_key,
      createdBy: chat.created_by,
    };
  }

  static async getChats() {
    return super.handleRequest(
      async () => {
        const data = await super.getData("/chats");
        return (data || []).map((chat) => this.normalizeChat(chat));
      },
      apiErrorMessage("chatsLoad")
    );
  }

  static async ensureGeneralChat() {
    return super.handleRequest(
      async () => {
        return super.postData("/chats/general");
      },
      apiErrorMessage("chatEnsureGeneral")
    );
  }

  static async getMessages(chatId, params = {}) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/chats/${chatId}/messages`, { params });
        return (data || []).map((message) => this.normalizeMessage(message));
      },
      apiErrorMessage("messagesLoad")
    );
  }

  static async searchMessages(chatId, q, params = {}) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/chats/${chatId}/messages/search`, { params: { q, ...params } });
        return (data || []).map((message) => this.normalizeMessage(message));
      },
      apiErrorMessage("messagesSearch")
    );
  }

  static async markAsRead(chatId, lastMessageId = null) {
    return super.handleRequest(
      async () => {
        const payload = {};
        if (lastMessageId) {
          payload.lastMessageId = lastMessageId;
        }
        return super.postData(`/chats/${chatId}/read`, payload);
      },
      apiErrorMessage("chatMarkRead")
    );
  }

  static async sendTyping(chatId) {
    if (!chatId) return { ok: false };
    try {
      await super.post(`/chats/${chatId}/typing`);
      return { ok: true };
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.error('sendTyping:', e?.message || e);
      }
      return { ok: false };
    }
  }

  static async startDirectChat(userId) {
    return super.handleRequest(
      async () => {
        return super.postData("/chats/direct", { creatorId: userId });
      },
      apiErrorMessage("chatDirectCreate")
    );
  }

  static async createGroupChat(payload) {
    return super.handleRequest(
      async () => {
        return super.postData("/chats/groups", payload);
      },
      apiErrorMessage("chatGroupCreate")
    );
  }

  static async sendMessage(chatId, { body = "", files = [], parentId = null } = {}) {
    return super.handleRequest(
      async () => {
        const formData = new FormData();
        if (body) {
          formData.append("body", body);
        }
        if (parentId) {
          formData.append("parent_id", parentId);
        }
        (files || []).forEach((file) => {
          formData.append("files[]", file);
        });

        const data = await super.postData(`/chats/${chatId}/messages`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return this.normalizeMessage(data);
      },
      apiErrorMessage("messageSend")
    );
  }

  static async updateMessage(chatId, messageId, body, files = null) {
    return super.handleRequest(
      async () => {
        const payload = { body };
        if (files && Array.isArray(files)) {
          payload.files = files;
        }
        const data = await super.putData(`/chats/${chatId}/messages/${messageId}`, payload);
        return this.normalizeMessage(data);
      },
      apiErrorMessage("messageEdit")
    );
  }

  static async deleteMessage(chatId, messageId) {
    return super.handleRequest(
      async () => {
        return super.deleteData(`/chats/${chatId}/messages/${messageId}`);
      },
      apiErrorMessage("messageDelete")
    );
  }

  static async forwardMessage(chatId, messageId, targetChatId) {
    return super.handleRequest(
      async () => {
        return super.postData(`/chats/${chatId}/messages/${messageId}/forward`, {
          targetChatId: targetChatId,
        });
      },
      apiErrorMessage("messageForward")
    );
  }

  static async deleteChat(chatId) {
    return super.handleRequest(
      async () => {
        return super.deleteData(`/chats/${chatId}`);
      },
      apiErrorMessage("chatDelete")
    );
  }

  static async pinMessage(chatId, messageId) {
    return super.handleRequest(
      async () => {
        const data = await super.postData(`/chats/${chatId}/messages/${messageId}/pin`);
        return {
          ...data,
          chat: this.normalizeChat(data?.chat),
        };
      },
      apiErrorMessage("messagePin")
    );
  }

  static async unpinMessage(chatId) {
    return super.handleRequest(
      async () => {
        return super.deleteData(`/chats/${chatId}/pin`);
      },
      apiErrorMessage("messageUnpin")
    );
  }

  static async setReaction(chatId, messageId, emoji) {
    return super.handleRequest(
      async () => {
        const payload = emoji != null && emoji !== "" ? { emoji } : {};
        const data = await super.postData(`/chats/${chatId}/messages/${messageId}/reaction`, payload);
        return data.reactions.map((reaction) => this.normalizeReaction(reaction));
      },
      apiErrorMessage("messageReaction")
    );
  }
}


