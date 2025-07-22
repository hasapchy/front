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

  async create(type, id, body) {
    try {
      const { data } = await api.post("/comments", {
        type,
        id,
        body,
      });
      return data;
    } catch (error) {
      console.error("Ошибка создания комментария:", error);
      throw error;
    }
  },

  async update(id, body) {
    try {
      const { data } = await api.put(`/comments/${id}`, { body });
      return data;
    } catch (error) {
      console.error("Ошибка обновления комментария:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { data } = await api.delete(`/comments/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка удаления комментария:", error);
      throw error;
    }
  },
};

export default CommentController;
