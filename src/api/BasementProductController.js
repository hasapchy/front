import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import basementApi from "./basementAxiosInstance";

export default class BasementProductController {
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    try {
      // Строим query string из параметров
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('per_page', per_page);
      
      // Для basement всегда фильтруем по категории 1
      queryParams.append('filter_by_category_1', 'true');
      
      // Добавляем дополнительные параметры
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await basementApi.get(
        `/${products ? "products" : "services"}?${queryParams.toString()}`
      );
      const data = response.data;
      const items = ProductDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении товаров или услуг:", error);
      throw error;
    }
  }

  static async searchItems($search_term, params = {}) {
    try {
      const searchParams = {
        search: $search_term,
        filter_by_category_1: 'true', // Для basement всегда фильтруем по категории 1
        ...params
      };
      
      const response = await basementApi.get("/products/search", {
        params: searchParams,
      });
      const data = response.data;
      const items = ProductSearchDto.fromApiArray(data);

      return items;
    } catch (error) {
      console.error("Ошибка при поиске товаров или услуг:", error);
      throw error;
    }
  }
}

