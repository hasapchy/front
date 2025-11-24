<template>
  <div class="token-status bg-gray-50 rounded-lg p-4 border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-800 mb-3">Статус токена</h3>
    
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-600">Access Token:</span>
        <div class="flex items-center space-x-2">
          <span 
            :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              tokenTimeLeft > 60 ? 'bg-green-100 text-green-800' : 
              tokenTimeLeft > 10 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            ]"
          >
            {{ tokenTimeLeft > 0 ? `${tokenTimeLeft} мин.` : 'Истек' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatExpirationTime(tokenExpiresAt) }}
          </span>
        </div>
      </div>

      <div v-if="!token" class="text-sm text-red-600">
        Токен отсутствует. Необходимо войти в систему.
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TokenStatusComponent',
  computed: {
    ...mapGetters([
      'token',
      'tokenExpiresAt',
      'isTokenExpired'
    ]),
    tokenTimeLeft() {
      if (!this.tokenExpiresAt) return 0;
      const timeLeft = this.tokenExpiresAt - Date.now();
      return Math.max(0, Math.floor(timeLeft / 60000));
    }
  },
  methods: {
    formatExpirationTime(expiresAt) {
      if (!expiresAt) return 'Неизвестно';
      
      const timeLeft = expiresAt - Date.now();
      if (timeLeft <= 0) return 'Истек';
      
      const minutes = Math.floor(timeLeft / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days} дн. ${hours % 24} ч.`;
      if (hours > 0) return `${hours} ч. ${minutes % 60} мин.`;
      return `${minutes} мин.`;
    }
  }
};
</script>

<style scoped>
.token-status {
  max-width: 400px;
}
</style>
