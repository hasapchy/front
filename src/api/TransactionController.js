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
    is_debt = null
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
    };

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
