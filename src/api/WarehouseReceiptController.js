import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseReceiptDto from "@/dto/warehouse/WarehouseReceiptDto";

export default class WarehouseReceiptController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/warehouse_receipts?page=${page}&per_page=${per_page}`);
      const data = response.data;

      const items = WarehouseReceiptDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении оприходований:", error);
      throw error;
    }
  }

  static async getStocks(page = 1, per_page = 20) {
    return this.getItems(page, per_page);
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/warehouse_receipts", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании оприходования:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/warehouse_receipts/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении оприходования:", error);
      throw error;
    }
  }


  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/warehouse_receipts/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении оприходования:", error);
      throw error;
    }
  }


  static async getItem(id) {
    try {
      const { data } = await api.get(`/warehouse_receipts/${id}`);
      const item = data.item;
      return WarehouseReceiptDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении оприходования:", error);
      throw error;
    }
  }
}

