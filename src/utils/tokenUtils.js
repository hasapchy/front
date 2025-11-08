export const TokenUtils = {
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const tokenExpiresAt = localStorage.getItem('token_expires_at');
    return token && tokenExpiresAt && Date.now() <= parseInt(tokenExpiresAt);
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
