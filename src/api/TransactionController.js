import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransactionDto from "@/dto/transaction/TransactionDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class TransactionController extends BaseController {
  static async getItems(
    page = 1,
    cash_id = null,
    date_filter_type = "all_time",
    order_id = null,
    search = null,
    transaction_type = null,
    source = null,
    project_id = null,
    per_page = 20,
    start_date = null,
    end_date = null,
    is_debt = null,
    category_ids = null,
    contract_id = null
  ) {
    const params = {
      cash_id,
      date_filter_type,
      order_id,
      search,
      transaction_type,
      source,
      project_id,
      start_date,
      end_date,
      is_debt,
      contract_id,
    };

    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      params.category_ids = category_ids.join(',');
    }

    const data = await super.getItems("/transactions", page, per_page, params);
    const items = TransactionDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/transactions", id);
    return TransactionDto.fromApiArray([data.item])[0] || null;
  }

  static async getItemsByContractId(contractId, perPage = 20) {
    return this.getItems(1, null, 'all_time', null, null, null, null, null, perPage, null, null, null, null, contractId);
  }

  static async getTotalPaidByOrderId(orderId) {
    return super.handleRequest(async () => {
      const response = await api.get(`/transactions/total`, {
        params: { order_id: orderId },
      });
      return response.data;
    }, "Ошибка при получении оплаченной суммы:");
  }

  static async storeItem(item) {
    const data = await super.storeItem("/transactions", item);
    await CacheInvalidator.onCreate("transactions");
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/transactions", id, item);
    await CacheInvalidator.onUpdate("transactions");
    return data;
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/transactions", id);
    await CacheInvalidator.onDelete("transactions");
    return data;
  }
}
