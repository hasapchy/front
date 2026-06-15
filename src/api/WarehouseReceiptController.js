import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseReceiptDto from "@/dto/warehouse/WarehouseReceiptDto";
import BaseController from "./BaseController";

const RECEIPT_LIST_FILTER_KEYS = [
  "client_id",
  "date_filter_type",
  "start_date",
  "end_date",
  "status",
  "purchase_id",
  "warehouse_id",
  "product_id",
  "search",
  "eligible_for_return",
];

export default class WarehouseReceiptController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = null) {
    let queryParams = {};
    if (typeof params === "number" && params > 0) {
      queryParams = { client_id: params };
    } else if (params && typeof params === "object") {
      for (const key of RECEIPT_LIST_FILTER_KEYS) {
        const v = params[key];
        if (v !== undefined && v !== null && v !== "") {
          queryParams[key] = v;
        }
      }
    }
    const data = await super.getItems("/warehouse_receipts", page, perPage, queryParams);
    const items = WarehouseReceiptDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem("/warehouse_receipts", id);
    return WarehouseReceiptDto.fromApi(data);
  }

  static async storeItem(item) {
    const response = await super.storeItem("/warehouse_receipts", item);
    const dto = response?.data ? WarehouseReceiptDto.fromApi(response.data) : null;

    return {
      message: response?.message,
      item: dto,
      data: dto,
    };
  }

  static async updateItem(id, item) {
    const response = await super.updateItem("/warehouse_receipts", id, item);
    const dto = response?.data ? WarehouseReceiptDto.fromApi(response.data) : null;

    return {
      message: response?.message,
      item: dto,
    };
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_receipts", id);
  }
}
