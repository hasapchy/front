import api from "./axiosInstance";
import BaseController from "./BaseController";

export default class CacheController extends BaseController {
  static async clearAllCache() {
    return super.handleRequest(
      async () => {
        const { data } = await api.post("/cache/clear");
        return data;
      },
      "Ошибка при очистке кэша:"
    );
  }
}

