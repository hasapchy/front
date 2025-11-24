import BaseController from "./BaseController";
import api from "./axiosInstance";
import TransactionDto from "@/dto/transaction/TransactionDto";
import { queryCache } from "@/utils/cacheHelper";
import { getStore } from "@/store/storeManager";
import { buildDateFilterParams } from "@/utils/dateFilterHelper";

/**
 * Контроллер для работы с транзакциями
 * @class TransactionController
 */
export default class TransactionController {
  /**
   * Получить список транзакций с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number|null} [cash_id=null] - ID кассы
   * @param {string} [date_filter_type='all_time'] - Тип фильтра по дате
   * @param {number|null} [order_id=null] - ID заказа
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {string|null} [transaction_type=null] - Тип транзакции
   * @param {string|null} [source=null] - Источник транзакции
   * @param {number|null} [project_id=null] - ID проекта
   * @param {number} [per_page=20] - Количество элементов на странице
   * @param {string|null} [start_date=null] - Начальная дата
   * @param {string|null} [end_date=null] - Конечная дата
   * @param {boolean|null} [is_debt=null] - Фильтр по долгам
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(
    page = 1,
    cash_id = null,
    date_filter_type = "all_time",
    order_id = null,
    search = null,
    transaction_type = null,
    source = null,
    project_id = null,
    per_page = 20,
    start_date = null,
    end_date = null,
    is_debt = null
  ) {
    const dateParams = buildDateFilterParams(date_filter_type, start_date, end_date, 'date');
    const params = {
      cash_id,
      order_id,
      search,
      transaction_type,
      source,
      project_id,
      start_date,
      end_date,
      is_debt,
      ...dateParams
    };

    const cacheParams = {
      cash_id,
      date_filter_type,
      order_id,
      search,
      transaction_type,
      source,
      project_id,
      start_date,
      end_date,
      is_debt
    };

    return BaseController.getItems(
      '/transactions',
      TransactionDto,
      page,
      per_page,
      params,
      { cacheKey: 'transactions_list', cacheParams }
    );
  }

  /**
   * Получить транзакцию по ID
   * @param {number|string} id - ID транзакции
   * @returns {Promise<TransactionDto|null>} Транзакция или null
   */
  static async getItem(id) {
    return BaseController.getItem('/transactions', TransactionDto, id);
  }

  /**
   * Получить общую сумму оплат по заказу
   * @param {number|string} orderId - ID заказа
   * @returns {Promise<Object>} Данные об общей сумме оплат
   */
  static async getTotalPaidByOrderId(orderId) {
    const response = await api.get(`/transactions/total`, {
      params: { order_id: orderId },
    });
    return response.data;
  }

  /**
   * Создать новую транзакцию
   * @param {Object} item - Данные транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    const data = await BaseController.storeItem('/transactions', item);
    const store = getStore();
    if (store) {
      store.dispatch('onDataCreate', { type: 'transactions' });
    }
    return data;
  }

  /**
   * Создать транзакцию для заказа
   * @param {number|string} orderId - ID заказа
   * @param {Object} transactionData - Данные транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async createTransactionForOrder(orderId, transactionData) {
    const result = await this.storeItem({
      ...transactionData,
      order_id: orderId
    });
    queryCache.invalidate('orders_list');
    return result;
  }

  /**
   * Обновить транзакцию
   * @param {number|string} id - ID транзакции
   * @param {Object} item - Данные транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    const data = await BaseController.updateItem('/transactions', id, item);
    const store = getStore();
    if (store) {
      store.dispatch('onDataUpdate', { type: 'transactions' });
    }
    return data;
  }

  /**
   * Удалить транзакцию
   * @param {number|string} id - ID транзакции
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const data = await BaseController.deleteItem('/transactions', id);
    const store = getStore();
    if (store) {
      store.dispatch('onDataDelete', { type: 'transactions' });
    }
    return data;
  }
}
