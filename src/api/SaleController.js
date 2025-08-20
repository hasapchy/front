import api from "./axiosInstance";
import SaleDto from "@/dto/sale/SaleDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import SaleProductDto from "@/dto/sale/SaleProductDto";

export default class SaleController {
  static async getItemsPaginated(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null) {
    try {
      const params = { page: page };
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

      const response = await api.get("/sales", { params });
      const data = response.data;
      // Преобразуем полученные данные в DTO
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
        } else if (item.client_first_name || item.client_last_name) {
          // Fallback для случая, когда клиент загружен через JOIN
          client = new ClientDto(
            item.client_id,
            null,
            null,
            null,
            null,
            item.client_first_name,
            item.client_last_name,
            item.client_contact_person,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
          );
        }
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
            return new SaleProductDto(
              product.id,
              product.sale_id,
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
        return new SaleDto(
          item.id,
          item.price,
          item.discount,
          item.total_price,
          item.currency_id,
          item.currency_name,
          item.currency_code,
          item.currency_symbol,
          item.cash_id,
          item.cash_name,
          item.warehouse_id,
          item.warehouse_name,
          item.user_id,
          item.user_name,
          item.project_id,
          item.project_name,
          item.transaction_id,
          client,
          products,
          item.note,
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
      console.error("Ошибка при получении списка продаж:", error);
      throw error;
    }
  }
  static async storeItem(item) {
    try {
      const { data } = await api.post("/sales", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании продажи:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/sales/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении продажи:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/sales/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении продажи:", error);
      throw error;
    }
  }

  static async getItem(id) {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  }
}
