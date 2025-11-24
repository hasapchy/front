import BaseController from "./BaseController";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import api from "./axiosInstance";
import { queryCache } from "@/utils/cacheHelper";
import { uploadWithProgress } from "@/utils/axiosHelpers";
import { createFormData } from "@/utils/formDataHelper";

/**
 * Контроллер для работы с продуктами и услугами
 * @class ProductController
 */
export default class ProductController {
  /**
   * Получить список продуктов/услуг с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {boolean} [products=true] - true для продуктов, false для услуг
   * @param {Object} [params={}] - Дополнительные параметры фильтрации
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    const cacheKey = products ? 'products_list' : 'services_list';
    const endpoint = `/${products ? "products" : "services"}`;
    
    const requestParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null && value !== '')
    );

    const cacheParams = { products, ...params };

    return BaseController.getItems(
      endpoint,
      ProductDto,
      page,
      per_page,
      requestParams,
      { cacheKey, cacheParams }
    );
  }

  /**
   * Поиск продуктов/услуг
   * @param {string} searchTerm - Поисковый запрос
   * @param {boolean|null} [productsOnly=null] - Только продукты
   * @param {number|null} [warehouseId=null] - ID склада для фильтрации
   * @returns {Promise<Array<ProductSearchDto>>} Массив найденных продуктов
   */
  static async searchItems(searchTerm, productsOnly = null, warehouseId = null) {
    const searchParams = {
      search: searchTerm,
      ...(productsOnly !== null && { products_only: productsOnly }),
      ...(warehouseId && { warehouse_id: warehouseId })
    };
    
    const response = await api.get("/products/search", { params: searchParams });
    return ProductSearchDto.fromApiArray(response.data.data);
  }

  /**
   * Создать новый продукт/услугу
   * @param {Object} item - Данные продукта
   * @param {File|null} [imageFile=null] - Файл изображения
   * @param {Object} [options={}] - Дополнительные опции (onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера с созданным продуктом
   */
  static async storeItem(item, imageFile, options = {}) {
    const formData = createFormData(item, {
      file: imageFile,
      fileKey: 'image'
    });

    const { data } = await uploadWithProgress("/products", formData, {
      ...options,
      timeout: options.timeout || 60000,
    });
    queryCache.invalidate('products_list');
    queryCache.invalidate('services_list');
    return { item: data.item, message: data.message };
  }

  /**
   * Обновить продукт/услугу
   * @param {number|string} id - ID продукта
   * @param {Object} item - Данные продукта
   * @param {File|null} [imageFile=null] - Файл изображения
   * @param {Object} [options={}] - Дополнительные опции (onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера с обновленным продуктом
   */
  static async updateItem(id, item, imageFile, options = {}) {
    const formData = createFormData(item, {
      file: imageFile,
      fileKey: 'image'
    });

    const { data } = await uploadWithProgress(`/products/${id}`, formData, {
      ...options,
      timeout: options.timeout || 60000,
    });
    queryCache.invalidate('products_list');
    queryCache.invalidate('services_list');
    return { item: data.item, message: data.message };
  }

  /**
   * Удалить продукт/услугу
   * @param {number|string} id - ID продукта
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const data = await BaseController.deleteItem('/products', id, ['products_list', 'services_list']);
    return { item: data.item, message: data.message };
  }

  /**
   * Получить продукт/услугу по ID
   * @param {number|string} id - ID продукта
   * @returns {Promise<ProductDto|null>} Продукт или null
   */
  static async getItem(id) {
    const response = await api.get(`/products/${id}`);
    const data = response.data.item || response.data;
    const items = ProductDto.fromApiArray([data]);
    return items[0] || null;
  }
}
