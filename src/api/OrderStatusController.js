import OrderStatusDto from "@/dto/order/OrderStatusDto";
import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

export default class OrderStatusController {
  static async getAllItems() {
    const response = await api.get(`/order_statuses/all`);
    return (response.data || []).map(
      (item) =>
        new OrderStatusDto(
          item.id,
          item.name,
          item.category_id,
          item.category
            ? new OrderStatusCategoryDto(
                item.category.id,
                item.category.name,
                item.category.color,
                item.category.user_id,
                item.category.created_at,
                item.category.updated_at
              )
            : null,
          item.created_at,
          item.updated_at
        )
    );
  }

  static async getItems(page = 1, per_page = 10) {
    const response = await api.get(`/order_statuses?page=${page}&per_page=${per_page}`);
    const data = response.data;
    const items = (data.items || []).map(
      (item) =>
        new OrderStatusDto(
          item.id,
          item.name,
          item.category_id,
          item.category
            ? new OrderStatusCategoryDto(
                item.category.id,
                item.category.name,
                item.category.color,
                item.category.user_id,
                item.category.created_at,
                item.category.updated_at
              )
            : null,
          item.created_at,
          item.updated_at
        )
    );
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    const { data } = await api.post("/order_statuses", item);
    return data;
  }

  static async updateItem(id, item) {
    const { data } = await api.put(`/order_statuses/${id}`, item);
    return data;
  }

  static async deleteItem(id) {
    const { data } = await api.delete(`/order_statuses/${id}`);
    return data;
  }
}
