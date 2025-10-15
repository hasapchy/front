import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import basementApi from "./basementAxiosInstance";

export default class BasementProductController {
  static async getItems(page = 1, products = true, params = {}, per_page = 10) {
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
      const items = data.items.map((item) => {
        return new ProductDto({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description,
          sku: item.sku,
          image: item.image,
          category_id: item.category_id,
          category_name: item.category_name,
          categories: item.categories || [],
          stock_quantity: item.stock_quantity,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          unit_short_name: item.unit_short_name,
          unit_calc_area: item.unit_calc_area,
          barcode: item.barcode,
          is_serialized: item.is_serialized,
          date: item.date,
          creator: item.creator,
          created_at: item.created_at,
          updated_at: item.updated_at,
          retail_price: item.retail_price,
          wholesale_price: item.wholesale_price,
          purchase_price: item.purchase_price,
        });
      });

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
      // Преобразуем полученные данные в DTO для поиска (только необходимые поля)
      const items = data.map((item) => {
        return new ProductSearchDto({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description,
          sku: item.sku,
          image: item.image,
          category_id: item.category_id,
          category_name: item.category_name,
          categories: item.categories || [],
          stock_quantity: item.stock_quantity,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          unit_short_name: item.unit_short_name,
          unit_calc_area: item.unit_calc_area,
          barcode: item.barcode,
          is_serialized: item.is_serialized,
          date: item.date,
          creator: item.creator,
          created_at: item.created_at,
          updated_at: item.updated_at,
          retail_price: item.retail_price,
          wholesale_price: item.wholesale_price,
          purchase_price: item.purchase_price,
        });
      });

      return items;
    } catch (error) {
      console.error("Ошибка при поиске товаров или услуг:", error);
      throw error;
    }
  }
}

