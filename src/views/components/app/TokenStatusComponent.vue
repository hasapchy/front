<template>
  <div class="token-status bg-gray-50 rounded-lg p-4 border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-800 mb-3">Статус токенов</h3>
    
    <div class="space-y-3">
      <!-- Access Token Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-600">Access Token:</span>
        <div class="flex items-center space-x-2">
          <span 
            :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              accessTokenTimeLeft > 5 ? 'bg-green-100 text-green-800' : 
              accessTokenTimeLeft > 1 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            ]"
          >
            {{ accessTokenTimeLeft > 0 ? `${accessTokenTimeLeft} мин.` : 'Истек' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatExpirationTime(tokenInfo.accessTokenExpiresAt) }}
          </span>
        </div>
      </div>

      <!-- Refresh Token Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-600">Refresh Token:</span>
        <div class="flex items-center space-x-2">
          <span 
            :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              refreshTokenTimeLeft > 7 ? 'bg-green-100 text-green-800' : 
              refreshTokenTimeLeft > 1 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            ]"
          >
            {{ refreshTokenTimeLeft > 0 ? `${refreshTokenTimeLeft} дн.` : 'Истек' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatExpirationTime(tokenInfo.refreshTokenExpiresAt) }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-2 pt-2">
        <button
          @click="refreshToken"
          :disabled="isRefreshing || !canRefresh"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md transition-colors',
            canRefresh && !isRefreshing
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          <span v-if="isRefreshing">Обновление...</span>
          <span v-else>Обновить токен</span>
        </button>
        
        <button
          @click="checkTokenStatus"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Проверить статус
        </button>
      </div>

      <!-- Status Messages -->
      <div v-if="statusMessage" class="mt-3 p-2 rounded-md text-sm" :class="statusMessageClass">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AuthController from '@/api/AuthController';
import TokenUtils from '@/utils/tokenUtils';

export default {
  name: 'TokenStatusComponent',
  data() {
    return {
      isRefreshing: false,
      statusMessage: '',
      statusMessageClass: 'bg-gray-100 text-gray-700'
    };
  },
  computed: {
    ...mapGetters([
      'tokenInfo',
      'accessTokenTimeLeft',
      'refreshTokenTimeLeft'
    ]),
    canRefresh() {
      return !this.tokenInfo.needsRefresh && this.refreshTokenTimeLeft > 0;
    }
  },
  methods: {
    ...mapActions([
      'checkTokenStatus',
      'updateTokenExpiration'
    ]),
    
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
    },
    
    async refreshToken() {
      if (!this.canRefresh || this.isRefreshing) return;
      
      this.isRefreshing = true;
      this.statusMessage = 'Обновление токена...';
      this.statusMessageClass = 'bg-blue-100 text-blue-700';
      
      try {
        const data = await AuthController.refreshToken();
        
        if (data && data.access_token) {
          // Обновляем store
          this.updateTokenExpiration({
            accessTokenExpiresAt: Date.now() + (data.expires_in * 1000),
            refreshTokenExpiresAt: Date.now() + (data.refresh_expires_in * 1000)
          });
          
          this.statusMessage = 'Токен успешно обновлен!';
          this.statusMessageClass = 'bg-green-100 text-green-700';
          
          // Обновляем статус
          this.checkTokenStatus();
        }
      } catch (error) {
        console.error('Ошибка обновления токена:', error);
        this.statusMessage = 'Ошибка обновления токена. Попробуйте войти заново.';
        this.statusMessageClass = 'bg-red-100 text-red-700';
        
        // Очищаем данные при ошибке
        TokenUtils.clearAuthData();
        this.$router.push('/auth/login');
      } finally {
        this.isRefreshing = false;
        
        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
          this.statusMessage = '';
        }, 5000);
      }
    }
  },
  mounted() {
    // Проверяем статус токенов при монтировании
    this.checkTokenStatus();
    
    // Проверяем статус каждые 30 секунд
    this.statusInterval = setInterval(() => {
      this.checkTokenStatus();
    }, 30000);
  },
  beforeUnmount() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }
};
</script>

<style scoped>
.token-status {
  max-width: 400px;
}
</style>
