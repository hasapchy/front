import api from "./axiosInstance";
import OrderDto from "@/dto/order/OrderDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import OrderProductDto from "@/dto/order/OrderProductDto";

export default class OrderController {
  static async getItemsPaginated(page = 1) {
    try {
      const response = await api.get(`/orders?page=${page}`);
      const data = response.data;
      const items = data.items.map((item) => {
        var client = null;
        if (item.client) {
          client = new ClientDto(
            item.client.id,
            item.client.client_type,
            item.client.balance,
            item.client.is_supplier,
            item.client.is_conflict,
            item.client.first_name,
            item.client.last_name,
            item.client.contact_person,
            item.client.address,
            item.client.note,
            item.client.status,
            item.client.discount_type,
            item.client.discount,
            item.client.created_at,
            item.client.updated_at,
            item.client.emails,
            item.client.phones
          );
        }
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
            return new OrderProductDto(
              product.id,
              product.order_id,
              product.product_id,
              product.product_name,
              product.product_image,
              product.unit_id,
              product.unit_name,
              product.unit_short_name,
              product.quantity,
              product.price
            );
          });
        }
        return new OrderDto(
          item.id,
          item.price,
          item.discount ?? 0,
          item.total_price,
          item.currency_id,
          item.currency_name,
          item.currency_code,
          item.currency_symbol,
          item.cash_id ?? null,
          item.cash_name ?? null,
          item.warehouse_id,
          item.warehouse_name,
          item.user_id,
          item.user_name,
          item.project_id,
          item.project_name,
          item.status_id,
          item.status_name,
          item.category_id,
          item.category_name,
          client,
          products,
          item.note ?? "",
          item.description ?? "",
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
      console.error("Ошибка при получении списка заказов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/orders", {
        ...item,
      });
      return data;
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      console.log("👉 Отправка обновления заказа:");
      console.log("ID заказа:", id);
      console.log("Payload:", JSON.stringify(item, null, 2));

      const { data } = await api.put(`/orders/${id}`, {
        ...item,
      });

      return data;
    } catch (error) {
      console.error("Ошибка при обновлении заказа:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/orders/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
      throw error;
    }
  }
  static async batchUpdateStatus({ ids, status_id }) {
    try {
      const { data } = await api.post("/orders/batch-status", {
        ids,
        status_id,
      });
      return data;
    } catch (e) {
      console.error("Ошибка пакетного обновления статуса:", e);
      throw e;
    }
  }
}
