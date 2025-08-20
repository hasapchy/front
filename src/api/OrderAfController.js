import api from "./axiosInstance";
import OrderAfDto from "@/dto/order/OrderAfDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

export default class OrderAfController {

  static async getItemsPaginated(page = 1, perPage = 20) {
    try {
      const params = { page: page, per_page: perPage };
      
      const response = await api.get("/order-af", { params });
      const data = response.data;
      
      const items = data.items.map((item) => OrderAfDto.fromApi(item));
      
      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
      
      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении списка дополнительных полей:", error);
      throw error;
    }
  }


  static async getItemById(id) {
    try {
      const response = await api.get(`/order-af/${id}`);
      return OrderAfDto.fromApi(response.data);
    } catch (error) {
      console.error("Ошибка при получении дополнительного поля:", error);
      throw error;
    }
  }

  static async createItem(data) {
    try {
      const response = await api.post("/order-af", data);
      return {
        message: response.data.message,
        field: OrderAfDto.fromApi(response.data.field)
      };
    } catch (error) {
      console.error("Ошибка при создании дополнительного поля:", error);
      throw error;
    }
  }

  static async updateItem(id, data) {
    try {
      const response = await api.put(`/order-af/${id}`, data);
      return {
        message: response.data.message,
        field: OrderAfDto.fromApi(response.data.field)
      };
    } catch (error) {
      console.error("Ошибка при обновлении дополнительного поля:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const response = await api.delete(`/order-af/${id}`);
      return {
        message: response.data.message,
        field: response.data.field
      };
    } catch (error) {
      console.error("Ошибка при удалении дополнительного поля:", error);
      throw error;
    }
  }

  
  static async getFieldsByCategory(categoryId) {
    try {
      const response = await api.get(`/order-af/category/${categoryId}`);
      return response.data.fields.map((field) => OrderAfDto.fromApi(field));
    } catch (error) {
      console.error("Ошибка при получении полей для категории:", error);
      throw error;
    }
  }

  static async getFieldsByCategories(categoryIds) {
    try {
      const response = await api.post("/order-af/categories", {
        category_ids: categoryIds
      });
      return response.data.fields.map((field) => OrderAfDto.fromApi(field));
    } catch (error) {
      console.error("Ошибка при получении полей для категорий:", error);
      throw error;
    }
  }


  static async getFieldTypes() {
    try {
      const response = await api.get("/order-af/types");
      return response.data.types;
    } catch (error) {
      console.error("Ошибка при получении типов полей:", error);
      throw error;
    }
  }


  static async getFieldsForOrder(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      const order = response.data.item;
      
      if (order.additional_fields) {
        return order.additional_fields.map((field) => OrderAfDto.fromApi(field));
      }
      
      return [];
    } catch (error) {
      console.error("Ошибка при получении полей для заказа:", error);
      throw error;
    }
  }

  static validateFieldData(data) {
    const errors = {};

    if (!data.name || data.name.trim() === '') {
      errors.name = 'Название поля обязательно';
    }

    if (!data.type) {
      errors.type = 'Тип поля обязателен';
    }

    if (!data.category_ids || data.category_ids.length === 0) {
      errors.category_ids = 'Необходимо выбрать хотя бы одну категорию';
    }

    if (data.type === 'select' && (!data.options || data.options.length === 0)) {
      errors.options = 'Для поля типа "Выбор из списка" необходимо указать варианты';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }


  static prepareFieldData(data) {
    // Правильно обрабатываем значение по умолчанию в зависимости от типа поля
    let defaultValue = null;
    if (data.default !== null && data.default !== undefined && data.default !== '') {
      if (data.type === 'boolean') {
        // Для boolean преобразуем в строку '1' или '0'
        defaultValue = data.default ? '1' : '0';
      } else if (data.type === 'int') {
        // Для числа преобразуем в строку
        defaultValue = String(data.default);
      } else {
        // Для остальных типов (string, date, datetime, select) оставляем как есть
        defaultValue = String(data.default);
      }
    }

    return {
      name: data.name?.trim(),
      type: data.type,
      category_ids: data.category_ids || [],
      options: data.type === 'select' ? data.options : null,
      required: data.required || false,
      default: defaultValue
    };
  }
}
