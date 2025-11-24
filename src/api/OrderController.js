import BaseController from "./BaseController";
import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import { queryCache } from "@/utils/cacheHelper";
import { buildDateFilterParams } from "@/utils/dateFilterHelper";

/**
 * Контроллер для работы с заказами
 * @class OrderController
 */
export default class OrderController {
  /**
   * Получить список заказов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {string} [dateFilter='all_time'] - Фильтр по дате
   * @param {string|null} [startDate=null] - Начальная дата (для custom фильтра)
   * @param {string|null} [endDate=null] - Конечная дата (для custom фильтра)
   * @param {string} [statusFilter=''] - Фильтр по статусу
   * @param {string} [projectFilter=''] - Фильтр по проекту
   * @param {string} [clientFilter=''] - Фильтр по клиенту
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, statusFilter = '', projectFilter = '', clientFilter = '', per_page = 20) {
    const params = {
      ...(search && { search }),
      ...buildDateFilterParams(dateFilter, startDate, endDate),
      ...(statusFilter && { status_id: statusFilter }),
      ...(projectFilter && { project_id: projectFilter }),
      ...(clientFilter && { client_id: clientFilter })
    };
    
    return BaseController.getItems('/orders', OrderDto, page, per_page, params);
  }

  /**
   * Создать новый заказ
   * @param {Object} item - Данные заказа
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItemWithCache('/orders', item, {
      cacheKeys: 'orders_list'
    });
  }

  /**
   * Обновить заказ
   * @param {number|string} id - ID заказа
   * @param {Object} item - Данные заказа
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItemWithCache('/orders', id, item, {
      cacheKeys: 'orders_list'
    });
  }

  /**
   * Удалить заказ
   * @param {number|string} id - ID заказа
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/orders', id, 'orders_list');
  }

  /**
   * Массовое обновление статуса заказов
   * @param {Object} params - Параметры обновления
   * @param {Array<number|string>} params.ids - Массив ID заказов
   * @param {number|string} params.status_id - ID нового статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async batchUpdateStatus({ ids, status_id }) {
    const { data } = await api.post("/orders/batch-status", {
      ids,
      status_id,
    });
    queryCache.invalidate('orders_list');
    return data;
  }

  /**
   * Получить заказ по ID
   * @param {number|string} id - ID заказа
   * @returns {Promise<OrderDto|null>} Заказ или null
   */
  static async getItem(id) {
    return BaseController.getItem('/orders', OrderDto, id);
  }

  /**
   * Получить транзакции заказа
   * @param {number|string} orderId - ID заказа
   * @returns {Promise<Array>} Массив транзакций
   */
  static async getOrderTransactions(orderId) {
    const response = await api.get(`/transactions`, {
      params: { order_id: orderId }
    });
    return response.data.data || [];
  }

  /**
   * Привязать транзакцию к заказу
   * @param {number|string} orderId - ID заказа
   * @param {number|string} transactionId - ID транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async linkTransactionToOrder(orderId, transactionId) {
    const { data } = await api.post(`/orders/${orderId}/transactions`, {
      transaction_id: transactionId
    });
    queryCache.invalidate('orders_list');
    queryCache.invalidate('transactions_list');
    return data;
  }

  /**
   * Отвязать транзакцию от заказа
   * @param {number|string} orderId - ID заказа
   * @param {number|string} transactionId - ID транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async unlinkTransactionFromOrder(orderId, transactionId) {
    const { data } = await api.delete(`/orders/${orderId}/transactions/${transactionId}`);
    queryCache.invalidate('orders_list');
    queryCache.invalidate('transactions_list');
    return data;
  }
}
