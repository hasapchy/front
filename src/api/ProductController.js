import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProductDto from "@/dto/product/ProductDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import api from "./axiosInstance";

export default class ProductController {
  static async getItems(page = 1, products = true, params = {}) {
    try {
      // Строим query string из параметров
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      
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
      const items = data.items.map((item) => {
        // Проверяем различные возможные поля для остатков из таблицы warehouse_stocks
        let stock_quantity = item.stock_quantity;
        if (stock_quantity === undefined || stock_quantity === null) {
          // Проверяем альтернативные названия полей для остатков по складам
          stock_quantity = item.warehouse_quantity || 
                          item.quantity_on_warehouse || 
                          item.warehouse_stock || 
                          item.warehouse_stock_quantity ||
                          item.current_stock || 
                          item.stock_on_warehouse ||
                          item.quantity || 0;
        }
        
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
          stock_quantity: stock_quantity,
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
          // currency_id: item.currency_id,
          // currency_name: item.currency_name,
          // currency_code: item.currency_code,
          // currency_symbol: item.currency_symbol
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
        ...params
      };
      
      const response = await api.get("/products/search", {
        params: searchParams,
      });
      const data = response.data;
      // Преобразуем полученные данные в DTO для поиска (только необходимые поля)
      const items = data.map((item) => {
        // Проверяем различные возможные поля для остатков из таблицы warehouse_stocks
        let stock_quantity = item.stock_quantity;
        if (stock_quantity === undefined || stock_quantity === null) {
          // Проверяем альтернативные названия полей для остатков по складам
          stock_quantity = item.warehouse_quantity || 
                          item.quantity_on_warehouse || 
                          item.warehouse_stock || 
                          item.warehouse_stock_quantity ||
                          item.current_stock || 
                          item.stock_on_warehouse ||
                          item.quantity || 0;
        }
        
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
          stock_quantity: stock_quantity,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          unit_short_name: item.unit_short_name,
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
      return data;
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
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении товара или услуги:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/products/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении товара или услуги:", error);
      throw error;
    }
  }

  static async getItem(id) {
    try {
      const response = await api.get(`/products/${id}`);
      const item = response.data;
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
        created_at: item.created_at,
        updated_at: item.updated_at,
        retail_price: item.retail_price,
        wholesale_price: item.wholesale_price,
        purchase_price: item.purchase_price,
      });
    } catch (error) {
      console.error("Ошибка при получении товара по ID:", error);
      throw error;
    }
  }
}
