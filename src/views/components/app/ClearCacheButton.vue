<template>
  <button @click="clearCache" :disabled="isClearing"
    class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :title="$t('clearCache')">
    <span class="text-sm">
      <SpinnerIcon v-if="isClearing" size-class="text-sm" />
      <i v-else class="fas fa-broom"></i>
    </span>
    <span class="text-sm hidden md:inline">{{ $t('clearCache') }}</span>
  </button>
</template>

<script>
import CacheController from '@/api/CacheController';

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
        await CacheController.clearAllCache();
        await this.$store.dispatch('clearCache');

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
