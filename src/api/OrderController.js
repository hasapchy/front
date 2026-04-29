import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

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
    categoryFilter = "",
    perPage = 20,
    unpaidOnly = false,
    signal = null
  ) {
    const params = {};
    if (search) {
      params.search = search;
    }
    if (dateFilter && dateFilter !== "all_time") {
      params.date_filter_type = dateFilter;
      if (dateFilter === "custom") {
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }
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
    if (categoryFilter) {
      params.category_id = categoryFilter;
    }
    if (unpaidOnly) {
      params.unpaid_only = true;
    }

    return super.handleRequest(async () => {
      const config = { params: { page, per_page: perPage, ...params } };
      if (signal) config.signal = signal;
      const responseData = await super.getData("/orders", config);
      const items = OrderDto.fromApiArray(responseData.items);
      const meta = responseData.meta;

        return new PaginatedResponse(
          items,
          meta.current_page,
          meta.next_page,
          meta.last_page,
          meta.total,
          meta.unpaid_orders_total
        );
    }, apiErrorMessage("ordersList"));
  }

  static async getItem(id) {
    return super.handleRequest(async () => {
      const orderData = await super.getData(`/orders/${id}`);
      return OrderDto.fromApi(orderData);
    }, apiErrorMessage("orderGet", { path: `/orders/${id}` }));
  }

  static async storeItem(item) {
    return super.handleRequest(async () => {
      const responseData = await super.post("/orders", item);
      const orderData = responseData.data;
      await CacheInvalidator.onCreate("orders");
      return {
        item: OrderDto.fromApi(orderData),
        message: responseData.message,
      };
    }, apiErrorMessage("orderCreate"));
  }

  static async updateItem(id, item) {
    return super.handleRequest(async () => {
      const responseData = await super.put(`/orders/${id}`, item);
      const orderData = responseData.data;
      await CacheInvalidator.onUpdate("orders");
      return {
        order: OrderDto.fromApi(orderData),
        message: responseData.message,
      };
    }, apiErrorMessage("orderUpdate", { path: `/orders/${id}` }));
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/orders", id);
    await CacheInvalidator.onDelete("orders");
    return data;
  }

  static async batchUpdateStatus(payload) {
    const ids = Array.isArray(payload.ids) ? payload.ids : [];
    const statusId = payload.statusId;
    return super.handleRequest(
      async () =>
        super.mapUnifiedBatchChunks(ids, (chunk) =>
          super.postUnifiedBatch({
            entity: "orders",
            action: "update_status",
            ids: chunk,
            payload: { statusId },
            sync: true,
          }),
        ),
      apiErrorMessage("ordersBatchStatus"),
    );
  }

  static async getFirstStageCount() {
    return super.handleRequest(
      async () => {
        const data = await super.getData("/orders/first-stage-count");
        return data.count;
      },
      apiErrorMessage("ordersStageCount")
    );
  }

  static async export(filters = {}, ids = null) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.dateFilter && filters.dateFilter !== "all_time") {
      params.date_filter_type = filters.dateFilter;
      if (filters.dateFilter === "custom") {
        if (filters.startDate) {
          params.start_date = filters.startDate;
        }
        if (filters.endDate) {
          params.end_date = filters.endDate;
        }
      }
    }
    if (filters.statusFilter) params.status_id = filters.statusFilter;
    if (filters.projectFilter) params.project_id = filters.projectFilter;
    if (filters.clientFilter) params.client_id = filters.clientFilter;
    if (filters.categoryFilter) params.category_id = filters.categoryFilter;
    if (filters.unpaidOnly) params.unpaid_only = true;
    if (Array.isArray(filters.columns) && filters.columns.length) params.columns = filters.columns;
    return super.downloadExport("/orders", params, ids, "orders.xlsx");
  }
}
