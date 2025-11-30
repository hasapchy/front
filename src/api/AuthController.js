import api from './axiosInstance';
import TokenUtils from '@/utils/tokenUtils';

const AuthController = {
    async login(email, password, remember = false) {
        try {
            const { data } = await api.post('/user/login', { email, password, remember });
            
            TokenUtils.setTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token
            });
            
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка входа:', error);
            throw error;
        }
    },

    async getUser() {
        try {
            const { data } = await api.get('/user/me');
            return data;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error('Ошибка выхода:', error);
        } finally {
            TokenUtils.clearAuthData();
            localStorage.removeItem('current_company');
        }
    },

    async refreshToken() {
        try {
            const refreshToken = TokenUtils.getRefreshToken();
            if (!refreshToken) {
                throw new Error('Refresh token not found');
            }
            
            const { data } = await api.post('/user/refresh', { 'refresh_token': refreshToken });
            
            TokenUtils.setTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token
            });
            
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            throw error;
        }
    }
};

export default AuthController;
