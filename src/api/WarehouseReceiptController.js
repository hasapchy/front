import ClientDto from "@/dto/client/ClientDto";
import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseReceiptProductDto from "@/dto/warehouse/WarehouseReceiptProductDto";
import WarehouseReceiptDto from "@/dto/warehouse/WarehouseReceiptDto";

export default class WarehouseReceiptController {
  static async getStocks(page = 1, per_page = 10) {
    try {
      const response = await api.get(`/warehouse_receipts?page=${page}&per_page=${per_page}`);
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
            return new WarehouseReceiptProductDto(
              product.id,
              product.receipt_id,
              product.product_id,
              product.product_name,
              product.product_image,
              product.unit_id,
              product.unit_name,
              product.unit_short_name,
              product.quantity,
              product.price,
              product.sn_id
            );
          });
        }
        return new WarehouseReceiptDto(
          item.id,
          item.warehouse_id,
          item.warehouse_name,
          item.amount,
          client,
          products,
          item.note,
          item.user_id,
          item.user_name,
          item.date,
          item.created_at,
          item.updated_at,
          item.cash_id,
          item.cash_name
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

  static async storeReceipt(formData) {
    try {
      const { data } = await api.post("/warehouse_receipts", formData);
      return data;
    } catch (error) {
      console.error("Ошибка при оприходовании:", error);
      throw error;
    }
  }
  static async updateReceipt(id, formData) {
    try {
      const { data } = await api.put(`/warehouse_receipts/${id}`, formData);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении оприходования:", error);
      throw error;
    }
  }

  static async deleteReceipt(id) {
    try {
      const { data } = await api.delete(`/warehouse_receipts/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении оприходования:", error);
      throw error;
    }
  }
}
