import api from "./axiosInstance";

const CommentController = {
  async getTimeline(type, id) {
    try {
      const { data } = await api.get("/comments/timeline", {
        params: { type, id },
      });
      return data;
    } catch (error) {
      console.error("Ошибка загрузки таймлайна:", error);
      throw error;
    }
  },

  async storeItem(item) {
    try {
      const { data } = await api.post("/comments", {
        type: item.type,
        id: item.id,
        body: item.body,
      });
      return data;
    } catch (error) {
      console.error("Ошибка создания комментария:", error);
      throw error;
    }
  },

  async create(type, id, body) {
    return this.storeItem({ type, id, body });
  },

  async updateItem(id, item) {
    try {
      const { data } = await api.put(`/comments/${id}`, { body: item.body || item });
      return data;
    } catch (error) {
      console.error("Ошибка обновления комментария:", error);
      throw error;
    }
  },

  async update(id, body) {
    return this.updateItem(id, body);
  },

  async deleteItem(id) {
    try {
      const { data } = await api.delete(`/comments/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка удаления комментария:", error);
      throw error;
    }
  },

  async delete(id) {
    return this.deleteItem(id);
  },
};

export default CommentController;
