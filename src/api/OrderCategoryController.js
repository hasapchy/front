import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import OrderCategoryDto from "@/dto/order/OrderCategoryDto";
import api from "./axiosInstance";

export default class OrderCategoryController {
  static async getItems(page = 1) {
    const response = await api.get(`/order_categories?page=${page}`);
    const data = response.data;
    const items = data.items.map(
      (item) =>
        new OrderCategoryDto(
          item.id,
          item.name,
          item.user_id,
          item.user_name,
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

  static async getAllItems() {
    const response = await api.get(`/order_categories/all`);
    return response.data.map(
      (item) =>
        new OrderCategoryDto(
          item.id,
          item.name,
          item.user_id,
          item.user_name,
          item.created_at,
          item.updated_at
        )
    );
  }

  static async storeItem(item) {
    const { data } = await api.post("/order_categories", item);
    return data;
  }

  static async updateItem(id, item) {
    const { data } = await api.put(`/order_categories/${id}`, item);
    return data;
  }

  static async deleteItem(id) {
    const { data } = await api.delete(`/order_categories/${id}`);
    return data;
  }
}
