import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import OrderProductDto from "@/dto/order/OrderProductDto";
import OrderAfController from "./OrderAfController";

export default class OrderController {
  static async getItemsPaginated(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, statusFilter = '', projectFilter = '', clientFilter = '') {
    try {
      const params = { page: page };
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
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
            return new OrderProductDto(
              product.id,
              product.order_id,
              product.product_id,
              product.product_name,
              product.product_image,
              product.unit_id,
              product.unit_name,
              product.unit_short_name,
              product.quantity,
              product.price
            );
          });
        }
        return new OrderDto(
          item.id,
          item.note ?? "",
          item.description ?? "",
          item.status_id,
          item.status_name,
          item.category_id,
          item.category_name,
          item.client_id,
          item.user_id,
          item.user_name,
          item.cash_id ?? null,
          item.cash_name ?? null,
          item.warehouse_id,
          item.warehouse_name,
          item.project_id,
          item.project_name,
          item.price,
          item.discount ?? 0,
          item.total_price,
          item.currency_id,
          item.currency_name,
          item.currency_code,
          item.currency_symbol,
          item.date,
          item.created_at,
          item.updated_at,
          client,
          products
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
      console.error("Ошибка при получении списка заказов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/orders", {
        ...item,
      });
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

      return data;
    } catch (error) {
      console.error("Ошибка при обновлении заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/orders/${id}`);
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
      return data;
    } catch (e) {
      console.error("Ошибка пакетного обновления статуса:", e);
      throw e;
    }
  }

  static async getItem(id) {
    const { data } = await api.get(`/orders/${id}`);
    const item = data.item || data;
    
    // Преобразуем клиента в DTO если он есть
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
    
    // Преобразуем продукты в DTO если они есть
    var products = null;
    if (item.products) {
      products = item.products.map((product) => {
        return new OrderProductDto(
          product.id,
          product.order_id,
          product.product_id,
          product.product_name,
          product.product_image,
          product.unit_id,
          product.unit_name,
          product.unit_short_name,
          product.quantity,
          product.price
        );
      });
    }
    
    return new OrderDto(
      item.id,
      item.note ?? "",
      item.description ?? "",
      item.status_id,
      item.status_name,
      item.product_category_id,
      item.product_category_name,
      item.client_id,
      item.user_id,
      item.user_name,
      item.cash_id ?? null,
      item.cash_name ?? null,
      item.warehouse_id,
      item.warehouse_name,
      item.project_id,
      item.project_name,
      item.price,
      item.discount ?? 0,
      item.total_price,
      item.currency_id,
      item.currency_name,
      item.currency_code,
      item.currency_symbol,
      item.date,
      item.created_at,
      item.updated_at,
      client,
      products,
      item.additional_fields || []
    );
  }

  static async getOrderTransactions(orderId) {
    try {
      const response = await api.get(`/transactions`, {
        params: { order_id: orderId }
      });
      return response.data;
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
      return data;
    } catch (error) {
      console.error("Ошибка при связывании транзакции с заказом:", error);
      throw error;
    }
  }

  static async unlinkTransactionFromOrder(orderId, transactionId) {
    try {
      const { data } = await api.delete(`/orders/${orderId}/transactions/${transactionId}`);
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

  static async getAdditionalFieldsForOrder(orderId) {
    try {
      return await OrderAfController.getFieldsForOrder(orderId);
    } catch (error) {
      console.error("Ошибка при получении дополнительных полей для заказа:", error);
      throw error;
    }
  }

  static prepareOrderData(orderData) {
    const { additional_fields, ...mainData } = orderData;
    
    // Подготавливаем дополнительные поля для отправки
    const preparedAdditionalFields = additional_fields ? 
      additional_fields.map(field => ({
        field_id: field.field_id || field.id,
        value: field.value
      })) : [];

    return {
      ...mainData,
      additional_fields: preparedAdditionalFields
    };
  }

  static async storeItemWithAdditionalFields(item) {
    try {
      const preparedData = this.prepareOrderData(item);
      const { data } = await api.post("/orders", preparedData);
      return data;
    } catch (error) {
      console.error("Ошибка при создании заказа с дополнительными полями:", error);
      throw error;
    }
  }

  static async updateItemWithAdditionalFields(id, item) {
    try {
      const preparedData = this.prepareOrderData(item);
      const { data } = await api.put(`/orders/${id}`, preparedData);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении заказа с дополнительными полями:", error);
      throw error;
    }
  }


}
