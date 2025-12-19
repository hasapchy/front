import basementApi from "./basementAxiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

export default class BasementOrderController {
  static async getItems(
    page = 1,
    per_page = 20,
    search = null,
    dateFilter = 'all_time',
    startDate = null,
    endDate = null,
    statusFilter = '',
    projectFilter = '',
    clientFilter = ''
  ) {
    const params = { page, per_page };
    
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

    const response = await basementApi.get("/orders", { params });
    const responseData = response.data;

    const items = responseData.data || [];
    const meta = responseData.meta || {};

    return new PaginatedResponse(
      items,
      meta.current_page || page,
      meta.next_page || null,
      meta.last_page || 1,
      meta.total || 0
    );
  }

  static async getItem(id) {
    try {
      const response = await basementApi.get(`/orders/${id}`);
      const orderData = response.data.data || response.data;
      return orderData;
    } catch (error) {
      console.error("Ошибка при получении заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const response = await basementApi.delete(`/orders/${id}`);
      return {
        message: response.data.message || 'Заказ успешно удалён',
        data: response.data
      };
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
      throw error;
    }
  }
}

