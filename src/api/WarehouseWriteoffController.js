import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseWriteoffDto from "@/dto/warehouse/WarehouseWriteoffDto";

export default class WarehouseWriteoffController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/warehouse_writeoffs?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = WarehouseWriteoffDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении списаний:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/warehouse_writeoffs", item);
      return data;
    } catch (error) {
      console.error("Ошибка при списании:", error);
      throw error;
    }
  }
  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/warehouse_writeoffs/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении списания:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/warehouse_writeoffs/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении списания:", error);
      throw error;
    }
  }
}
