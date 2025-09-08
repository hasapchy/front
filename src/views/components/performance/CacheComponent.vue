<template>
  <div class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Управление кэшем</h2>
        <div class="flex space-x-2">
          <button
            @click="getCacheStats"
            :disabled="loading"
            class="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i class="fas fa-database" :class="{ 'fa-spin': loading }"></i>
            <span>Статистика кэша</span>
          </button>

          <button
            @click="clearCache"
            :disabled="loading"
            class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i class="fas fa-trash" :class="{ 'fa-spin': loading }"></i>
            <span>Очистить кэш</span>
          </button>
        </div>
      </div>

      <div v-if="cacheStats" class="mb-6">
        <h3 class="text-md font-medium text-gray-800 mb-3">Информация о кэше</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Тип кэша</div>
            <div class="text-lg font-medium">{{ cacheStats.type }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Драйвер</div>
            <div class="text-lg font-medium">{{ cacheStats.driver }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Статус</div>
            <div class="text-lg font-medium" :class="{
              'text-green-600': cacheStats.status === 'active',
              'text-red-600': cacheStats.status === 'error'
            }">{{ cacheStats.status }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Элементов</div>
            <div class="text-lg font-medium">{{ cacheStats.items_count || 0 }}</div>
          </div>
        </div>
        
        <div v-if="cacheSize && !cacheSize.error" class="mt-4">
          <h4 class="text-md font-medium text-gray-800 mb-3">Размер кэша</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Размер</div>
              <div class="text-lg font-medium">{{ cacheSize.size_mb }} МБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">В КБ</div>
              <div class="text-lg font-medium">{{ cacheSize.size_kb }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">В байтах</div>
              <div class="text-lg font-medium">{{ cacheSize.size_bytes.toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <div v-if="cacheStats && cacheStats.error" class="mt-4">
          <h4 class="text-md font-medium text-red-800 mb-3">Ошибка кэша</h4>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-700">{{ cacheStats.error }}</div>
          </div>
        </div>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Ошибка</h3>
            <div class="mt-2 text-sm text-red-700">{{ error }}</div>
            <div class="mt-2">
              <button 
                @click="getCacheStats"
                class="text-sm text-red-600 hover:text-red-800 underline"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!cacheStats && !loading && !error" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-info-circle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Информация о кэше не загружена</h3>
            <div class="mt-2 text-sm text-yellow-700">
              Нажмите кнопку "Статистика кэша" для загрузки информации
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PerformanceController from '@/api/PerformanceController';
import notificationMixin from '@/mixins/notificationMixin';

export default {
  name: 'CacheComponent',
  mixins: [notificationMixin],
  data() {
    return {
      loading: false,
      error: null,
      cacheStats: null,
      cacheSize: null
    };
  },
  async mounted() {
    await this.getCacheStats();
  },
  methods: {
    async getCacheStats() {
      this.loading = true;
      this.error = null;
      
      try {
        const cacheStats = await PerformanceController.getCacheStats();
        this.cacheStats = cacheStats;
        this.cacheSize = cacheStats.cache_size;
        this.showNotification('Статистика кэша обновлена', '', false);
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка загрузки статистики кэша', this.error, true);
      } finally {
        this.loading = false;
      }
    },

    async clearCache() {
      this.loading = true;
      this.error = null;
      
      try {
        await PerformanceController.clearCache();
        await this.getCacheStats();
        this.showNotification('Кэш успешно очищен', '', false);
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка очистки кэша', this.error, true);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
