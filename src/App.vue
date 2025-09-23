<template>
    <router-view />
</template>

<style scoped></style>

<script>
import AuthController from '@/api/AuthController';
import TokenUtils from '@/utils/tokenUtils';

export default {
    data() {
        return {
            loading: true
        };
    },
    async created() {
        // Устанавливаем состояние загрузки
        this.$store.dispatch('setLoading', true);
        
        // Проверяем статус токенов
        this.$store.dispatch('checkTokenStatus');
        
        if (TokenUtils.isAuthenticated()) {
            try {
                // Получаем информацию о пользователе
                const userData = await AuthController.getUser();
                this.$store.dispatch('setUser', userData.user);
                this.$store.dispatch('setPermissions', userData.permissions);
                
                // Загружаем валюты
                await this.$store.dispatch('loadCurrencies');
                
                // Обновляем информацию о токенах в store
                const tokenExpiresAt = localStorage.getItem('token_expires_at');
                const refreshTokenExpiresAt = localStorage.getItem('refresh_token_expires_at');
                
                if (tokenExpiresAt && refreshTokenExpiresAt) {
                    this.$store.dispatch('updateTokenExpiration', {
                        accessTokenExpiresAt: parseInt(tokenExpiresAt),
                        refreshTokenExpiresAt: parseInt(refreshTokenExpiresAt)
                    });
                }
            } catch (error) {
                console.error('Ошибка получения пользователя:', error);
                this.$store.dispatch('setUser', null);
                this.$store.dispatch('setPermissions', []);
                TokenUtils.clearAuthData();
                this.$router.push('/auth/login');
            }
        } else {
            // Очищаем данные если токен недействителен
            TokenUtils.clearAuthData();
            this.$store.dispatch('setUser', null);
            this.$store.dispatch('setPermissions', []);
        }
        
        // Завершаем загрузку
        this.$store.dispatch('setLoading', false);
        this.loading = false;
    }
};
</script>