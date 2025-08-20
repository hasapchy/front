/**
 * Утилиты для работы с JWT токенами
 */

export const TokenUtils = {
  /**
   * Проверяет, истек ли access token
   */
  isAccessTokenExpired() {
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    if (!tokenExpiresAt) return true;
    
    // Добавляем буфер в 30 секунд для предварительного обновления
    return Date.now() > (parseInt(tokenExpiresAt) - 30000);
  },

  /**
   * Проверяет, истек ли refresh token
   */
  isRefreshTokenExpired() {
    const refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
    if (!refreshTokenExpiresAt) return true;
    
    return Date.now() > parseInt(refreshTokenExpiresAt);
  },

  /**
   * Проверяет, нуждается ли токен в обновлении
   */
  needsRefresh() {
    return this.isAccessTokenExpired() && !this.isRefreshTokenExpired();
  },

  /**
   * Получает время до истечения access token в минутах
   */
  getAccessTokenTimeLeft() {
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    if (!tokenExpiresAt) return 0;
    
    const timeLeft = parseInt(tokenExpiresAt) - Date.now();
    return Math.max(0, Math.floor(timeLeft / 60000)); // В минутах
  },

  /**
   * Получает время до истечения refresh token в днях
   */
  getRefreshTokenTimeLeft() {
    const refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
    if (!refreshTokenExpiresAt) return 0;
    
    const timeLeft = parseInt(refreshTokenExpiresAt) - Date.now();
    return Math.max(0, Math.floor(timeLeft / (24 * 60 * 60 * 1000))); // В днях
  },

  /**
   * Очищает все данные аутентификации
   */
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('userInfo');
  },

  /**
   * Проверяет, авторизован ли пользователь
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    
    return token && tokenExpiresAt && Date.now() <= parseInt(tokenExpiresAt);
  },

  /**
   * Получает информацию о пользователе
   */
  getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * Форматирует время истечения токена для отображения
   */
  formatExpirationTime(expiresAt) {
    if (!expiresAt) return 'Неизвестно';
    
    const timeLeft = parseInt(expiresAt) - Date.now();
    if (timeLeft <= 0) return 'Истек';
    
    const minutes = Math.floor(timeLeft / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} дн. ${hours % 24} ч.`;
    if (hours > 0) return `${hours} ч. ${minutes % 60} мин.`;
    return `${minutes} мин.`;
  }
};

export default TokenUtils;
