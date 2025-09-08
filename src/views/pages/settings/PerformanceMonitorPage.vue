<template>
  <div class="p-6">
    <div class="mb-6">
      <TokenStatusComponent />
    </div>

    <!-- Кнопки управления -->
    <div class="mb-6 flex flex-wrap gap-4">
      <button
        @click="refreshMetrics"
        :disabled="loading"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        <span>Обновить метрики</span>
      </button>
      
      <button
        @click="runFullTest"
        :disabled="loading"
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-play"></i>
        <span>Запустить полный тест</span>
      </button>

      <div class="relative">
        <button
          @click="toggleTestDropdown"
          :disabled="loading"
          class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-vial"></i>
          <span>Тесты производительности</span>
          <i class="fas fa-chevron-down ml-2" :class="{ 'fa-chevron-up': showTestDropdown }"></i>
        </button>
        <div 
          v-if="showTestDropdown" 
          class="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 transition-all duration-200 ease-in-out transform origin-top"
          :class="{ 'scale-95 opacity-0': !showTestDropdown, 'scale-100 opacity-100': showTestDropdown }"
        >
          <div class="py-2">
            <button
              @click="runSalesTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-chart-line text-purple-600"></i>
              <span>Тест продаж</span>
            </button>
            
            <button
              @click="runClientsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-users text-blue-600"></i>
              <span>Тест клиентов</span>
            </button>
            
            <button
              @click="runProductsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-box text-green-600"></i>
              <span>Тест продуктов</span>
            </button>
            
            <button
              @click="runTransactionsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-money-bill-wave text-yellow-600"></i>
              <span>Тест транзакций</span>
            </button>
            
            <button
              @click="runWarehousesTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-warehouse text-indigo-600"></i>
              <span>Тест складов</span>
            </button>
            
            <button
              @click="runOrdersTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-shopping-cart text-pink-600"></i>
              <span>Тест заказов</span>
            </button>
            
            <button
              @click="runProjectsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-project-diagram text-orange-600"></i>
              <span>Тест проектов</span>
            </button>
            
            <button
              @click="runUsersTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-user-friends text-teal-600"></i>
              <span>Тест пользователей</span>
            </button>
            
            <button
              @click="runCommentsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-comments text-cyan-600"></i>
              <span>Тест комментариев</span>
            </button>
            
            <button
              @click="runTimelineTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-clock text-violet-600"></i>
              <span>Тест таймлайна</span>
            </button>

      <button
              @click="runCashRegistersTest"
        :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-cash-register text-emerald-600"></i>
              <span>Тест касс</span>
        </button>
      </div>
        </div>
            </div>
            </div>

    <!-- Компоненты -->
    <DatabaseInfoComponent :database-info="metrics.database_info" />
    
    <PerformanceMetricsComponent :metrics="metrics" />
    
    <TableSizesComponent 
      :table-sizes="metrics.table_sizes" 
      @update-table-sizes="updateTableSizes" 
    />
    
    <CacheComponent />
    
    <ServerLogsComponent />
    
    <SlowQueriesComponent :slow-queries="metrics.slow_queries" />




    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
        <div class="text-gray-600">Загрузка метрик...</div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
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
import SlowQueriesComponent from '@/views/components/performance/SlowQueriesComponent.vue';

export default {
  name: 'PerformanceMonitorPage',
  mixins: [notificationMixin],
  components: { 
    TokenStatusComponent,
    DatabaseInfoComponent,
    PerformanceMetricsComponent,
    TableSizesComponent,
    CacheComponent,
    ServerLogsComponent,
    SlowQueriesComponent
  },
  data() {
    return {
      metrics: {},
      loading: false,
      error: null,
      showTestDropdown: false
    };
  },
  async mounted() {
    await this.refreshMetrics();
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
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

    async runFullTest() {
      this.loading = true;
      this.error = null;
      
      try {
        await PerformanceController.runPerformanceTest('all');
        this.showNotification('Тест производительности завершен', '', false);
        // Обновляем метрики после теста
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async runSalesTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false;
      
      try {
        await PerformanceController.runPerformanceTest('sales_list');
        this.showNotification('Тест продаж завершен', '', false);
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async runClientsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false;
      
      try {
        await PerformanceController.runPerformanceTest('clients_list');
        this.showNotification('Тест клиентов завершен', '', false);
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async runProductsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false;
      
      try {
        await PerformanceController.runPerformanceTest('products_list');
        this.showNotification('Тест продуктов завершен', '', false);
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async runTransactionsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false;
      
      try {
        await PerformanceController.runPerformanceTest('transactions_list');
        this.showNotification('Тест транзакций завершен', '', false);
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async runWarehousesTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false;
      
      try {
        await PerformanceController.runPerformanceTest('warehouses_list');
        this.showNotification('Тест складов завершен', '', false);
        await this.refreshMetrics();
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

         async runOrdersTest() {
       this.loading = true;
       this.error = null;
       this.showTestDropdown = false;
       
       try {
         await PerformanceController.runPerformanceTest('orders_list');
         this.showNotification('Тест заказов завершен', '', false);
         await this.refreshMetrics();
       } catch (error) {
         this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
         this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
       } finally {
         this.loading = false;
       }
     },

           async runProjectsTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false;
        
        try {
          await PerformanceController.runPerformanceTest('projects_list');
          this.showNotification('Тест проектов завершен', '', false);
          await this.refreshMetrics();
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        } finally {
          this.loading = false;
        }
      },

      async runUsersTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false;
        
        try {
          await PerformanceController.runPerformanceTest('users_list');
          this.showNotification('Тест пользователей завершен', '', false);
          await this.refreshMetrics();
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        } finally {
          this.loading = false;
        }
      },

      async runCommentsTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false;
        
        try {
          await PerformanceController.runPerformanceTest('comments_list');
          this.showNotification('Тест комментариев завершен', '', false);
          await this.refreshMetrics();
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        } finally {
          this.loading = false;
        }
      },

      async runTimelineTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false;
        
        try {
          await PerformanceController.runPerformanceTest('timeline');
          this.showNotification('Тест таймлайна завершен', '', false);
          await this.refreshMetrics();
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        } finally {
          this.loading = false;
        }
      },

      async runCashRegistersTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false;
        
        try {
          await PerformanceController.runPerformanceTest('cash_registers_list');
          this.showNotification('Тест касс завершен', '', false);
          await this.refreshMetrics();
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          this.showNotification('Ошибка выполнения теста', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        } finally {
          this.loading = false;
        }
      },

    toggleTestDropdown() {
      this.showTestDropdown = !this.showTestDropdown;
    },

    handleClickOutside(event) {
      const dropdown = event.target.closest('.relative');
      if (!dropdown) {
        this.showTestDropdown = false;
      }
    }
  }
};
</script>
