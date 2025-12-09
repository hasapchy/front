import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseMovementDto from "@/dto/warehouse/WarehouseMovementDto";
import BaseController from "./BaseController";

export default class WarehouseMovementController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/warehouse_movements", page, per_page);
    const items = WarehouseMovementDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/warehouse_movements", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/warehouse_movements", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_movements", id);
  }
}
