import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransactionCategoryDto from "@/dto/transaction/TransactionCategoryDto";
import api from "./axiosInstance";

export default class TransactionCategoryController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/transaction_categories?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = TransactionCategoryDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении категорий транзакций:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/transaction_categories/all`);
      return TransactionCategoryDto.fromApiArray(response.data);
    } catch (error) {
      console.error("Ошибка при получении категорий транзакций:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/transaction_categories", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании категории транзакций:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/transaction_categories/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении категории транзакций:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/transaction_categories/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении категории транзакций:", error);
      throw error;
    }
  }
}
