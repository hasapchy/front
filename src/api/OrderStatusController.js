import OrderStatusDto from "@/dto/order/OrderStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

export default class OrderStatusController {
  static async getAllItems() {
    try {
      const response = await api.get(`/order_statuses/all`);
      return OrderStatusDto.fromApiArray(response.data);
    } catch (error) {
      console.error("Ошибка при получении статусов заказов:", error);
      throw error;
    }
  }

  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/order_statuses?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = OrderStatusDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении статусов заказов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/order_statuses", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании статуса заказа:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/order_statuses/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении статуса заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/order_statuses/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении статуса заказа:", error);
      throw error;
    }
  }
}
