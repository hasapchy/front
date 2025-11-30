import api from "./axiosInstance";
import InvoiceDto from "@/dto/invoice/InvoiceDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

export default class InvoiceController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, typeFilter = null, statusFilter = null, per_page = 20) {
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
      if (typeFilter) {
        params.type = typeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await api.get("/invoices", { params });
      const data = response.data;
      const items = InvoiceDto.fromApiArray(data.items);
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
    const item = data.item;
    
    return InvoiceDto.fromApiArray([item])[0] || null;
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
