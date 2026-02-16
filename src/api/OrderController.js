import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class OrderController extends BaseController {
  static async getItems(
    page = 1,
    search = null,
    dateFilter = "all_time",
    startDate = null,
    endDate = null,
    statusFilter = "",
    projectFilter = "",
    clientFilter = "",
    per_page = 20,
    unpaidOnly = false,
    signal = null
  ) {
    const params = {};
    if (search) {
      params.search = search;
    }
    if (dateFilter && dateFilter !== "all_time") {
      params.date_filter_type = dateFilter;
      if (dateFilter === "custom" && startDate && endDate) {
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

    return super.handleRequest(async () => {
      const config = { params: { page, per_page, ...params } };
      if (signal) config.signal = signal;
      const response = await api.get("/orders", config);
      const responseData = response.data;
      const items = OrderDto.fromApiArray(responseData.data || []);
      const meta = responseData.meta || {};

        return new PaginatedResponse(
          items,
          meta.current_page || page,
          meta.next_page || null,
          meta.last_page || 1,
          meta.total || 0,
          meta.unpaid_orders_total || 0
        );
    }, "Ошибка при получении списка заказов:");
  }

  static async storeItem(item) {
    return super.handleRequest(async () => {
      const response = await api.post("/orders", item);
      const responseData = response.data;
      const orderData = responseData.data || responseData;
      await CacheInvalidator.onCreate("orders");
      return {
        item: OrderDto.fromApiArray([orderData])[0] || orderData,
        message: responseData.message || "Заказ успешно создан",
      };
    }, "Ошибка при создании заказа:");
  }

  static async updateItem(id, item) {
    return super.handleRequest(async () => {
      const response = await api.put(`/orders/${id}`, item);
      const responseData = response.data;
      const orderData = responseData.data || responseData;
      await CacheInvalidator.onUpdate("orders");
      return {
        order: OrderDto.fromApiArray([orderData])[0] || orderData,
        message: responseData.message || "Заказ сохранён",
      };
    }, `Ошибка при обновлении заказа: /orders/${id}`);
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/orders", id);
    await CacheInvalidator.onDelete("orders");
    return data;
  }

  static async batchUpdateStatus({ ids, status_id }) {
    return super.handleRequest(async () => {
      const { data } = await api.post("/orders/batch-status", {
        ids,
        status_id,
      });
      return data;
    }, "Ошибка пакетного обновления статуса:");
  }

  static async getItem(id) {
    return super.handleRequest(async () => {
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data.data || response.data;
      return OrderDto.fromApiArray([orderData])[0] || null;
    }, `Ошибка при получении заказа: /orders/${id}`);
  }

  static async getFirstStageCount() {
    return super.handleRequest(
      async () => {
        const { data } = await api.get("/orders/first-stage-count");
        return (data?.data?.count ?? 0);
      },
      "Ошибка при получении количества заказов на первой стадии:"
    );
  }
}
