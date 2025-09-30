<template>
  <div class="mb-6">
    <!-- Серверный кэш -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Серверный кэш</h2>
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

    <!-- localStorage кэш -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Клиентский кэш (localStorage)</h2>
        <div class="flex space-x-2">
          <button
            @click="refreshLocalCacheInfo"
            :disabled="localCacheLoading"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': localCacheLoading }"></i>
            <span>Обновить</span>
          </button>

          <button
            @click="clearLocalCache"
            :disabled="localCacheLoading"
            class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i class="fas fa-trash" :class="{ 'fa-spin': localCacheLoading }"></i>
            <span>Очистить localStorage</span>
          </button>

          <button
            @click="autoCleanup"
            :disabled="localCacheLoading"
            class="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i class="fas fa-broom"></i>
            <span>Автоочистка</span>
          </button>
        </div>
      </div>

      <div v-if="localCacheInfo" class="mb-6">
        <h3 class="text-md font-medium text-gray-800 mb-3">Информация о localStorage</h3>
        
        <!-- Общая статистика -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600">Общий размер</div>
            <div class="text-lg font-medium">{{ localCacheInfo.totalSizeMB }} МБ</div>
            <div class="text-xs text-green-500">{{ localCacheInfo.totalSizeKB }} КБ</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600">Количество ключей</div>
            <div class="text-lg font-medium">{{ localCacheInfo.keyCount }}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600">Статус</div>
            <div class="text-lg font-medium" :class="{
              'text-green-600': localCacheInfo.status.level === 'ok',
              'text-yellow-600': localCacheInfo.status.level === 'warning',
              'text-red-600': localCacheInfo.status.level === 'error'
            }">{{ localCacheInfo.status.message }}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600">Устаревших кэшей</div>
            <div class="text-lg font-medium">{{ expiredCaches.length }}</div>
          </div>
        </div>

        <!-- Детали по ключам -->
        <div v-if="localCacheInfo.details && Object.keys(localCacheInfo.details).length > 0">
          <h4 class="text-md font-medium text-gray-800 mb-3">Детали по ключам</h4>
          <div class="overflow-x-auto max-h-64">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ключ</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Размер</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Возраст</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(detail, key) in localCacheInfo.details" :key="key" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-sm text-gray-900 font-mono">{{ key }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900">{{ detail.sizeKB }} КБ</td>
                  <td class="px-4 py-2 text-sm text-gray-900">
                    <span v-if="detail.timestamp">
                      {{ getAgeInMinutes(detail.timestamp) }} мин
                    </span>
                    <span v-else class="text-gray-400">N/A</span>
                  </td>
                  <td class="px-4 py-2 text-sm">
                    <span v-if="isExpired(detail.timestamp, key)" class="text-red-600 font-medium">Устарел</span>
                    <span v-else class="text-green-600 font-medium">Активен</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Устаревшие кэши -->
        <div v-if="expiredCaches.length > 0" class="mt-6">
          <h4 class="text-md font-medium text-red-800 mb-3">Устаревшие кэши</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="space-y-2">
              <div v-for="cache in expiredCaches" :key="cache.key" class="flex justify-between items-center">
                <div>
                  <span class="font-mono text-sm">{{ cache.key }}</span>
                  <span class="text-xs text-red-600 ml-2">{{ cache.ageMinutes }}мин (TTL: {{ cache.ttlMinutes }}мин)</span>
                </div>
                <button
                  @click="clearSpecificCache(cache.key)"
                  class="text-red-600 hover:text-red-800 text-sm underline"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="localCacheError" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Ошибка</h3>
            <div class="mt-2 text-sm text-red-700">{{ localCacheError }}</div>
          </div>
        </div>
      </div>

      <div v-if="!localCacheInfo && !localCacheLoading && !localCacheError" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-info-circle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Информация о localStorage не загружена</h3>
            <div class="mt-2 text-sm text-yellow-700">
              Нажмите кнопку "Обновить" для загрузки информации
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
import CacheMonitor from '@/utils/cacheMonitor';

export default {
  name: 'CacheComponent',
  mixins: [notificationMixin],
  data() {
    return {
      loading: false,
      error: null,
      cacheStats: null,
      cacheSize: null,
      // localStorage кэш
      localCacheLoading: false,
      localCacheError: null,
      localCacheInfo: null,
      expiredCaches: []
    };
  },
  async mounted() {
    await this.getCacheStats();
    await this.refreshLocalCacheInfo();
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
    },

    // Методы для localStorage
    async refreshLocalCacheInfo() {
      this.localCacheLoading = true;
      this.localCacheError = null;
      
      try {
        this.localCacheInfo = CacheMonitor.getCacheInfo();
        this.expiredCaches = CacheMonitor.getExpiredCaches();
        this.showNotification('Информация о localStorage обновлена', '', false);
      } catch (error) {
        this.localCacheError = error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка загрузки информации о localStorage', this.localCacheError, true);
      } finally {
        this.localCacheLoading = false;
      }
    },

    async clearLocalCache() {
      this.localCacheLoading = true;
      this.localCacheError = null;
      
      try {
        this.$store.dispatch('clearCache');
        await this.refreshLocalCacheInfo();
        this.showNotification('localStorage успешно очищен', '', false);
      } catch (error) {
        this.localCacheError = error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка очистки localStorage', this.localCacheError, true);
      } finally {
        this.localCacheLoading = false;
      }
    },

    async autoCleanup() {
      this.localCacheLoading = true;
      this.localCacheError = null;
      
      try {
        const result = CacheMonitor.autoCleanup();
        await this.refreshLocalCacheInfo();
        
        if (result.clearedCount > 0) {
          this.showNotification(`Автоочистка выполнена: удалено ${result.clearedCount} записей`, '', false);
        } else {
          this.showNotification('Автоочистка не требуется', '', false);
        }
      } catch (error) {
        this.localCacheError = error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка автоочистки', this.localCacheError, true);
      } finally {
        this.localCacheLoading = false;
      }
    },

    clearSpecificCache(key) {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
        this.refreshLocalCacheInfo();
        this.showNotification(`Кэш ${key} удален`, '', false);
      } catch (error) {
        this.showNotification('Ошибка удаления кэша', error.message, true);
      }
    },

    getAgeInMinutes(timestamp) {
      if (!timestamp) return 'N/A';
      const now = Date.now();
      const age = now - timestamp;
      return Math.round(age / (1000 * 60));
    },

    isExpired(timestamp, key) {
      if (!timestamp) return false;
      const now = Date.now();
      const age = now - timestamp;
      const ttl = CacheMonitor.getCacheTTL(key);
      return age > ttl;
    }
  }
};
</script>
