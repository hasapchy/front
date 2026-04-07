import InvoiceDto from "@/dto/invoice/InvoiceDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class InvoiceController extends BaseController {
  static async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null, typeFilter = null, statusFilter = null, perPage = 20) {
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

    const responseData = await super.getItems("/invoices", page, perPage, params);

    const items = InvoiceDto.fromApiArray(responseData.items);
    return new PaginatedResponse(
      items,
      responseData.current_page,
      responseData.next_page,
      responseData.last_page,
      responseData.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/invoices", id);
    return InvoiceDto.fromApi(data);
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

  /**
   * @param {number[]} orderIds
   * @returns {Promise<{ orders: unknown[], products: Record<string, unknown>[], order_date: string|null, total_amount: number }>}
   */
  static async getOrdersForInvoice(orderIds) {
    return super.handleRequest(
      async () => super.postData("/invoices/orders", { order_ids: orderIds }),
      apiErrorMessage("invoiceOrdersForInvoice")
    );
  }

}
