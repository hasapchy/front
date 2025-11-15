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
        this.$store.commit('SET_PERMISSIONS_LOADED', false);
        this.$store.dispatch('setPermissions', []);
        
        this.$store.dispatch('setLoading', true);
        this.$store.dispatch('checkTokenStatus');
        
        if (TokenUtils.isAuthenticated()) {
            try {
                const userData = await AuthController.getUser();
                this.$store.dispatch('setUser', userData.user);
                this.$store.dispatch('setPermissions', userData.permissions);
                
                console.log('=== ПРАВА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===');
                console.log('Права:', this.$store.state.permissions);
                console.log('Количество прав:', this.$store.state.permissions?.length || 0);
                console.log('Есть clients_view:', this.$store.getters.hasPermission('clients_view'));
                console.log('Есть projects_view:', this.$store.getters.hasPermission('projects_view'));
                console.log('Есть orders_view:', this.$store.getters.hasPermission('orders_view'));
                console.log('Есть users_view:', this.$store.getters.hasPermission('users_view'));
                console.log('Есть roles_view:', this.$store.getters.hasPermission('roles_view'));
                console.log('==============================');
                
                await this.$store.dispatch('initializeMenu');
                
                // Загружаем глобальные справочники (валюты, единицы) параллельно
                await Promise.all([
                    this.$store.dispatch('loadCurrencies'),
                    this.$store.dispatch('loadUnits')
                ]);
                
                // Загружаем компании пользователя и текущую компанию
                try {
                    await this.$store.dispatch('loadUserCompanies');
                    // loadCurrentCompany уже вызывает loadCompanyData внутри, не нужно дублировать
                    await this.$store.dispatch('loadCurrentCompany');
                } catch (error) {
                    console.error('Ошибка загрузки компаний:', error);
                }
                
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
            // Инициализируем меню даже без авторизации (для отображения дефолтных пунктов)
            await this.$store.dispatch('initializeMenu');
        }
        
        // Завершаем загрузку
        this.$store.dispatch('setLoading', false);
        this.loading = false;
    }
};
</script>