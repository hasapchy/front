<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-6">
      <TokenStatusComponent />
    </div>

    <!-- Кнопка обновления -->
    <div class="mb-6 flex justify-end">
      <button
        @click="refreshMetrics"
        :disabled="loading"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        <span>Обновить данные</span>
      </button>
    </div>

    <!-- Табы -->
    <div class="bg-white rounded-lg shadow">
      <!-- Навигация по табам -->
      <div class="border-b border-gray-200">
        <nav class="flex flex-wrap space-x-2 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :class="[
              'tab-button py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i :class="tab.icon" class="mr-1 sm:mr-2"></i>
            <span class="hidden sm:inline">{{ tab.name }}</span>
            <span class="sm:hidden">{{ tab.name.split(' ')[0] }}</span>
            <span v-if="tab.count !== null" class="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {{ tab.count }}
            </span>
        </button>
        </nav>
      </div>

      <!-- Содержимое табов -->
      <div class="p-4 sm:p-6">
        <!-- Индикатор загрузки -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
            <div class="text-gray-600">Загрузка данных...</div>
      </div>
        </div>

        <!-- Общая информация -->
        <transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'overview'" key="overview" class="space-y-6">
          <DatabaseInfoComponent :database-info="metrics.database_info" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div class="card-hover bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Статус системы</div>
              <div class="text-lg font-medium text-blue-800">Активна</div>
            </div>
            <div class="card-hover bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Время работы</div>
              <div class="text-lg font-medium text-green-800">{{ getUptime() }}</div>
            </div>
            <div class="card-hover bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Последнее обновление</div>
              <div class="text-lg font-medium text-purple-800">{{ getLastUpdate() }}</div>
        </div>
            </div>
            </div>

          <!-- Производительность -->
          <div v-else-if="activeTab === 'performance'" key="performance">
    <PerformanceMetricsComponent :metrics="metrics" />
          </div>
    
          <!-- База данных -->
          <div v-else-if="activeTab === 'database'" key="database">
    <TableSizesComponent 
      :table-sizes="metrics.table_sizes" 
      @update-table-sizes="updateTableSizes" 
    />
          </div>
    
          <!-- Кэш -->
          <div v-else-if="activeTab === 'cache'" key="cache">
    <CacheComponent />
          </div>
    
          <!-- Логи -->
          <div v-else-if="activeTab === 'logs'" key="logs">
    <ServerLogsComponent />
          </div>
        </transition>
      </div>
    </div>

    <!-- Общие ошибки -->
    <div v-if="error && !loading" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-triangle text-red-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Ошибка загрузки</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script>
import PerformanceController from '@/api/PerformanceController';
import notificationMixin from '@/mixins/notificationMixin';
import TokenStatusComponent from '@/views/components/app/TokenStatusComponent.vue';
import DatabaseInfoComponent from '@/views/components/performance/DatabaseInfoComponent.vue';
import PerformanceMetricsComponent from '@/views/components/performance/PerformanceMetricsComponent.vue';
import TableSizesComponent from '@/views/components/performance/TableSizesComponent.vue';
import CacheComponent from '@/views/components/performance/CacheComponent.vue';
import ServerLogsComponent from '@/views/components/performance/ServerLogsComponent.vue';

export default {
  name: 'PerformanceMonitorPage',
  mixins: [notificationMixin],
  components: { 
    TokenStatusComponent,
    DatabaseInfoComponent,
    PerformanceMetricsComponent,
    TableSizesComponent,
    CacheComponent,
    ServerLogsComponent
  },
  data() {
    return {
      metrics: {},
      loading: false,
      error: null,
      activeTab: 'overview',
      tabs: [
        {
          id: 'overview',
          name: 'Обзор',
          icon: 'fas fa-chart-pie',
          count: null
        },
        {
          id: 'performance',
          name: 'Производительность',
          icon: 'fas fa-tachometer-alt',
          count: null
        },
        {
          id: 'database',
          name: 'База данных',
          icon: 'fas fa-database',
          count: null
        },
        {
          id: 'cache',
          name: 'Кэш',
          icon: 'fas fa-memory',
          count: null
        },
        {
          id: 'logs',
          name: 'Логи',
          icon: 'fas fa-file-alt',
          count: null
        }
      ]
    };
  },
  async mounted() {
    // Восстанавливаем выбранный таб из localStorage
    const savedTab = localStorage.getItem('performance-monitor-active-tab');
    if (savedTab && this.tabs.find(tab => tab.id === savedTab)) {
      this.activeTab = savedTab;
    }
    
    await this.refreshMetrics();
  },
  methods: {
    updateTableSizes(tableSizes) {
      this.metrics = { ...this.metrics, table_sizes: tableSizes };
    },

    async refreshMetrics() {
      this.loading = true;
      this.error = null;
      
      try {
        this.metrics = await PerformanceController.getDatabaseMetrics();
        this.updateTabCounts();
        this.showNotification('Метрики обновлены', '', false);
      } catch (error) {
        this.showNotification('Ошибка загрузки метрик', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        
        if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.error = error.response.data.error;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Неизвестная ошибка при загрузке метрик';
        }
      } finally {
        this.loading = false;
      }
    },


    getUptime() {
      if (this.metrics.uptime) {
        const hours = Math.floor(this.metrics.uptime / 3600);
        const minutes = Math.floor((this.metrics.uptime % 3600) / 60);
        return `${hours}ч ${minutes}м`;
      }
      return 'N/A';
    },

    getLastUpdate() {
      if (this.metrics.last_updated) {
        return new Date(this.metrics.last_updated).toLocaleString('ru-RU');
      }
      return new Date().toLocaleString('ru-RU');
    },

    setActiveTab(tabId) {
      this.activeTab = tabId;
      localStorage.setItem('performance-monitor-active-tab', tabId);
    },

    updateTabCounts() {
      // Обновляем счетчики для каждого таба
      this.tabs.forEach(tab => {
        switch (tab.id) {
          case 'overview':
            tab.count = null; // Обзор не имеет счетчика
            break;
          case 'performance':
            tab.count = this.getPerformanceMetricsCount();
            break;
          case 'database':
            tab.count = this.metrics.table_sizes ? this.metrics.table_sizes.length : 0;
            break;
          case 'cache':
            tab.count = this.getCacheItemsCount();
            break;
          case 'logs':
            tab.count = this.getLogsCount();
            break;
        }
      });
    },

    getPerformanceMetricsCount() {
      let count = 0;
      if (this.metrics.sales_performance) count++;
      if (this.metrics.clients_performance) count++;
      if (this.metrics.products_performance) count++;
      if (this.metrics.comments_performance) count++;
      if (this.metrics.cash_registers_performance) count++;
      if (this.metrics.invoices_performance) count++;
      if (this.metrics.warehouses_performance) count++;
      if (this.metrics.warehouse_receipts_performance) count++;
      if (this.metrics.warehouse_writeoffs_performance) count++;
      if (this.metrics.warehouse_transfers_performance) count++;
      if (this.metrics.orders_performance) count++;
      return count;
    },

    getCacheItemsCount() {
      // Возвращаем примерное количество элементов кэша
      return this.metrics.cache_stats ? this.metrics.cache_stats.items_count || 0 : 0;
    },

    getLogsCount() {
      // Возвращаем количество строк в логах
      return this.metrics.server_logs ? this.metrics.server_logs.lines?.length || 0 : 0;
    }
  }
};
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

/* Анимация для кнопок табов */
.tab-button {
  transition: all 0.2s ease;
}

.tab-button:hover {
  transform: translateY(-1px);
}

/* Анимация для карточек */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
