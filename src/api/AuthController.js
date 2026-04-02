import { refreshSessionTokens } from './authSession';
import TokenUtils from '@/utils/tokenUtils';
import BaseController from './BaseController';
import { apiErrorMessage } from './apiErrorMessage';
import { getDeviceFingerprint } from '@/utils/fingerprint';

export default class AuthController extends BaseController {
    static async login(email, password, remember = false) {
        return super.handleRequest(
            async () => {
                const deviceFingerprint = await getDeviceFingerprint();
                const payload = await super.postData('/user/login', { email, password, remember, deviceFingerprint });
                
                TokenUtils.setTokens({
                    accessToken: payload.access_token,
                    refreshToken: payload.refresh_token
                });
                
                if (payload.user) {
                    localStorage.setItem('user', JSON.stringify(payload.user));
                }
                
                return payload;
            },
            apiErrorMessage('authLogin')
        );
    }

    static async getUser() {
        return super.handleRequest(
            async () => {
                const payload = await super.getData('/user/me');
                return {
                    user: payload.user,
                    permissions: payload.user.permissions
                };
            },
            apiErrorMessage('authGetUser')
        );
    }

    static async logout() {
        try {
            return super.handleRequest(
                async () => {
                    await super.post('/user/logout');
                },
                apiErrorMessage('authLogout')
            );
        } finally {
            TokenUtils.clearAuthData();
            localStorage.removeItem('current_company');
        }
    }

    static async refreshToken() {
        return super.handleRequest(
            () => refreshSessionTokens(),
            apiErrorMessage('authRefreshToken')
        );
    }
}
