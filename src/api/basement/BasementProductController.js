import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import basementApi from "./basementAxiosInstance";

export default class BasementProductController {
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('per_page', per_page);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const endpoint = `/${products ? "products" : "services"}?${queryParams.toString()}`;
    
    const response = await basementApi.get(endpoint);
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

  static async searchItems($search_term, params = {}) {
    const searchParams = {
      ...params,
      search: $search_term,
      products_only: true
    };
    
    const response = await basementApi.get("/products/search", {
      params: searchParams,
    });
    const data = response.data;
    
    return ProductSearchDto.fromApiArray(data);
  }
}

