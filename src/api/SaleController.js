import SaleDto from "@/dto/sale/SaleDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class SaleController extends BaseController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, per_page = 20) {
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

    const data = await super.getItems("/sales", page, per_page, params);
    const items = SaleDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    const data = await super.storeItem("/sales", item);
    await CacheInvalidator.onCreate('sales');
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/sales", id, item);
    await CacheInvalidator.onUpdate('sales');
    return data;
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/sales", id);
    await CacheInvalidator.onDelete('sales');
    return data;
  }

  static async getItem(id) {
    const data = await super.getItem("/sales", id);
    return SaleDto.fromApiArray([data.item])[0] || null;
  }
}
