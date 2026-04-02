import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import CashRegisterBalanceDto from "@/dto/cash_register/CashRegisterBalanceDto";
import CashRegisterDto from "@/dto/cash_register/CashRegisterDto";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class CashRegisterController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems("/cash_registers", page, perPage);
    const items = CashRegisterDto.fromApiArray(data.items);

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

  static async storeItem(item) {
    return super.storeItem("/cash_registers", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/cash_registers", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/cash_registers", id);
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

        if (additionalParams.transactionType) {
          params.transaction_type = additionalParams.transactionType;
        }
        if (additionalParams.source) {
          params.source = additionalParams.source;
        }

        const data = await super.getData("/cash_registers/balance", { params });
        return CashRegisterBalanceDto.fromApiArray(data);
      },
      apiErrorMessage("cashRegistersBalance")
    );
  }

}
