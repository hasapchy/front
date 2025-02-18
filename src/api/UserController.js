import api from './axiosInstance';

const UserController = {
    async login(email, password) {
        try {
            const { data } = await api.post('/user/login', { email, password });
            localStorage.setItem('token', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
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
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Ошибка выхода:', error);
            throw error;
        }
    },

    async refreshToken() {
        try {
            const { data } = await api.post('/user/refresh', { 'refresh_token': localStorage.getItem('refreshToken') });
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            return data;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            throw error;
        }
    }
};

export default UserController;
