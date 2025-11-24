import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { queryCache } from "@/utils/cacheHelper";

/**
 * Базовый контроллер для работы с API
 * @class BaseController
 */
export default class BaseController {
  /**
   * Получить список элементов с пагинацией
   * @param {string} endpoint - Endpoint API
   * @param {Function|null} DtoClass - Класс DTO для преобразования данных
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @param {Object} [params={}] - Дополнительные параметры запроса
   * @param {Object} [cacheOptions] - Опции кеширования (cacheKey, cacheParams)
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(endpoint, DtoClass, page = 1, per_page = 20, params = {}, cacheOptions = null) {
    if (cacheOptions?.cacheKey) {
      const cacheParams = { page, per_page, ...cacheOptions.cacheParams, ...params };
      const cached = await queryCache.get(cacheOptions.cacheKey, cacheParams);
      
      if (cached?.items?.length && DtoClass && cached.items[0] instanceof DtoClass) {
        return cached;
      }
    }

    const response = await api.get(endpoint, {
      params: {
        page,
        per_page,
        ...params
      }
    });
    const data = response.data;
    
    // ResourceCollection->response() возвращает {data: [...], meta: {...}, links: {...}}
    // Нужно проверить, какая структура пришла
    const items = data.items || data.data || [];
    const current_page = data.current_page || data.meta?.current_page || page;
    const next_page = data.next_page || data.meta?.next_page || null;
    const last_page = data.last_page || data.meta?.last_page || 1;
    const total = data.total || data.meta?.total || items.length;
    
    let paginatedResponse;
    if (DtoClass) {
      const dtoItems = DtoClass.fromApiArray(items);
      paginatedResponse = new PaginatedResponse(
        dtoItems,
        current_page,
        next_page,
        last_page,
        total
      );
    } else {
      paginatedResponse = new PaginatedResponse(
        items,
        current_page,
        next_page,
        last_page,
        total
      );
    }

    if (cacheOptions?.cacheKey) {
      const cacheParams = { page, per_page, ...cacheOptions.cacheParams, ...params };
      queryCache.set(cacheOptions.cacheKey, cacheParams, paginatedResponse);
    }
    
    return paginatedResponse;
  }

  /**
   * Получить все элементы без пагинации
   * @param {string} endpoint - Endpoint API
   * @param {Function|null} DtoClass - Класс DTO для преобразования данных
   * @returns {Promise<Array>} Массив элементов
   */
  static async getAllItems(endpoint, DtoClass) {
    const response = await api.get(`${endpoint}/all`);
    const data = response.data.data;
    
    if (DtoClass) {
      return DtoClass.fromApiArray(data);
    }
    
    return data;
  }

  /**
   * Получить один элемент по ID
   * @param {string} endpoint - Endpoint API
   * @param {Function|null} DtoClass - Класс DTO для преобразования данных
   * @param {number|string} id - ID элемента
   * @returns {Promise<Object|null>} Элемент или null
   */
  static async getItem(endpoint, DtoClass, id) {
    const response = await api.get(`${endpoint}/${id}`);
    const item = response.data.item || response.data;
    
    if (DtoClass) {
      const items = DtoClass.fromApiArray([item]);
      return items[0] || null;
    }
    
    return item;
  }

  /**
   * Создать новый элемент
   * @param {string} endpoint - Endpoint API
   * @param {Object} item - Данные элемента
   * @param {Object} [options={}] - Дополнительные опции (headers, transformRequest)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(endpoint, item, options = {}) {
    const { headers = {}, transformRequest } = options;
    let requestData = item;
    
    if (transformRequest) {
      requestData = transformRequest(item);
    }
    
    const response = await api.post(endpoint, requestData, { headers });
    return response.data;
  }

  /**
   * Обновить элемент
   * @param {string} endpoint - Endpoint API
   * @param {number|string} id - ID элемента
   * @param {Object} item - Данные элемента
   * @param {Object} [options={}] - Дополнительные опции (headers, transformRequest)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(endpoint, id, item, options = {}) {
    const { headers = {}, transformRequest } = options;
    let requestData = item;
    
    if (transformRequest) {
      requestData = transformRequest(item);
    }
    
    const response = await api.put(`${endpoint}/${id}`, requestData, { headers });
    return response.data;
  }

  /**
   * Удалить элемент
   * @param {string} endpoint - Endpoint API
   * @param {number|string} id - ID элемента
   * @param {string|Array<string>} [cacheKeys] - Ключи кеша для инвалидации
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(endpoint, id, cacheKeys = null) {
    const response = await api.delete(`${endpoint}/${id}`);
    
    if (cacheKeys) {
      const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
      keys.forEach(key => queryCache.invalidate(key));
    }
    
    return response.data;
  }

  /**
   * Создать новый элемент с инвалидацией кеша
   * @param {string} endpoint - Endpoint API
   * @param {Object} item - Данные элемента
   * @param {Object} [options={}] - Дополнительные опции (headers, transformRequest, cacheKeys)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItemWithCache(endpoint, item, options = {}) {
    const { cacheKeys, ...restOptions } = options;
    const response = await this.storeItem(endpoint, item, restOptions);
    
    if (cacheKeys) {
      const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
      keys.forEach(key => queryCache.invalidate(key));
    }
    
    return response;
  }

  /**
   * Обновить элемент с инвалидацией кеша
   * @param {string} endpoint - Endpoint API
   * @param {number|string} id - ID элемента
   * @param {Object} item - Данные элемента
   * @param {Object} [options={}] - Дополнительные опции (headers, transformRequest, cacheKeys)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItemWithCache(endpoint, id, item, options = {}) {
    const { cacheKeys, ...restOptions } = options;
    const response = await this.updateItem(endpoint, id, item, restOptions);
    
    if (cacheKeys) {
      const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
      keys.forEach(key => queryCache.invalidate(key));
    }
    
    return response;
  }
}

