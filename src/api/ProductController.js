import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class ProductController extends BaseController {
  static async getItems(page = 1, products = true, params = {}, perPage = 20) {
    const endpoint = `/${products ? "products" : "services"}`;
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });

    const data = await super.getItems(endpoint, page, perPage, cleanParams);
    const items = ProductDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/products", id);
    return ProductDto.fromApi(data);
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

  static async search(searchTerm, productsOnly = null, warehouseId = null) {
    return this.searchItems(searchTerm, productsOnly, warehouseId);
  }

  static async searchItems(searchTerm, productsOnly = null, warehouseId = null, signal = null, warehouseStockPolicy = null) {
    return super.handleRequest(
      async () => {
        const searchParams = {
          search: searchTerm,
        };

        if (productsOnly !== null) {
          searchParams.productsOnly = productsOnly;
        }

        if (warehouseId) {
          searchParams.warehouseId = warehouseId;
        }

        if (warehouseStockPolicy) {
          searchParams.warehouseStockPolicy = warehouseStockPolicy;
        }

        const config = { params: searchParams };
        if (signal) config.signal = signal;
        const data = await super.getData("/products/search", config);
        return ProductSearchDto.fromApiArray(data);
      },
      "Ошибка при поиске товаров или услуг:"
    );
  }

  static async getHistory(productId, filter = 'all') {
    return super.handleRequest(
      async () => {
        const data = await super.get(`/products/${productId}/history`, { params: { filter } });
        return data;
      },
      "Ошибка при загрузке истории товара"
    );
  }
}
