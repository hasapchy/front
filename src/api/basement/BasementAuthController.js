import basementApi from './basementAxiosInstance'
import store from '@/store'

/**
 * Контроллер для работы с аутентификацией Basement
 * @class BasementAuthController
 */
export default class BasementAuthController {
  /**
   * Получить данные пользователя Basement
   * @returns {Promise<Object|null>} Данные пользователя или null
   */
  static async getBasementUser() {
    if (!store?.getters.token) {
      return null
    }

    try {
      const { data } = await basementApi.get('/user/me')
      
      if (!data.user) {
        this.logout()
        return null
      }
      
      if (!data.user.roles?.includes('basement_worker')) {
        this.logout()
        return null
      }
      
      store.dispatch('setUser', data.user)
      return data
    } catch (error) {
      console.error('BasementAuth: Error getting user data:', error)
      this.logout()
      return null
    }
  }

  /**
   * Выйти из системы Basement
   * @returns {void}
   */
  static logout() {
    store?.dispatch('clearAuth')
  }

  /**
   * Проверить, аутентифицирован ли пользователь Basement
   * @returns {boolean} true, если пользователь аутентифицирован
   */
  static isAuthenticated() {
    if (!store) return false
    const user = store.getters.user
    const token = store.getters.token
    
    return token && user && user.roles?.includes('basement_worker')
  }

  /**
   * Получить токен аутентификации
   * @returns {string|null} Токен или null
   */
  static getToken() {
    return store?.getters.token || null
  }
}

