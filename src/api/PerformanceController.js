// Заглушка для PerformanceController
// Модуль производительности отключен

export default class PerformanceController {
  static async getDatabaseMetrics() {
    return Promise.resolve({
      message: 'Модуль производительности отключен',
      database_info: {},
      server_info: {},
      sales_performance: {},
      clients_performance: {},
      products_performance: {},
      transactions_performance: {},
      projects_performance: {},
      users_performance: {},
      comments_performance: {},
      cash_registers_performance: {},
      invoices_performance: {},
      warehouses_performance: {},
      warehouse_receipts_performance: {},
      warehouse_writeoffs_performance: {},
      warehouse_transfers_performance: {},
      orders_performance: {},
      timeline_performance: {},
      table_sizes: [],
      cache_stats: {},
      cache_size: {}
    });
  }

  static async runPerformanceTest(testType = 'all') {
    return Promise.resolve({
      message: 'Модуль производительности отключен'
    });
  }

  static async getCacheStats() {
    return Promise.resolve({
      message: 'Модуль производительности отключен'
    });
  }

  static async clearCache() {
    return Promise.resolve({
      message: 'Модуль производительности отключен'
    });
  }

  static async getTableSizes() {
    return Promise.resolve([]);
  }

  static async getServerLogs() {
    return Promise.resolve({
      message: 'Модуль производительности отключен'
    });
  }
}
