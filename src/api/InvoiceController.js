import api from "./axiosInstance";
import InvoiceDto from "@/dto/invoice/InvoiceDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class InvoiceController extends BaseController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, typeFilter = null, statusFilter = null, per_page = 20) {
    const params = {};
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
    if (typeFilter) {
      params.type = typeFilter;
    }
    if (statusFilter) {
      params.status = statusFilter;
    }

    const responseData = await super.getItems("/invoices", page, per_page, params);
    
    // Поддержка новой структуры с meta и старой структуры
    const items = InvoiceDto.fromApiArray(responseData.data || responseData.items || []);
    const meta = responseData.meta;
    
    if (meta) {
      return new PaginatedResponse(
        items,
        meta.current_page || page,
        meta.next_page || null,
        meta.last_page || 1,
        meta.total || 0
      );
    } else {
      // Старая структура
      return new PaginatedResponse(
        items,
        responseData.current_page || page,
        responseData.next_page || null,
        responseData.last_page || 1,
        responseData.total || 0
      );
    }
  }

  static async storeItem(item) {
    const data = await super.storeItem("/invoices", item);
    await CacheInvalidator.onCreate('invoices');
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/invoices", id, item);
    await CacheInvalidator.onUpdate('invoices');
    return data;
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/invoices", id);
    await CacheInvalidator.onDelete('invoices');
    return data;
  }

  static async getItem(id) {
    const data = await super.getItem("/invoices", id);
    return InvoiceDto.fromApiArray([data.item])[0] || null;
  }
}
