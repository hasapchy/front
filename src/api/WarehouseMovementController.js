import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseMovementProductDto from "@/dto/warehouse/WarehouseMovementProductDto";
import WarehouseMovementDto from "@/dto/warehouse/WarehouseMovementDto";

export default class WarehouseMovementController {
  static async getItems(page = 1, per_page = 10) {
    try {
      const response = await api.get(`/warehouse_movements?page=${page}&per_page=${per_page}`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
            return new WarehouseMovementProductDto(
              product.id,
              product.receipt_id,
              product.product_id,
              product.product_name,
              product.product_image,
              product.unit_id,
              product.unit_name,
              product.unit_short_name,
              product.quantity,
              product.sn_id
            );
          });
        }
        return new WarehouseMovementDto(
          item.id,
          item.warehouse_from_id,
          item.warehouse_from_name,
          item.warehouse_to_id,
          item.warehouse_to_name,
          products,
          item.note,
          item.user_id,
          item.user_name,
          item.date,
          item.created_at,
          item.updated_at
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
      console.error("Ошибка при получении оприходований:", error);
      throw error;
    }
  }

  static async storeItem(formData) {
    try {
      const { data } = await api.post("/warehouse_movements", formData);
      return data;
    } catch (error) {
      console.error("Ошибка при перемещении:", error);
      throw error;
    }
  }
  static async updateItem(id, formData) {
    try {
      const { data } = await api.put(`/warehouse_movements/${id}`, formData);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении перемещения:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/warehouse_movements/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении перемещения:", error);
      throw error;
    }
  }
}
