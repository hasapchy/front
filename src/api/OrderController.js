import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { queryCache } from "@/utils/cacheHelper";

export default class OrderController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, statusFilter = '', projectFilter = '', clientFilter = '', per_page = 20, unpaidOnly = false) {
    try {
      const params = { page: page, per_page: per_page };
      if (search) {
        params.search = search;
      }
      if (dateFilter && dateFilter !== 'all_time') {
        params.date_filter_type = dateFilter;
        if (dateFilter === 'custom' && startDate && endDate) {
          params.start_date = startDate;
          params.end_date = endDate;
        }
      }
      if (statusFilter) {
        params.status_id = statusFilter;
      }
      if (projectFilter) {
        params.project_id = projectFilter;
      }
      if (clientFilter) {
        params.client_id = clientFilter;
      }
      if (unpaidOnly) {
        params.unpaid_only = true;
      }
      const response = await api.get("/orders", { params });
      const data = response.data;
      const items = OrderDto.fromApiArray(data.items);
      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total,
        data.unpaid_orders_total || 0
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении списка заказов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/orders", {
        ...item,
      });
      queryCache.invalidate('orders_list');
      return data;
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {

      const { data } = await api.put(`/orders/${id}`, {
        ...item,
      });

      queryCache.invalidate('orders_list');
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/orders/${id}`);
      queryCache.invalidate('orders_list');
      return data;
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
      throw error;
    }
  }
  static async batchUpdateStatus({ ids, status_id }) {
    try {
      const { data } = await api.post("/orders/batch-status", {
        ids,
        status_id,
      });
      queryCache.invalidate('orders_list');
      return data;
    } catch (e) {
      console.error("Ошибка пакетного обновления статуса:", e);
      throw e;
    }
  }

  static async getItem(id) {
    const { data } = await api.get(`/orders/${id}`);
    const item = data.item;
    
    return OrderDto.fromApiArray([item])[0] || null;
  }

  static async getOrderTransactions(orderId) {
    try {
      const response = await api.get(`/transactions`, {
        params: { order_id: orderId }
      });
      return response.data.transactions;
    } catch (error) {
      console.error("Ошибка при получении транзакций заказа:", error);
      throw error;
    }
  }

  static async linkTransactionToOrder(orderId, transactionId) {
    try {
      const { data } = await api.post(`/orders/${orderId}/transactions`, {
        transaction_id: transactionId
      });
      queryCache.invalidate('orders_list');
      queryCache.invalidate('transactions_list');
      return data;
    } catch (error) {
      console.error("Ошибка при связывании транзакции с заказом:", error);
      throw error;
    }
  }

  static async unlinkTransactionFromOrder(orderId, transactionId) {
    try {
      const { data } = await api.delete(`/orders/${orderId}/transactions/${transactionId}`);
      queryCache.invalidate('orders_list');
      queryCache.invalidate('transactions_list');
      return data;
    } catch (error) {
      console.error("Ошибка при отвязывании транзакции от заказа:", error);
      throw error;
    }
  }
}
