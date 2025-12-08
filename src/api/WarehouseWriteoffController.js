import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseWriteoffDto from "@/dto/warehouse/WarehouseWriteoffDto";
import BaseController from "./BaseController";

export default class WarehouseWriteoffController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/warehouse_writeoffs", page, per_page);
    const items = WarehouseWriteoffDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/warehouse_writeoffs", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/warehouse_writeoffs", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_writeoffs", id);
  }
}
