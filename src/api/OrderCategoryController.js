import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import OrderCategoryDto from "@/dto/order/OrderCategoryDto";
import api from "./axiosInstance";

export default class OrderCategoryController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/order_categories?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = OrderCategoryDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении категорий заказов:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/order_categories/all`);
      return OrderCategoryDto.fromApiArray(response.data);
    } catch (error) {
      console.error("Ошибка при получении категорий заказов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/order_categories", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании категории заказа:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/order_categories/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении категории заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/order_categories/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении категории заказа:", error);
      throw error;
    }
  }
}
