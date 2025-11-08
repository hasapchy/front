import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import OrderAfController from "./OrderAfController";
import queryCache from "@/utils/queryCache";

export default class OrderController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, statusFilter = '', projectFilter = '', clientFilter = '', per_page = 20) {
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
      const response = await api.get("/orders", { params });
      const data = response.data;
      const items = OrderDto.fromApiArray(data.items);
      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
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

  // static async getAdditionalFieldsForCategory(categoryId) {
  //   try {
  //     return await OrderAfController.getFieldsByCategory(categoryId);
  //   } catch (error) {
  //     console.error("Ошибка при получении дополнительных полей для категории:", error);
  //     throw error;
  //   }
  // }

  // static async getAdditionalFields(categoryId) {
  //   try {
  //     const response = await api.get(`/orders/category/${categoryId}/additional-fields`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Ошибка при получении дополнительных полей для категории:", error);
  //     throw error;
  //   }
  // }

  // static async getAdditionalFieldsForCategories(categoryIds) {
  //   try {
  //     return await OrderAfController.getFieldsByCategories(categoryIds);
  //   } catch (error) {
  //     console.error("Ошибка при получении дополнительных полей для категорий:", error);
  //     throw error;
  //   }
  // }

  // static async getAdditionalFieldsForOrder(orderId) {
  //   try {
  //     return await OrderAfController.getFieldsForOrder(orderId);
  //   } catch (error) {
  //     console.error("Ошибка при получении дополнительных полей для заказа:", error);
  //     throw error;
  //   }
  // }

  // static prepareOrderData(orderData) {
  //   const { additional_fields, ...mainData } = orderData;
    
  //   // Подготавливаем дополнительные поля для отправки
  //   const preparedAdditionalFields = additional_fields ? 
  //     additional_fields.map(field => ({
  //       field_id: field.field_id || field.id,
  //       value: field.value
  //     })) : [];

  //   return {
  //     ...mainData,
  //     additional_fields: preparedAdditionalFields
  //   };
  // }

  // static async storeItemWithAdditionalFields(item) {
  //   try {
  //     const preparedData = this.prepareOrderData(item);
  //     const { data } = await api.post("/orders", preparedData);
  //     return data;
  //   } catch (error) {
  //     console.error("Ошибка при создании заказа с дополнительными полями:", error);
  //     throw error;
  //   }
  // }

  // static async updateItemWithAdditionalFields(id, item) {
  //   try {
  //     const preparedData = this.prepareOrderData(item);
  //     const { data } = await api.put(`/orders/${id}`, preparedData);
  //     return data;
  //   } catch (error) {
  //     console.error("Ошибка при обновлении заказа с дополнительными полями:", error);
  //     throw error;
  //   }
  // }
}
