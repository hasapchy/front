export const TokenUtils = {
  getToken() {
    return localStorage.getItem('token');
  },

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem('token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('refresh_token_expires_at');
    localStorage.removeItem('user');
  }
};

export default TokenUtils;
