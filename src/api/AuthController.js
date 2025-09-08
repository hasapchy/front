import api from './axiosInstance';

const AuthController = {
    async login(email, password, remember = false) {
        try {
            const { data } = await api.post('/user/login', { email, password, remember });
            
            // Сохраняем токены
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            
            // Сохраняем время истечения токенов
            const now = Date.now();
            localStorage.setItem('tokenExpiresAt', now + (data.expires_in * 1000));
            localStorage.setItem('refreshTokenExpiresAt', now + (data.refresh_expires_in * 1000));
            
            // Сохраняем информацию о пользователе
            if (data.user) {
                localStorage.setItem('userInfo', JSON.stringify(data.user));
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
            // Очищаем все данные аутентификации
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tokenExpiresAt');
            localStorage.removeItem('refreshTokenExpiresAt');
            localStorage.removeItem('userInfo');
        }
    },

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
            
            // Проверяем, не истек ли refresh token
            if (!refreshToken || !refreshTokenExpiresAt || Date.now() > parseInt(refreshTokenExpiresAt)) {
                throw new Error('Refresh token expired');
            }
            
            const { data } = await api.post('/user/refresh', { 'refresh_token': refreshToken });
            
            // Обновляем токены
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            
            // Обновляем время истечения токенов
            const now = Date.now();
            localStorage.setItem('tokenExpiresAt', now + (data.expires_in * 1000));
            localStorage.setItem('refreshTokenExpiresAt', now + (data.refresh_expires_in * 1000));
            
            // Обновляем информацию о пользователе
            if (data.user) {
                localStorage.setItem('userInfo', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            throw error;
        }
    }
};

export default AuthController;
