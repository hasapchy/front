import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseReceiptDto from "@/dto/warehouse/WarehouseReceiptDto";
import BaseController from "./BaseController";

export default class WarehouseReceiptController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/warehouse_receipts", page, per_page);
    const items = WarehouseReceiptDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/warehouse_receipts", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/warehouse_receipts", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_receipts", id);
  }

  static async getItem(id) {
    const data = await super.getItem("/warehouse_receipts", id);
    return WarehouseReceiptDto.fromApiArray([data.item])[0] || null;
  }
}

