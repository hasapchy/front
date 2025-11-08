import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import CashRegisterBalanceDto from "@/dto/cash_register/CashRegisterBalanceDto";
import CashRegisterBalanceItemDto from "@/dto/cash_register/CashRegisterBalanceItemDto";
import CashRegisterDto from "@/dto/cash_register/CashRegisterDto";

export default class CashRegisterController {
  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/cash_registers?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = CashRegisterDto.fromApiArray(data.items);

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
      const items = CashRegisterDto.fromApiArray(data);
      return items;
    } catch (error) {
      console.error("Ошибка при получении касс:", error);
      throw error;
    }
  }

  static async getCashBalance(cashIds = [], startDate = null, endDate = null, additionalParams = {}) {
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

      // Добавляем дополнительные параметры фильтрации
      if (additionalParams.transaction_type) {
        params.transaction_type = additionalParams.transaction_type;
      }
      if (additionalParams.source) {
        params.source = additionalParams.source;
      }

      const response = await api.get("/cash_registers/balance", { params });
      const data = response.data;
      return CashRegisterBalanceDto.fromApiArray(data);
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
      console.error("Ошибка при удалении кассы:", error);
      throw error;
    }
  }
}
