import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehousePurchaseDto from "@/dto/warehouse/WarehousePurchaseDto";
import { logWarehousePurchaseTransactions } from "@/utils/warehousePurchaseTransactionsDebug";
import BaseController from "./BaseController";

export default class WarehousePurchaseController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = null) {
    const data = await super.getItems("/warehouse_purchases", page, perPage, params ?? {});

    return new PaginatedResponse(
      WarehousePurchaseDto.fromApiArray(data.items ?? []),
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/warehouse_purchases", id);
    const rawTx = Array.isArray(data?.transactions) ? data.transactions : [];
    logWarehousePurchaseTransactions("api-get-item-raw", {
      purchaseId: id,
      transactionsCount: rawTx.length,
      transactions: rawTx.map((row) => ({
        id: row?.id,
        category_id: row?.category_id,
        category_name: row?.category_name,
        categoryId: row?.categoryId,
        categoryName: row?.categoryName,
        creator_id: row?.creator_id,
        creatorId: row?.creatorId,
        creator: row?.creator,
        cash_id: row?.cash_id,
        cash_name: row?.cash_name,
        date: row?.date,
        orig_amount: row?.orig_amount,
        origAmount: row?.origAmount,
        keys: row && typeof row === "object" ? Object.keys(row) : [],
      })),
    });
    const dto = WarehousePurchaseDto.fromApi(data);
    const dtoTx = Array.isArray(dto?.transactions) ? dto.transactions : [];
    logWarehousePurchaseTransactions("api-get-item-dto", {
      purchaseId: id,
      transactionsCount: dtoTx.length,
      transactions: dtoTx.map((row) => ({
        id: row?.id,
        categoryId: row?.categoryId,
        categoryName: row?.categoryName,
        creatorId: row?.creatorId,
        creator: row?.creator,
        cashId: row?.cashId,
        cashName: row?.cashName,
        cashDisplayName: row?.cashDisplayName,
        date: row?.date,
        origAmount: row?.origAmount,
        hasFormatDate: typeof row?.formatDate === "function",
      })),
    });
    return dto;
  }

  static async storeItem(item) {
    return super.storeItem("/warehouse_purchases", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/warehouse_purchases", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_purchases", id);
  }

  static async pay(id, payload) {
    return super.storeItem(`/warehouse_purchases/${id}/pay`, payload);
  }
}
