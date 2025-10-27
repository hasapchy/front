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
        // Маппинг клиента (поставщика) - используем supplier из eager loading
        var client = null;
        if (item.supplier) {
          // Баланс теперь хранится в колонке clients.balance
          const balance = item.supplier.balance || 0;
          
          client = new ClientDto(
            item.supplier.id,
            item.supplier.client_type || null,
            balance,
            item.supplier.is_supplier || false,
            item.supplier.is_conflict || false,
            item.supplier.first_name,
            item.supplier.last_name,
            item.supplier.contact_person,
            item.supplier.address || '',
            item.supplier.note || '',
            item.supplier.status,
            item.supplier.discount_type || 'percent',
            item.supplier.discount || 0,
            item.supplier.created_at,
            item.supplier.updated_at,
            item.supplier.emails || [],
            item.supplier.phones || []
          );
        }
        
        // Маппинг товаров
        var products = null;
        if (item.products) {
          products = item.products.map((product) => {
            return new WarehouseReceiptProductDto(
              product.id,
              product.receipt_id,
              product.product_id,
              product.product?.name || 'Товар удален', // Название товара из relation
              product.product?.image || null,
              product.product?.unit_id || null,
              product.product?.unit?.name || '',
              product.product?.unit?.short_name || '',
              product.quantity,
              product.price,
              product.sn_id
            );
          });
        }
        
        // Получаем символ валюты из кассы
        const currencySymbol = item.cash_register?.currency?.symbol || 'm';
        
        const dto = new WarehouseReceiptDto(
          item.id,
          item.warehouse_id,
          item.warehouse?.name || '',
          item.amount,
          client,
          products,
          item.note,
          item.user_id,
          item.user?.name || '',
          item.date,
          item.created_at,
          item.updated_at,
          item.cash_id,
          item.cash_register?.name || '',
          item.project_id,
          currencySymbol
        );
        
        return dto;
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
    const { data } = await api.post("/warehouse_receipts", formData);
    return data;
  }

  static async updateReceipt(id, formData) {
    const { data } = await api.put(`/warehouse_receipts/${id}`, formData);
    return data;
  }

  static async deleteReceipt(id) {
    const { data } = await api.delete(`/warehouse_receipts/${id}`);
    return data;
  }

  static async getItem(id) {
    const { data } = await api.get(`/warehouse_receipts/${id}`);
    
    // Данные приходят в формате {item: {...}}
    const item = data.item || data;
    
    // Преобразуем данные в WarehouseReceiptDto
    var client = null;
    if (item.supplier) {
      const balance = item.supplier.balance || 0;
      
      client = new ClientDto(
        item.supplier.id,
        item.supplier.client_type || null,
        balance,
        item.supplier.is_supplier || false,
        item.supplier.is_conflict || false,
        item.supplier.first_name,
        item.supplier.last_name,
        item.supplier.contact_person,
        item.supplier.address || '',
        item.supplier.note || '',
        item.supplier.status,
        item.supplier.discount_type || 'percent',
        item.supplier.discount || 0,
        item.supplier.created_at,
        item.supplier.updated_at,
        item.supplier.emails || [],
        item.supplier.phones || []
      );
    }
    
    var products = null;
    if (item.products) {
      products = item.products.map((product) => {
        return new WarehouseReceiptProductDto(
          product.id,
          product.receipt_id,
          product.product_id,
          product.product?.name || 'Товар удален',
          product.product?.image || null,
          product.product?.unit_id || null,
          product.product?.unit?.name || '',
          product.product?.unit?.short_name || '',
          product.quantity,
          product.price,
          product.sn_id
        );
      });
    }
    
    const currencySymbol = item.cash_register?.currency?.symbol || 'm';
    
    return new WarehouseReceiptDto(
      item.id,
      item.warehouse_id,
      item.warehouse?.name || '',
      item.amount,
      client,
      products,
      item.note,
      item.user_id,
      item.user?.name || '',
      item.date,
      item.created_at,
      item.updated_at,
      item.cash_id,
      item.cash_register?.name || '',
      item.project_id,
      currencySymbol
    );
  }
}

