import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class ProductController extends BaseController {
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    const endpoint = `/${products ? "products" : "services"}`;
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });

    const data = await super.getItems(endpoint, page, per_page, cleanParams);
    const items = ProductDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async searchItems($search_term, productsOnly = null, warehouseId = null) {
    return super.handleRequest(
      async () => {
        const searchParams = {
          search: $search_term,
        };
        
        if (productsOnly !== null) {
          searchParams.products_only = productsOnly;
        }
        
        if (warehouseId) {
          searchParams.warehouse_id = warehouseId;
        }
        
        const response = await api.get("/products/search", {
          params: searchParams,
        });
        return ProductSearchDto.fromApiArray(response.data);
      },
      "Ошибка при поиске товаров или услуг:"
    );
  }

  static async storeItem(item, imageFile) {
    const data = await super.storeItem("/products", item, {
      file: imageFile,
      fileField: "image"
    });
    await CacheInvalidator.onCreate('products');
    return { item: data.item, message: data.message };
  }

  static async updateItem(id, item, imageFile) {
    const data = await super.updateItem("/products", id, item, {
      file: imageFile,
      fileField: "image"
    });
    await CacheInvalidator.onUpdate('products');
    return { item: data.item, message: data.message };
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/products", id);
    await CacheInvalidator.onDelete('products');
    return { item: data.item, message: data.message };
  }

  static async getItem(id) {
    const data = await super.getItem("/products", id);
    return ProductDto.fromApiArray([data.item])[0] || null;
  }
}
