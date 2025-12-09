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
    unpaidOnly = false
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

    const data = await super.getItems("/orders", page, per_page, params);
    const items = OrderDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total,
      data.unpaid_orders_total || 0
    );
  }

  static async storeItem(item) {
    const data = await super.storeItem("/orders", item);
    await CacheInvalidator.onCreate("orders");
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/orders", id, item);
    await CacheInvalidator.onUpdate("orders");
    return data;
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
    const data = await super.getItem("/orders", id);
    return OrderDto.fromApiArray([data.item])[0] || null;
  }
}
