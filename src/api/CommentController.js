import api from "./axiosInstance";

/**
 * Контроллер для работы с комментариями
 * @class CommentController
 */
export default class CommentController {
  /**
   * Получить timeline комментариев для объекта
   * @param {string} type - Тип объекта (order, project, etc.)
   * @param {number|string} id - ID объекта
   * @returns {Promise<Object>} Данные timeline
   */
  static async getTimeline(type, id) {
    const { data } = await api.get("/comments/timeline", {
      params: { type, id },
    });
    return data;
  }

  /**
   * Создать новый комментарий
   * @param {Object} item - Данные комментария (type, id, body)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    const { data } = await api.post("/comments", {
      type: item.type,
      id: item.id,
      body: item.body,
    });
    return data;
  }

  /**
   * Обновить комментарий
   * @param {number|string} id - ID комментария
   * @param {Object|string} item - Данные комментария (body или объект с body)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    const { data } = await api.put(`/comments/${id}`, { body: item.body || item });
    return data;
  }

  /**
   * Удалить комментарий
   * @param {number|string} id - ID комментария
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const { data } = await api.delete(`/comments/${id}`);
    return data;
  }
}
