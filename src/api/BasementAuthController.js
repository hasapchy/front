import axios from 'axios'
import basementApi from './basementAxiosInstance'

export const BasementAuthController = {
  async basementLogin(credentials) {
    const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/user/login`, credentials)
    const data = response.data
    
    // Проверяем, что пользователь имеет роль basement_worker
    if (!data.user.roles || !data.user.roles.includes('basement_worker')) {
      throw new Error('Access denied. Basement worker role required.')
    }
    
    // Сохраняем токены (используем единый токен)
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      
      if (data.expires_in) {
        localStorage.setItem('token_expires_at', (Date.now() + data.expires_in * 1000).toString())
      }
      if (data.refresh_expires_in) {
        localStorage.setItem('refresh_token_expires_at', (Date.now() + data.refresh_expires_in * 1000).toString())
      }
      
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  async getBasementUser() {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    try {
      const { data } = await basementApi.get('/user/me')
      
      // Проверяем, что данные пользователя есть
      if (!data.user) {
        BasementAuthController.logout()
        return null
      }
      
      // Проверяем роль пользователя
      if (!data.user.roles || !data.user.roles.includes('basement_worker')) {
        BasementAuthController.logout()
        return null
      }
      
      // Обновляем данные в localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return data
    } catch (error) {
      console.error('BasementAuth: Error getting user data:', error)
      // Если токен недействителен, удаляем его
      BasementAuthController.logout()
      return null
    }
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('refresh_token_expires_at')
    localStorage.removeItem('user')
  },

  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (!token || !user) return false
    
    try {
      const userData = JSON.parse(user)
      return userData.roles && userData.roles.includes('basement_worker')
    } catch {
      return false
    }
  },

  getToken() {
    return localStorage.getItem('token')
  }
}
