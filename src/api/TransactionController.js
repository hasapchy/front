import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import TransactionDto from "@/dto/transaction/TransactionDto";
import queryCache from "@/utils/queryCache";
import CacheInvalidator from "@/utils/cacheInvalidator";

export default class TransactionController {
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
    try {
      const cacheKey = 'transactions_list';
      const cacheParams = { page, cash_id, date_filter_type, order_id, search, transaction_type, source, project_id, per_page, start_date, end_date, is_debt };
      const cached = queryCache.get(cacheKey, cacheParams);
      
      if (cached) {
        console.log('📦 Загружено из кэша: transactions', cacheParams);
        return cached;
      }

      const response = await api.get("/transactions", {
        params: {
          page: page,
          cash_id: cash_id,
          date_filter_type: date_filter_type,
          order_id: order_id,
          search: search,
          transaction_type: transaction_type,
          source: source,
          project_id: project_id,
          per_page: per_page,
          start_date: start_date,
          end_date: end_date,
          is_debt: is_debt,
        },
      });
      const data = response.data;
      const items = TransactionDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      queryCache.set(cacheKey, cacheParams, paginatedResponse);
      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении транзакций:", error);
      throw error;
    }
  }
  static async getItem(id) {
    try {
      const { data } = await api.get(`/transactions/${id}`);
      const item = data.item;
      
      return TransactionDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении транзакции:", error);
      throw error;
    }
  }

  static async getTotalPaidByOrderId(orderId) {
    try {
      const response = await api.get(`/transactions/total`, {
        params: { order_id: orderId },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении оплаченной суммы:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/transactions", item);
      queryCache.invalidate('transactions_list');
      CacheInvalidator.onCreate('transactions');
      return data;
    } catch (error) {
      console.error("Ошибка при создании транзакции:", error);
      throw error;
    }
  }

  static async createTransactionForOrder(orderId, transactionData) {
    const item = {
      ...transactionData,
      order_id: orderId
    };
    const result = await this.storeItem(item);
    queryCache.invalidate('orders_list');
    return result;
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/transactions/${id}`, item);
      queryCache.invalidate('transactions_list');
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении транзакции:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/transactions/${id}`);
      queryCache.invalidate('transactions_list');
      return data;
    } catch (error) {
      console.error("Ошибка при удалении транзакции:", error);
      throw error;
    }
  }

  static async getTotalByOrderId(orderId) {
    return this.getTotalPaidByOrderId(orderId);
  }
}
