import api from "./axiosInstance";

export default class PerformanceController {
  static async getDatabaseMetrics() {
    try {
      const response = await api.get("/performance/metrics");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении метрик производительности:", error);
      throw error;
    }
  }

  static async runPerformanceTest(testType = 'all') {
    try {
      const response = await api.post("/performance/test", { test_type: testType });
      return response.data;
    } catch (error) {
      console.error("Ошибка при запуске теста производительности:", error);
      throw error;
    }
  }

  static async getCacheStats() {
    try {
      const response = await api.get("/performance/cache/stats");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении статистики кэша:", error);
      throw error;
    }
  }

  static async clearCache() {
    try {
      const response = await api.post("/performance/cache/clear");
      return response.data;
    } catch (error) {
      console.error("Ошибка при очистке кэша:", error);
      throw error;
    }
  }


  static async getTableSizes() {
    try {
      const response = await api.get("/performance/table-sizes");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении размеров таблиц:", error);
      throw error;
    }
  }

  static async getServerLogs() {
    try {
      const response = await api.get("/performance/server-logs");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении логов сервера:", error);
      throw error;
    }
  }

}
