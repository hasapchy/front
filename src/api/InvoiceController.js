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

    const data = await super.getItems("/invoices", page, per_page, params);
    const items = InvoiceDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
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
