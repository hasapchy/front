<template>
    <router-view />
</template>

<style scoped></style>

<script>
import AuthController from '@/api/AuthController';
import BasementAuthController from '@/api/basement/BasementAuthController';
import { isBasementWorkerOnly, getUserFromStorage } from '@/utils/userUtils';

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
        
        if (!this.$store.getters.token || this.$store.getters.isTokenExpired) {
            this.$store.dispatch('clearAuth');
            await this.$store.dispatch('initializeMenu');
            this.$store.dispatch('setLoading', false);
            this.loading = false;
            return;
        }
        
        try {
            const userFromStore = this.$store.getters.user;
            const isBasementWorker = isBasementWorkerOnly(userFromStore);
            
            this.$store.commit('SET_CURRENT_COMPANY', null);
            
            const userData = isBasementWorker 
                ? await BasementAuthController.getBasementUser()
                : await AuthController.getUser();
            
            if (!userData) {
                throw new Error('Не удалось получить данные пользователя');
            }
            
            this.$store.dispatch('setUser', userData.user);
            console.log('[Auth] Current user:', userData.user);
            this.$store.dispatch('setPermissions', userData.permissions || []);
            await this.$store.dispatch('initializeMenu');
            
            if (!isBasementWorker) {
                await Promise.all([
                    this.$store.dispatch('loadCurrencies'),
                    this.$store.dispatch('loadUnits')
                ]);
                
                try {
                    await this.$store.dispatch('loadUserCompanies');
                    await this.$store.dispatch('loadCurrentCompany');
                } catch (error) {
                    console.error('Ошибка загрузки компаний:', error);
                }
            }
            
            // Токен уже загружен из persistedstate в store
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            this.$store.dispatch('clearAuth');
            this.$router.push('/auth/login');
        } finally {
            this.$store.dispatch('setLoading', false);
            this.loading = false;
        }
    }
};
</script>