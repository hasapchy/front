import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import CashRegisterBalanceDto from "@/dto/cash_register/CashRegisterBalanceDto";
import CashRegisterBalanceItemDto from "@/dto/cash_register/CashRegisterBalanceItemDto";
import CashRegisterDto from "@/dto/cash_register/CashRegisterDto";

export default class CashRegisterController {
  static async getItems(page = 1) {
    try {
      const response = await api.get(`/cash_registers?page=${page}`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        return new CashRegisterDto(
          item.id,
          item.name,
          item.balance,
          item.users,
          item.currency_id,
          item.currency_name,
          item.currency_code,
          item.currency_symbol,
          item.created_at,
          item.updated_at
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
      console.error("Ошибка при получении касс:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/cash_registers/all`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.map((item) => {
        return new CashRegisterDto(
          item.id,
          item.name,
          item.balance,
          item.users,
          item.currency_id,
          item.currency_name,
          item.currency_code,
          item.currency_symbol,
          item.created_at,
          item.updated_at
        );
      });
      return items;
    } catch (error) {
      console.error("Ошибка при получении касс:", error);
      throw error;
    }
  }

  /**
   * @param {number[]} cashIds — массив id касс (пустой для всех)
   * @param {string|null} startDate — 'DD.MM.YYYY'
   * @param {string|null} endDate   — 'DD.MM.YYYY'
   */
  static async getCashBalance(cashIds = [], startDate = null, endDate = null) {
    try {
      const params = {};
      if (cashIds.length) {
        params.cash_register_ids = cashIds.join(",");
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get("/cash_registers/balance", { params });
      const data = response.data;
      return data.map(
        (item) =>
          new CashRegisterBalanceDto(
            item.id,
            item.name,
            item.balance.map(
              (b) => new CashRegisterBalanceItemDto(b.value, b.title, b.type)
            )
          )
      );
    } catch (error) {
      console.error("Ошибка при получении баланса касс:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/cash_registers", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании кассы:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/cash_registers/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении кассы:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/cash_registers/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении категории:", error);
      throw error;
    }
  }
}
