import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransactionDto from "@/dto/transaction/TransactionDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class TransactionController extends BaseController {
  static async getItems(
    page = 1,
    cashId = null,
    dateFilterType = "all_time",
    orderId = null,
    search = null,
    transactionType = null,
    source = null,
    projectId = null,
    perPage = 20,
    startDate = null,
    endDate = null,
    isDebt = null,
    categoryIds = null,
    contractId = null
  ) {
    const params = {
      cash_id: cashId,
      date_filter_type: dateFilterType,
      order_id: orderId,
      search,
      transaction_type: transactionType,
      source,
      project_id: projectId,
      start_date: startDate,
      end_date: endDate,
      is_debt: isDebt,
      contract_id: contractId,
    };

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      params.category_ids = categoryIds.join(',');
    }

    const data = await super.getItems("/transactions", page, perPage, params);
    const items = TransactionDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/transactions", id);
    return TransactionDto.fromApi(data);
  }

  static async storeItem(item) {
    const data = await super.storeItem("/transactions", item);
    await CacheInvalidator.onCreate("transactions");
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/transactions", id, item);
    await CacheInvalidator.onUpdate("transactions");
    return data;
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/transactions", id);
    await CacheInvalidator.onDelete("transactions");
    return data;
  }
  static async export(filters = {}, ids = null) {
    const f = filters || {};
    const params = {};
    if (f.cashId != null && f.cashId !== '') params.cash_id = f.cashId;
    if (f.dateFilterType) params.date_filter_type = f.dateFilterType;
    if (f.orderId) params.order_id = f.orderId;
    if (f.search) params.search = f.search;
    if (f.transactionType != null && f.transactionType !== '') params.transaction_type = f.transactionType;
    if (f.source) params.source = f.source;
    if (f.projectId) params.project_id = f.projectId;
    if (f.startDate) params.start_date = f.startDate;
    if (f.endDate) params.end_date = f.endDate;
    if (f.isDebt != null && f.isDebt !== '') params.is_debt = f.isDebt;
    if (f.contractId) params.contract_id = f.contractId;
    if (Array.isArray(f.categoryIds) && f.categoryIds.length) params.category_ids = f.categoryIds.join(',');
    return super.downloadExport('/transactions', params, ids, 'transactions.xlsx');
  }

  static async getItemsByContractId(contractId, perPage = 20) {
    return this.getItems(1, null, 'all_time', null, null, null, null, null, perPage, null, null, null, null, contractId);
  }

  static async getTotalPaidByOrderId(orderId) {
    return super.handleRequest(async () => {
      const envelope = await super.get(`/transactions/total`, {
        params: { order_id: orderId },
      });
      return envelope?.data ?? envelope;
    }, "Ошибка при получении оплаченной суммы:");
  }

}
