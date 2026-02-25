import api, { authApi } from './axiosInstance';
import TokenUtils from '@/utils/tokenUtils';
import BaseController from './BaseController';
import { getDeviceFingerprint } from '@/utils/fingerprint';

export default class AuthController extends BaseController {
    static async login(email, password, remember = false) {
        return super.handleRequest(
            async () => {
                const device_fingerprint = await getDeviceFingerprint();
                const { data } = await api.post('/user/login', { email, password, remember, device_fingerprint });
                
                TokenUtils.setTokens({
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token
                });
                
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                return data;
            },
            'Ошибка входа:'
        );
    }

    static async getUser() {
        return super.handleRequest(
            async () => {
                const { data } = await api.get('/user/me');
                return data;
            },
            'Ошибка получения пользователя:'
        );
    }

    static async logout() {
        try {
            return await super.handleRequest(
                async () => {
                    await api.post('/user/logout');
                },
                'Ошибка выхода:'
            );
        } finally {
            TokenUtils.clearAuthData();
            localStorage.removeItem('current_company');
        }
    }

    static async refreshToken() {
        return super.handleRequest(
            async () => {
                const refreshToken = TokenUtils.getRefreshToken();
                if (!refreshToken) {
                    throw new Error('Refresh token not found');
                }
                const device_fingerprint = await getDeviceFingerprint();
                const { data } = await authApi.post('/user/refresh', { refresh_token: refreshToken, device_fingerprint });
                
                TokenUtils.setTokens({
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token
                });
                
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                return data;
            },
            'Ошибка обновления токена:'
        );
    }
}
