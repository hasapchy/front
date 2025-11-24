import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import basementApi from "./basementAxiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";

/**
 * Контроллер для работы с клиентами в Basement
 * @class BasementClientController
 */
export default class BasementClientController {
  /**
   * Получить клиента по ID
   * @param {number|string} id - ID клиента
   * @returns {Promise<ClientDto|null>} Клиент или null
   */
  static async getItem(id) {
    const response = await basementApi.get(`/clients/${id}`);
    const items = ClientDto.fromApiArray([response.data.item]);
    return items[0] || null;
  }

  /**
   * Получить список клиентов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {string|null} [search=null] - Поисковый запрос
   * @param {boolean} [includeInactive=false] - Включать неактивных клиентов
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, search = null, includeInactive = false, per_page = 20) {
    const params = {
      page,
      per_page,
      ...(search && { search }),
      ...(includeInactive && { include_inactive: true })
    };
    
    const response = await basementApi.get("/clients", { params });
    const data = response.data;
    const items = ClientDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  /**
   * Поиск клиентов
   * @param {string} term - Поисковый запрос
   * @returns {Promise<Array<ClientSearchDto>>} Массив найденных клиентов
   */
  static async searchItems(term) {
    const response = await basementApi.get('/clients/search', {
      params: { search_request: term }
    });
    const data = response.data.data || response.data;
    return ClientSearchDto.fromApiArray(data);
  }

  /**
   * Получить всех клиентов без пагинации
   * @returns {Promise<Array<ClientDto>>} Массив клиентов
   */
  static async getAllItems() {
    const response = await basementApi.get(`/clients/all`);
    return ClientDto.fromApiArray(response.data.data);
  }

  /**
   * Создать нового клиента
   * @param {Object} item - Данные клиента
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    const { data } = await basementApi.post("/clients", item);
    return data;
  }

  /**
   * Обновить клиента
   * @param {number|string} id - ID клиента
   * @param {Object} item - Данные клиента
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    const { data } = await basementApi.put(`/clients/${id}`, item);
    return data;
  }

  /**
   * Удалить клиента
   * @param {number|string} id - ID клиента
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const { data } = await basementApi.delete(`/clients/${id}`);
    return data;
  }

  /**
   * Получить историю баланса клиента
   * @param {number|string} id - ID клиента
   * @returns {Promise<Array<ClientBalanceHistoryDto>>} История баланса
   */
  static async getBalanceHistory(id) {
    const response = await basementApi.get(`/clients/${id}/balance-history`);
    return ClientBalanceHistoryDto.fromApiArray(response.data.history);
  }
}

