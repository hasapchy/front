/**
 * Миксин для работы с временными ограничениями заказов
 */
import { 
  canEditOrder, 
  isOrderLocked, 
  getHoursUntilUnlock, 
  formatOrderDate,
  getTimeConfig,
  syncServerTime,
  getServerTime
} from '@/utils/timeUtils'
import api from '@/api/axiosInstance'

export default {
  data() {
    return {
      timeConfig: getTimeConfig()
    }
  },
  
  async mounted() {
    await this.syncTimeWithServer()
  },
  
  methods: {
    /**
     * Синхронизирует время клиента с сервером
     */
    async syncTimeWithServer() {
      try {
        const response = await api.get('/orders/server-time')
        if (response.data.success && response.data.server_time) {
          syncServerTime(response.data.server_time)
        }
      } catch (error) {
        console.warn('Failed to sync time with server, using local time:', error)
      }
    },
    
    /**
     * Проверяет, можно ли редактировать заказ
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {boolean}
     */
    canEditOrder(createdAt) {
      return canEditOrder(createdAt, this.timeConfig.basementOrderEditLimitHours)
    },
    
    /**
     * Проверяет, заблокирован ли заказ для редактирования
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {boolean}
     */
    isOrderLocked(createdAt) {
      return isOrderLocked(createdAt, this.timeConfig.basementOrderEditLimitHours)
    },
    
    /**
     * Проверяет, можно ли удалить заказ
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {boolean}
     */
    canDeleteOrder(createdAt) {
      return canEditOrder(createdAt, this.timeConfig.basementOrderDeleteLimitHours)
    },
    
    /**
     * Проверяет, заблокирован ли заказ для удаления
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {boolean}
     */
    isOrderDeleteLocked(createdAt) {
      return isOrderLocked(createdAt, this.timeConfig.basementOrderDeleteLimitHours)
    },
    
    /**
     * Получает количество часов до разблокировки заказа
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {number}
     */
    getHoursUntilUnlock(createdAt) {
      return getHoursUntilUnlock(createdAt, this.timeConfig.basementOrderEditLimitHours)
    },
    
    /**
     * Получает количество часов до разблокировки удаления заказа
     * @param {string|Date} createdAt - Дата создания заказа
     * @returns {number}
     */
    getHoursUntilDeleteUnlock(createdAt) {
      return getHoursUntilUnlock(createdAt, this.timeConfig.basementOrderDeleteLimitHours)
    },
    
    /**
     * Форматирует дату заказа
     * @param {string|Date} date - Дата для форматирования
     * @returns {string}
     */
    formatOrderDate(date) {
      return formatOrderDate(date)
    },
    
    /**
     * Показывает уведомление о заблокированном заказе
     * @param {Object} order - Объект заказа
     * @param {string} action - Действие (edit/delete)
     */
    showOrderLockedNotification(order, action = 'edit') {
      const hoursRemaining = action === 'delete' 
        ? this.getHoursUntilDeleteUnlock(order.created_at)
        : this.getHoursUntilUnlock(order.created_at)
      
      const actionText = action === 'delete' ? 'удалить' : 'редактировать'
      const timeLimit = action === 'delete' 
        ? this.timeConfig.basementOrderDeleteLimitHours
        : this.timeConfig.basementOrderEditLimitHours
      
      
      this.$store.dispatch('showNotification', {
        title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} заблокировано`,
        subtitle: `Заказ можно ${actionText} через ${hoursRemaining} часов (создан: ${this.formatOrderDate(order.created_at)})`,
        isDanger: true
      })
    }
  }
}
