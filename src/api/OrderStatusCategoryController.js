import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

export default class OrderStatusCategoryController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/order_status_categories?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = OrderStatusCategoryDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении категорий статусов:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/order_status_categories/all`);
      const data = response.data;
      return OrderStatusCategoryDto.fromApiArray(data);
    } catch (error) {
      console.error("Ошибка при получении всех категорий статусов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/order_status_categories", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании категории статусов:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/order_status_categories/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении категории статусов:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/order_status_categories/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении категории статусов:", error);
      throw error;
    }
  }
}
