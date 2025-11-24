import BaseController from "./BaseController";
import api from "./axiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import { queryCache } from "@/utils/cacheHelper";

/**
 * Контроллер для работы с клиентами
 * @class ClientController
 */
export default class ClientController {
  /**
   * Получить клиента по ID
   * @param {number|string} id - ID клиента
   * @returns {Promise<ClientDto|null>} Клиент или null
   */
  static async getItem(id) {
    return BaseController.getItem('/clients', ClientDto, id);
  }

  /**
   * Получить список клиентов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {boolean} [includeInactive=false] - Включать неактивных клиентов
   * @param {string|null} [statusFilter=null] - Фильтр по статусу
   * @param {string|null} [typeFilter=null] - Фильтр по типу
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(
    page = 1,
    search = null,
    includeInactive = false,
    statusFilter = null,
    typeFilter = null,
    per_page = 20
  ) {
    const params = {
      ...(search && { search }),
      ...(includeInactive && { include_inactive: true }),
      ...(statusFilter && { status_filter: statusFilter }),
      ...(typeFilter && { type_filter: typeFilter }),
    };

    const cacheParams = {
      search,
      includeInactive,
      statusFilter,
      typeFilter,
    };

    return BaseController.getItems(
      '/clients',
      ClientDto,
      page,
      per_page,
      params,
      { cacheKey: 'clients_list', cacheParams }
    );
  }

  /**
   * Поиск клиентов
   * @param {string} term - Поисковый запрос
   * @returns {Promise<Array<ClientSearchDto>>} Массив найденных клиентов
   */
  static async searchItems(term) {
    const response = await api.get('/clients/search', {
      params: { search_request: term }
    });
    const data = response.data.data || response.data;
    return ClientSearchDto.fromApiArray(Array.isArray(data) ? data : []);
  }

  /**
   * Получить всех клиентов без пагинации
   * @returns {Promise<Array<ClientDto>>} Массив клиентов
   */
  static async getAllItems() {
    const response = await api.get(`/clients/all`);
    return ClientDto.fromApiArray(response.data.data);
  }

  /**
   * Создать нового клиента
   * @param {Object} item - Данные клиента
   * @returns {Promise<Object>} Ответ от сервера с созданным клиентом
   */
  static async storeItem(item) {
    const response = await BaseController.storeItemWithCache('/clients', item, {
      cacheKeys: 'clients_list'
    });
    return { item: response.item, message: response.message };
  }

  /**
   * Обновить клиента
   * @param {number|string} id - ID клиента
   * @param {Object} item - Данные клиента
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItemWithCache('/clients', id, item, {
      cacheKeys: 'clients_list'
    });
  }

  /**
   * Удалить клиента
   * @param {number|string} id - ID клиента
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/clients', id, 'clients_list');
  }

  /**
   * Получить историю баланса клиента
   * @param {number|string} id - ID клиента
   * @returns {Promise<Array<ClientBalanceHistoryDto>>} История баланса
   */
  static async getBalanceHistory(id) {
    const response = await api.get(`/clients/${id}/balance-history`);
    return ClientBalanceHistoryDto.fromApiArray(response.data.history);
  }
}
