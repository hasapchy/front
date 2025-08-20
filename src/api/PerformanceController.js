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

  static async analyzeIndexes() {
    try {
      const response = await api.get("/performance/analyze-indexes");
      return response.data;
    } catch (error) {
      console.error("Ошибка при анализе индексов:", error);
      
      // Если это ошибка сервера с деталями, логируем их
      if (error.response?.status === 500 && error.response?.data) {
        console.error("Детали ошибки сервера:", error.response.data);
        
        // Проверяем, связана ли ошибка с несовместимостью версий MySQL
        if (error.response.data.error && 
            (error.response.data.error.includes('performance_schema') || 
             error.response.data.error.includes('Column not found') ||
             error.response.data.error.includes('Base table or view not found'))) {
          
          // Возвращаем fallback данные для случаев, когда performance_schema недоступен
          return {
            error: 'index_analysis_not_supported',
            message: 'Анализ индексов недоступен: performance_schema не включен или недоступен',
            mysql_version: 'modern_but_disabled',
            recommendations: [
              {
                priority: 'high',
                message: 'Включите performance_schema в конфигурации MySQL',
                sql: 'SHOW VARIABLES LIKE "performance_schema"',
                type: 'configuration_requirement'
              },
              {
                priority: 'medium',
                message: 'Используйте SHOW INDEX для базового анализа индексов',
                sql: 'SHOW INDEX FROM table_name',
                type: 'alternative_method'
              },
              {
                priority: 'low',
                message: 'Проверьте права доступа к системным таблицам',
                sql: 'SHOW GRANTS',
                type: 'permission_check'
              }
            ]
          };
        }
      }
      
      throw error;
    }
  }

  static async getRealTimeMetrics() {
    try {
      const response = await api.get("/performance/real-time-metrics");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении метрик в реальном времени:", error);
      
      // Если это ошибка сервера с деталями, логируем их
      if (error.response?.status === 500 && error.response?.data) {
        console.error("Детали ошибки сервера:", error.response.data);
        
        // Проверяем, связана ли ошибка с несовместимостью версий MySQL
        if (error.response.data.error && 
            (error.response.data.error.includes('GLOBAL_STATUS') || 
             error.response.data.error.includes('Base table or view not found'))) {
          
          // Возвращаем fallback данные для случаев, когда системные таблицы недоступны
          return {
            error: 'real_time_metrics_not_supported',
            message: 'Метрики в реальном времени недоступны: системные таблицы недоступны или performance_schema отключен',
            mysql_version: 'modern_but_disabled',
            fallback_data: {
              active_connections: 'N/A',
              max_connections: 'N/A',
              innodb_stats: [],
              buffer_stats: [],
              timestamp: new Date().toISOString()
            },
            recommendations: [
              {
                priority: 'high',
                message: 'Включите performance_schema в конфигурации MySQL',
                sql: 'SHOW VARIABLES LIKE "performance_schema"',
                type: 'configuration_requirement'
              },
              {
                priority: 'medium',
                message: 'Проверьте права доступа к системным таблицам',
                sql: 'SHOW GRANTS',
                type: 'permission_check'
              }
            ]
          };
        }
      }
      
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

  // Метод для проверки доступности функций
  static async checkFeatureAvailability() {
    const features = {
      basic_metrics: true, // Основные метрики всегда доступны
      table_sizes: false,
      analyze_indexes: false,
      real_time_metrics: false,
      cache_stats: false,
      performance_tests: false
    };

    try {
      // Проверяем размеры таблиц
      await this.getTableSizes();
      features.table_sizes = true;
    } catch (error) {
      // Размеры таблиц недоступны
    }

    try {
      // Проверяем анализ индексов
      const indexResult = await this.analyzeIndexes();
      features.analyze_indexes = !indexResult.error;
    } catch (error) {
      // Анализ индексов недоступен
    }

    try {
      // Проверяем метрики в реальном времени
      const realTimeResult = await this.getRealTimeMetrics();
      features.real_time_metrics = !realTimeResult.error;
    } catch (error) {
      // Метрики в реальном времени недоступны
    }

    try {
      // Проверяем статистику кэша
      await this.getCacheStats();
      features.cache_stats = true;
    } catch (error) {
      // Статистика кэша недоступна
    }

    try {
      // Проверяем тесты производительности
      await this.runPerformanceTest('test');
      features.performance_tests = true;
    } catch (error) {
      // Тесты производительности недоступны
    }

    return features;
  }
}
