import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseMovementDto from "@/dto/warehouse/WarehouseMovementDto";

export default class WarehouseMovementController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/warehouse_movements?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = WarehouseMovementDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении перемещений:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/warehouse_movements", item);
      return data;
    } catch (error) {
      console.error("Ошибка при перемещении:", error);
      throw error;
    }
  }
  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/warehouse_movements/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении перемещения:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/warehouse_movements/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении перемещения:", error);
      throw error;
    }
  }
}
