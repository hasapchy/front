import api from "./axiosInstance";

const CacheController = {
  /**
   * Очистить весь кэш (Backend Laravel + Frontend localStorage)
   */
  async clearAllCache() {
    try {
      // Модуль производительности отключен
      // Очищаем только frontend localStorage
      localStorage.clear();
      
      return {
        success: true,
        message: 'Frontend кэш очищен',
        backend_cleared: false
      };
    } catch (error) {
      console.error("Ошибка при очистке кэша:", error);
      throw error;
    }
  },
};

export default CacheController;

