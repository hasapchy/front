import BaseController from "./BaseController";
import api from "./axiosInstance";
import InvoiceDto from "@/dto/invoice/InvoiceDto";
import { buildDateFilterParams } from "@/utils/dateFilterHelper";

/**
 * Контроллер для работы со счетами
 * @class InvoiceController
 */
export default class InvoiceController {
  /**
   * Получить список счетов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {string} [dateFilter='all_time'] - Фильтр по дате
   * @param {string|null} [startDate=null] - Начальная дата (для custom фильтра)
   * @param {string|null} [endDate=null] - Конечная дата (для custom фильтра)
   * @param {string|null} [typeFilter=null] - Фильтр по типу
   * @param {string|null} [statusFilter=null] - Фильтр по статусу
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, typeFilter = null, statusFilter = null, per_page = 20) {
    const params = {
      ...(search && { search }),
      ...buildDateFilterParams(dateFilter, startDate, endDate),
      ...(typeFilter && { type: typeFilter }),
      ...(statusFilter && { status: statusFilter })
    };

    const cacheParams = {
      search,
      dateFilter,
      startDate,
      endDate,
      typeFilter,
      statusFilter
    };

    return BaseController.getItems(
      '/invoices',
      InvoiceDto,
      page,
      per_page,
      params,
      { cacheKey: 'invoices_list', cacheParams }
    );
  }

  /**
   * Создать новый счет
   * @param {Object} item - Данные счета
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItemWithCache('/invoices', item, {
      cacheKeys: 'invoices_list'
    });
  }

  /**
   * Обновить счет
   * @param {number|string} id - ID счета
   * @param {Object} item - Данные счета
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItemWithCache('/invoices', id, item, {
      cacheKeys: 'invoices_list'
    });
  }

  /**
   * Удалить счет
   * @param {number|string} id - ID счета
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/invoices', id, 'invoices_list');
  }

  /**
   * Получить счет по ID
   * @param {number|string} id - ID счета
   * @returns {Promise<InvoiceDto|null>} Счет или null
   */
  static async getItem(id) {
    return BaseController.getItem('/invoices', InvoiceDto, id);
  }

  /**
   * Получить заказы для счета
   * @param {Array<number|string>} orderIds - Массив ID заказов
   * @returns {Promise<Object>} Данные заказов
   */
  static async getOrdersForInvoice(orderIds) {
    const { data } = await api.post("/invoices/orders", {
      order_ids: orderIds
    });
    return data;
  }
}
