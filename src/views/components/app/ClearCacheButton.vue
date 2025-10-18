<template>
  <button
    @click="clearCache"
    :disabled="isClearing"
    class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :title="$t('clearCache')"
  >
    <i :class="isClearing ? 'fas fa-spinner fa-spin' : 'fas fa-broom'" class="text-sm"></i>
    <span class="text-sm hidden md:inline">{{ $t('clearCache') }}</span>
  </button>
</template>

<script>
import CacheController from '@/api/CacheController';
import CacheInvalidator from '@/utils/cacheInvalidator';

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
        // Получаем токен авторизации до очистки
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refresh_token');
        const user = localStorage.getItem('vuex');

        // 1. Очищаем Laravel кэш (Backend)
        await CacheController.clearAllCache();

        // 2. Очищаем localStorage (Frontend) - НО СОХРАНЯЕМ ТОКЕН
        CacheInvalidator.invalidateAll();
        
        // 3. Очищаем весь остальной localStorage КРОМЕ токена и vuex
        const preserveKeys = ['token', 'refresh_token', 'vuex'];
        Object.keys(localStorage).forEach(key => {
          if (!preserveKeys.includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // 4. Восстанавливаем токен если он был
        if (token) {
          localStorage.setItem('token', token);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        if (user) {
          localStorage.setItem('vuex', user);
        }

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
  min-width: 40px;
}
</style>

