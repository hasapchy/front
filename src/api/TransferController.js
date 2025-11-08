import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import TransferDto from "@/dto/transfer/TransferDto";

export default class TransferController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/transfers?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = TransferDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении трансферов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/transfers", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании трансфера:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/transfers/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении трансфера:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/transfers/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении трансфера:", error);
      throw error;
    }
  }
}
