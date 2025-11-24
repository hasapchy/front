import api from './axiosInstance';
import store from '@/store';

/**
 * Контроллер для работы с аутентификацией
 * @class AuthController
 */
export default class AuthController {
    /**
     * Войти в систему
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль
     * @param {boolean} [remember=false] - Запомнить пользователя
     * @returns {Promise<Object>} Данные авторизации
     */
    static async login(email, password, remember = false) {
        const { data } = await api.post('/user/login', { email, password, remember });
        
        const now = Date.now();
        const tokenExpiresAt = data.expires_in ? now + (data.expires_in * 1000) : null;
        
        store.dispatch('setToken', {
            token: data.access_token,
            expiresAt: tokenExpiresAt
        });
        
        if (data.user) {
            store.dispatch('setUser', data.user);
        }
        
        return data;
    }

    /**
     * Получить данные текущего пользователя
     * @returns {Promise<Object>} Данные пользователя
     */
    static async getUser() {
        const { data } = await api.get('/user/me');
        return data;
    }

    /**
     * Выйти из системы
     * @returns {Promise<void>}
     */
    static async logout() {
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error('Ошибка выхода:', error);
        } finally {
            store.dispatch('clearAuth');
        }
    }
}
