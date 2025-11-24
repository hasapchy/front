import BaseController from "./BaseController";
import SaleDto from "@/dto/sale/SaleDto";
import { buildDateFilterParams } from "@/utils/dateFilterHelper";

/**
 * Контроллер для работы с продажами
 * @class SaleController
 */
export default class SaleController {
  /**
   * Получить список продаж с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {string} [dateFilter='all_time'] - Фильтр по дате
   * @param {string|null} [startDate=null] - Начальная дата (для custom фильтра)
   * @param {string|null} [endDate=null] - Конечная дата (для custom фильтра)
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, per_page = 20) {
    const params = {
      ...(search && { search }),
      ...buildDateFilterParams(dateFilter, startDate, endDate)
    };

    const cacheParams = {
      search,
      dateFilter,
      startDate,
      endDate
    };

    return BaseController.getItems(
      '/sales',
      SaleDto,
      page,
      per_page,
      params,
      { cacheKey: 'sales_list', cacheParams }
    );
  }

  /**
   * Создать новую продажу
   * @param {Object} item - Данные продажи
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItemWithCache('/sales', item, {
      cacheKeys: 'sales_list'
    });
  }

  /**
   * Обновить продажу
   * @param {number|string} id - ID продажи
   * @param {Object} item - Данные продажи
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItemWithCache('/sales', id, item, {
      cacheKeys: 'sales_list'
    });
  }

  /**
   * Удалить продажу
   * @param {number|string} id - ID продажи
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/sales', id, 'sales_list');
  }

  /**
   * Получить продажу по ID
   * @param {number|string} id - ID продажи
   * @returns {Promise<SaleDto|null>} Продажа или null
   */
  static async getItem(id) {
    return BaseController.getItem('/sales', SaleDto, id);
  }
}
