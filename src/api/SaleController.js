import api from "./axiosInstance";
import SaleDto from "@/dto/sale/SaleDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

export default class SaleController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, per_page = 20) {
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

      const response = await api.get("/sales", { params });
      const data = response.data;
      const items = SaleDto.fromApiArray(data.items);
      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении списка продаж:", error);
      throw error;
    }
  }
  static async storeItem(item) {
    try {
      const { data } = await api.post("/sales", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании продажи:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/sales/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении продажи:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/sales/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении продажи:", error);
      throw error;
    }
  }

  static async getItem(id) {
    const { data } = await api.get(`/sales/${id}`);
    const item = data.item;
    
    return SaleDto.fromApiArray([item])[0] || null;
  }
}
