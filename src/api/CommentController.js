import api from "./axiosInstance";
import BaseController from "./BaseController";

export default class CommentController extends BaseController {
  static async getTimeline(type, id) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get("/comments/timeline", {
          params: { type, id },
        });
        return data;
      },
      "Ошибка загрузки таймлайна:"
    );
  }

  static async storeItem(item) {
    return super.storeItem("/comments", {
      type: item.type,
      id: item.id,
      body: item.body,
    });
  }

  static async updateItem(id, item) {
    return super.updateItem("/comments", id, { body: item.body || item });
  }

  static async deleteItem(id) {
    return super.deleteItem("/comments", id);
  }

  static async create(type, id, body) {
    return this.storeItem({ type, id, body });
  }
}
