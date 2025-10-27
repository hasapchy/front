import api from "./axiosInstance";
import SaleDto from "@/dto/sale/SaleDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import SaleProductDto from "@/dto/sale/SaleProductDto";

export default class SaleController {
  static async getItemsPaginated(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, per_page = 10) {
    try {
      const params = { page: page, per_page: per_page };
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
      const items = (data.items || []).map((item) => {
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
            item.client.emails || [],
            item.client.phones || []
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
            [],
            [],
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
              product.product ? product.product.name : null,
              product.product ? product.product.image : null,
              product.product && product.product.unit ? product.product.unit.id : null,
              product.product && product.product.unit ? product.product.unit.name : null,
              product.product && product.product.unit ? product.product.unit.short_name : null,
              product.quantity,
              product.price
            );
          });
        }
        // Вычисляем итоговую сумму: price - discount
        const totalPrice = (parseFloat(item.price || 0) - parseFloat(item.discount || 0));
        
        return new SaleDto(
          item.id,
          item.price,
          item.discount,
          totalPrice,
          item.cash_register && item.cash_register.currency ? item.cash_register.currency.id : item.currency_id,
          item.cash_register && item.cash_register.currency ? item.cash_register.currency.name : item.currency_name,
          item.cash_register && item.cash_register.currency ? item.cash_register.currency.code : item.currency_code,
          item.cash_register && item.cash_register.currency ? item.cash_register.currency.symbol : item.currency_symbol,
          item.cash_id,
          item.cash_register ? item.cash_register.name : null,
          item.warehouse_id,
          item.warehouse ? item.warehouse.name : null,
          item.user_id,
          item.user ? item.user.name : null,
          item.project_id,
          item.project ? item.project.name : null,
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
    console.log('[SaleController] getItem called with id:', id);
    const { data } = await api.get(`/sales/${id}`);
    console.log('[SaleController] Raw data from backend:', data);
    
    // Данные приходят в формате {item: {...}}
    const item = data.item || data;
    console.log('[SaleController] Parsed item:', item);
    
    // Преобразуем данные в SaleDto
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
        item.client.emails || [],
        item.client.phones || []
      );
    }
    
    var products = null;
    if (item.products) {
      products = item.products.map((product) => {
        return new SaleProductDto(
          product.id,
          product.sale_id,
          product.product_id,
          product.product ? product.product.name : null,
          product.product ? product.product.image : null,
          product.product && product.product.unit ? product.product.unit.id : null,
          product.product && product.product.unit ? product.product.unit.name : null,
          product.product && product.product.unit ? product.product.unit.short_name : null,
          product.quantity,
          product.price
        );
      });
    }
    
    // Вычисляем итоговую сумму: price - discount
    const totalPrice = (parseFloat(item.price || 0) - parseFloat(item.discount || 0));
    
    const saleDto = new SaleDto(
      item.id,
      item.price,
      item.discount,
      totalPrice,
      item.cash_register && item.cash_register.currency ? item.cash_register.currency.id : item.currency_id,
      item.cash_register && item.cash_register.currency ? item.cash_register.currency.name : item.currency_name,
      item.cash_register && item.cash_register.currency ? item.cash_register.currency.code : item.currency_code,
      item.cash_register && item.cash_register.currency ? item.cash_register.currency.symbol : item.currency_symbol,
      item.cash_id,
      item.cash_register ? item.cash_register.name : null,
      item.warehouse_id,
      item.warehouse ? item.warehouse.name : null,
      item.user_id,
      item.user ? item.user.name : null,
      item.project_id,
      item.project ? item.project.name : null,
      item.transaction_id,
      client,
      products,
      item.note,
      item.date,
      item.created_at,
      item.updated_at,
      null,
      item.discount_type || "fixed"
    );
    
    console.log('[SaleController] Created SaleDto:', saleDto);
    console.log('[SaleController] SaleDto constructor name:', saleDto.constructor.name);
    
    return saleDto;
  }
}
