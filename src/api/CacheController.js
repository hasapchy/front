import api from "./axiosInstance";

/**
 * Контроллер для работы с кешем
 * @const CacheController
 */
const CacheController = {
  /**
   * Очистить весь кеш
   * @returns {Promise<Object>} Ответ от сервера
   */
  async clearAllCache() {
    const { data } = await api.post("/cache/clear");
    return data;
  },
};

export default CacheController;

