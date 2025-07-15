import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";
import api from "./axiosInstance";

export default class OrderStatusCategoryController {
  static async getItems(page = 1) {
    try {
      const response = await api.get(`/order_status_categories?page=${page}`);
      const data = response.data;
      const items = data.items.map(
        (item) =>
          new OrderStatusCategoryDto(
            item.id,
            item.name,
            item.color,
            item.user_id,
            item.created_at,
            item.updated_at
          )
      );
      // Примени свой PaginatedResponse если используешь пагинацию
      return {
        items,
        currentPage: data.current_page,
        nextPage: data.next_page,
        lastPage: data.last_page,
        total: data.total,
      };
    } catch (error) {
      console.error("Ошибка при получении категорий статусов:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/order_status_categories/all`);
      const data = response.data;
      return data.map(
        (item) =>
          new OrderStatusCategoryDto(
            item.id,
            item.name,
            item.color,
            item.user_id,
            item.created_at,
            item.updated_at
          )
      );
    } catch (error) {
      console.error("Ошибка при получении всех категорий статусов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/order_status_categories", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании категории статусов:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/order_status_categories/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении категории статусов:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/order_status_categories/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении категории статусов:", error);
      throw error;
    }
  }
}
