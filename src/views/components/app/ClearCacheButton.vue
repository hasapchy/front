<template>
  <button
    @click="clearCache"
    :disabled="isClearing"
    class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :title="$t('clearCache')"
  >
    <span class="text-xs sm:text-sm">
      <SpinnerIcon v-if="isClearing" size-class="text-xs sm:text-sm" />
      <i v-else class="fas fa-broom"></i>
    </span>
    <span class="text-xs sm:text-sm hidden sm:inline">{{ $t('clearCache') }}</span>
  </button>
</template>

<script>
import CacheController from '@/api/CacheController';
import CacheInvalidator from '@/utils/cache';

export default {
  name: 'ClearCacheButton',
  data() {
    return {
      isClearing: false
    };
  },
  methods: {
    async clearCache() {
      if (this.isClearing) return;

      // Подтверждение
      if (!confirm(this.$t('confirmClearCache'))) {
        return;
      }

      this.isClearing = true;

      try {
        const preservedKeys = [
          'token',
          'refresh_token',
          'token_expires_at',
          'refresh_token_expires_at',
          'user',
          'vuex',
          'current_company',
          'locale'
        ];
        const preservedValues = preservedKeys.reduce((acc, key) => {
          const value = localStorage.getItem(key);
          if (value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {});

        // 1. Очищаем Laravel кэш (Backend)
        await CacheController.clearAllCache();

        // 2. Очищаем локальные кэши (Frontend)
        CacheInvalidator.invalidateAll();
        
        // 3. Очищаем весь остальной localStorage, не трогая сохранённые ключи
        Object.keys(localStorage).forEach(key => {
          if (!preservedKeys.includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // 4. Возвращаем сохранённые значения (на случай если были удалены)
        Object.entries(preservedValues).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        // 5. Показываем уведомление
        this.$store.dispatch('showNotification', {
          title: this.$t('cacheCleared'),
          subtitle: this.$t('cacheSuccessfullyCleared'),
          isDanger: false
        });

        // 6. Перезагружаем страницу для применения изменений
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (error) {
        console.error('Ошибка при очистке кэша:', error);
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.$t('errorClearingCache'),
          isDanger: true
        });
      } finally {
        this.isClearing = false;
      }
    }
  }
};
</script>

<style scoped>
button {
  min-width: 36px;
}

@media (min-width: 640px) {
  button {
    min-width: 40px;
  }
}
</style>

