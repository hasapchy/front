import api from "./axiosInstance";
import InvoiceDto from "@/dto/invoice/InvoiceDto";
import InvoiceProductDto from "@/dto/invoice/InvoiceProductDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import OrderDto from "@/dto/order/OrderDto";

export default class InvoiceController {
  static async getItemsPaginated(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, typeFilter = null, statusFilter = null) {
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
      if (typeFilter) {
        params.type = typeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await api.get("/invoices", { params });
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
        
        var orders = null;
        if (item.orders) {
          orders = item.orders.map((order) => {
            return new OrderDto(
              order.id,
              order.note ?? "",
              order.description ?? "",
              order.status_id,
              order.status_name,
              // order.category_id,
              // order.category_name,
              order.client_id,
              order.user_id,
              order.user_name,
              order.cash_id ?? null,
              order.cash_name ?? null,
              order.warehouse_id,
              order.warehouse_name,
              order.project_id,
              order.project_name,
              order.price,
              order.discount ?? 0,
              order.total_price,
              order.currency_id,
              order.currency_name,
              order.currency_code,
              order.currency_symbol,
              order.date,
              order.created_at,
              order.updated_at,
              client,
              order.products || null
            );
          });
        }
        
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
                    return new InvoiceProductDto(
          product.id,
          product.invoice_id,
          product.order_id,
          product.product_id,
          product.product_name,
          product.product_description,
          product.quantity,
          product.price,
          product.total_price,
          product.unit_id,
          product.unit
        );
          });
        }
        
        return new InvoiceDto(
          item.id,
          item.client_id,
          item.user_id,
          item.user_name,
          item.invoice_date,
          item.note,
          item.total_amount,
          item.invoice_number,
          item.status || 'new',
          item.created_at,
          item.updated_at,
          client,
          orders,
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
      console.error("Ошибка при получении списка счетов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/invoices", {
        ...item,
      });
      return data;
    } catch (error) {
      console.error("Ошибка при создании счета:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/invoices/${id}`, {
        ...item,
      });
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении счета:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/invoices/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении счета:", error);
      throw error;
    }
  }

  static async getItem(id) {
    const { data } = await api.get(`/invoices/${id}`);
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
    
    // Преобразуем заказы в DTO если они есть
    var orders = null;
    if (item.orders) {
      orders = item.orders.map((order) => {
        return new OrderDto(
          order.id,
          order.note ?? "",
          order.description ?? "",
          order.status_id,
          order.status_name,
          // order.category_id,
          // order.category_name,
          order.client_id,
          order.user_id,
          order.user_name,
          order.cash_id ?? null,
          order.cash_name ?? null,
          order.warehouse_id,
          order.warehouse_name,
          order.project_id,
          order.project_name,
          order.price,
          order.discount ?? 0,
          order.total_price,
          order.currency_id,
          order.currency_name,
          order.currency_code,
          order.currency_symbol,
          order.date,
          order.created_at,
          order.updated_at,
          client,
          order.products || null
        );
      });
    }
    
    // Преобразуем продукты в DTO если они есть
    var products = null;
    if (item.products) {
      products = item.products.map((product) => {
        return new InvoiceProductDto(
          product.id,
          product.invoice_id,
          product.product_id,
          product.product_name,
          product.product_description,
          product.quantity,
          product.price,
          product.total_price,
          product.unit_id,
          product.unit
        );
      });
    }
    
    return new InvoiceDto(
      item.id,
      item.client_id,
      item.user_id,
      item.user_name,
      item.invoice_date,
      item.note,
      item.total_amount,
      item.invoice_number,
      item.status || 'new',
      item.created_at,
      item.updated_at,
      client,
      orders,
      products
    );
  }

  static async getOrdersForInvoice(orderIds) {
    try {
      const { data } = await api.post("/invoices/orders", {
        order_ids: orderIds
      });
      return data;
    } catch (error) {
      console.error("Ошибка при получении данных для счета:", error);
      throw error;
    }
  }
}
