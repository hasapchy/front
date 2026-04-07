<template>
  <button
    :disabled="isClearing"
    class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :title="$t('clearCache')"
    @click="clearCache"
  >
    <span class="text-xs sm:text-sm">
      <SpinnerIcon
        v-if="isClearing"
        size-class="text-xs sm:text-sm"
      />
      <i
        v-else
        class="fas fa-broom"
      />
    </span>
    <span class="text-xs sm:text-sm hidden sm:inline">{{ $t('clearCache') }}</span>
  </button>
</template>

<script>
import CacheController from '@/api/CacheController';
import { CacheInvalidator } from '@/cache';
import {
  PRESERVED_LOCAL_STORAGE_EXACT_KEYS,
  PRESERVED_LOCAL_STORAGE_PREFIXES,
} from '@/utils/browserLocalStorageUi';

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

      if (!confirm(this.$t('confirmClearCache'))) {
        return;
      }

      this.isClearing = true;

      try {
        const preservedKeys = [
          'hasap_auth_user',
          'vuex',
          'hasap_vuex_cache',
          'hasap_references_cache',
          'hasap_user_settings',
          'menuItems',
          'current_company',
          'locale',
          ...PRESERVED_LOCAL_STORAGE_EXACT_KEYS,
        ];
        const preservedPrefixes = [...PRESERVED_LOCAL_STORAGE_PREFIXES];
        const preservedValues = preservedKeys.reduce((acc, key) => {
          const value = localStorage.getItem(key);
          if (value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {});

        await CacheController.clearAllCache();

        await CacheInvalidator.invalidateAll();

        Object.keys(localStorage).forEach(key => {
          const isPreservedPrefix = preservedPrefixes.some((prefix) => key.startsWith(prefix));
          if (!preservedKeys.includes(key) && !isPreservedPrefix) {
            localStorage.removeItem(key);
          }
        });

        Object.entries(preservedValues).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        this.$store.dispatch('showNotification', {
          title: this.$t('cacheCleared'),
          subtitle: this.$t('cacheSuccessfullyCleared'),
          isDanger: false
        });

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

