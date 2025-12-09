import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import CashRegisterBalanceDto from "@/dto/cash_register/CashRegisterBalanceDto";
import CashRegisterDto from "@/dto/cash_register/CashRegisterDto";
import BaseController from "./BaseController";

export default class CashRegisterController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/cash_registers", page, per_page);
    const items = CashRegisterDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/cash_registers");
    return CashRegisterDto.fromApiArray(data);
  }

  static async getCashBalance(cashIds = [], startDate = null, endDate = null, additionalParams = {}) {
    return super.handleRequest(
      async () => {
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

        if (additionalParams.transaction_type) {
          params.transaction_type = additionalParams.transaction_type;
        }
        if (additionalParams.source) {
          params.source = additionalParams.source;
        }

        const response = await api.get("/cash_registers/balance", { params });
        return CashRegisterBalanceDto.fromApiArray(response.data);
      },
      "Ошибка при получении баланса касс:"
    );
  }

  static async storeItem(item) {
    return super.storeItem("/cash_registers", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/cash_registers", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/cash_registers", id);
  }
}
