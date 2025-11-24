import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import basementApi from "./basementAxiosInstance";

/**
 * Контроллер для работы с продуктами в Basement
 * @class BasementProductController
 */
export default class BasementProductController {
  /**
   * Получить список продуктов/услуг с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {boolean} [products=true] - true для продуктов, false для услуг
   * @param {Object} [params={}] - Дополнительные параметры фильтрации
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    const requestParams = {
      page,
      per_page,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value != null && value !== '')
      )
    };
    
    const response = await basementApi.get(`/${products ? "products" : "services"}`, {
      params: requestParams
    });
    const data = response.data;
    const items = ProductDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  /**
   * Поиск продуктов
   * @param {string} searchTerm - Поисковый запрос
   * @param {Object} [params={}] - Дополнительные параметры поиска
   * @returns {Promise<Array<ProductSearchDto>>} Массив найденных продуктов
   */
  static async searchItems(searchTerm, params = {}) {
    const searchParams = {
      ...params,
      search: searchTerm,
      products_only: true
    };
    
    const response = await basementApi.get("/products/search", {
      params: searchParams,
    });
    return ProductSearchDto.fromApiArray(response.data.data);
  }
}

