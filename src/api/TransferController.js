import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import TransferDto from "@/dto/transfer/TransferDto";

export default class TransferController {
  static async getItems(page = 1) {
    try {
      const response = await api.get(`/transfers?page=${page}`);
      const data = response.data;
      console.log(data);
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        return new TransferDto(
          item.id,
          item.cash_from_id,
          item.cash_from_name,
          item.currency_from_id,
          item.currency_from_name,
          item.currency_from_code,
          item.currency_from_symbol,
          item.cash_to_id,
          item.cash_to_name,
          item.currency_to_id,
          item.currency_to_name,
          item.currency_to_code,
          item.currency_to_symbol,
          item.amount,
          item.user_id,
          item.user_name,
          item.date,
          item.note
        );
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
      console.error("Ошибка при получении трансферов:", error);
      throw error;
    }
  }

  // static async getAllItems() {
  //     try {
  //         const response = await api.get(`/categories/all`);
  //         const data = response.data;
  //         console.log(data);
  //         // Преобразуем полученные данные в DTO
  //         const items = data.map(item => {
  //             return new CategoryDto(
  //                 item.id,
  //                 item.name,
  //                 item.parent_id,
  //                 item.parent_name,
  //                 item.user_id,
  //                 item.user_name,
  //                 item.users,
  //                 item.created_at,
  //                 item.updated_at,
  //             );
  //         });
  //         return items;
  //     } catch (error) {
  //         console.error('Ошибка при получении категорий:', error);
  //         throw error;
  //     }
  // }

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
