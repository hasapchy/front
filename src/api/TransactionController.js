import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";

export default class TransactionController {
  static async getItems(
    page = 1,
    cash_id = null,
    date_filter_type = "all_time",
    order_id = null,
    search = null,
    transaction_type = null,
    source = null,
    project_id = null
  ) {
    try {
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
        },
      });
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        var client = null;
        if (item.client) {
          client = new ClientDto(
            item.client.id,
            item.client.client_type,
            item.client.balance,
            item.client.is_supplier,
            item.client.is_conflict,
            item.client.first_name,
            item.client.last_name,
            item.client.contact_person,
            item.client.address,
            item.client.note,
            item.client.status,
            item.client.discount_type,
            item.client.discount,
            item.client.created_at,
            item.client.updated_at,
            item.client.emails,
            item.client.phones
          );
        }
        return new TransactionDto(
          item.id,
          item.type,
          item.is_transfer,
          item.is_sale,
          item.is_receipt,
          item.cash_id,
          item.cash_name,
          item.cash_amount,
          item.cash_currency_id,
          item.cash_currency_name,
          item.cash_currency_code,
          item.cash_currency_symbol,
          item.orig_amount,
          item.orig_currency_id,
          item.orig_currency_name,
          item.orig_currency_code,
          item.orig_currency_symbol,
          item.user_id,
          item.user_name,
          item.category_id,
          item.category_name,
          item.category_type,
          item.project_id,
          item.project_name,
          item.client_id,
          client,
          item.note,
          item.date,
          item.created_at,
          item.updated_at,
          item.orders || []
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
      console.error("Ошибка при получении транзакций:", error);
      throw error;
    }
  }
  static async getItem(id) {
    const { data } = await api.get(`/transactions/${id}`);
    return data;
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
      return data;
    } catch (error) {
      console.error("Ошибка при создании транзакции:", error);
      throw error;
    }
  }

  static async createTransactionForOrder(orderId, transactionData) {
    try {
      const { data } = await api.post("/transactions", {
        ...transactionData,
        order_id: orderId
      });
      return data;
    } catch (error) {
      console.error("Ошибка при создании транзакции для заказа:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/transactions/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении транзакции:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/transactions/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении транзакции:", error);
      throw error;
    }
  }

  // Получить общую сумму оплат по заказу
  static async getTotalByOrderId(orderId) {
    try {
      const { data } = await api.get(`/transactions/total?order_id=${orderId}`);
      return data;
    } catch (error) {
      console.error('Ошибка при получении суммы оплат по заказу:', error);
      throw error;
    }
  }

}
