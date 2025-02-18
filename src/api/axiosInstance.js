import axios from 'axios';
import UserController from './UserController';

// Создаем инстанс axios
const api = axios.create({
    baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api`, // Замени на свой адрес
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем интерцептор для автоматической подстановки токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор для обновления токена
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.log("401 error");
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const { data } = await UserController.refreshToken();
                    if(data){
                        localStorage.setItem('token', data.access_token);
                        error.config.headers.Authorization = `Bearer ${data.access_token}`;
                        return axios(error.config); // Повторяем запрос с новым токеном
                    }
                }
            } catch (refreshError) {
                console.error('Ошибка при обновлении токена', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.reload(); // Перенаправить пользователя на страницу логина
            }
        }
        return Promise.reject(error);
    }
);

export default api;
