import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import api from "./axiosInstance";

export default class ProductController {
  static async getItems(page = 1, products = true, params = {}, per_page = 20) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('per_page', per_page);
      
      // Добавляем дополнительные параметры
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(
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
  static async searchItems($search_term, productsOnly = null, warehouseId = null) {
    try {
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
      const data = response.data;
      const items = ProductSearchDto.fromApiArray(data);

      return items;
    } catch (error) {
      console.error("Ошибка при поиске товаров или услуг:", error);
      throw error;
    }
  }

  static async storeItem(item, imageFile) {
    try {
      const formData = new FormData();
      Object.keys(item).forEach((key) => {
        formData.append(key, item[key]);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { item: data.item, message: data.message };
    } catch (error) {
      console.error("Ошибка при создании товара или услуги:", error);
      throw error;
    }
  }
  static async updateItem(id, item, imageFile) {
    try {
      const formData = new FormData();
      Object.keys(item).forEach((key) => {
        formData.append(key, item[key]);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await api.post(`/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { item: data.item, message: data.message };
    } catch (error) {
      console.error("Ошибка при обновлении товара или услуги:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/products/${id}`);
      return { item: data.item, message: data.message };
    } catch (error) {
      console.error("Ошибка при удалении товара или услуги:", error);
      throw error;
    }
  }

  static async getItem(id) {
    try {
      const response = await api.get(`/products/${id}`);
      const item = response.data;
      return ProductDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении товара по ID:", error);
      throw error;
    }
  }
}
