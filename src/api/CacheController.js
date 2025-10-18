import api from "./axiosInstance";

const CacheController = {
  /**
   * Очистить весь кэш (Backend Laravel + Frontend localStorage)
   */
  async clearAllCache() {
    try {
      // Очищаем Laravel кэш
      const { data } = await api.post("/performance/cache/clear");
      
      return {
        success: true,
        message: data.message,
        backend_cleared: true
      };
    } catch (error) {
      console.error("Ошибка при очистке кэша:", error);
      throw error;
    }
  },
};

export default CacheController;

