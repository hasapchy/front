import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseDto from "@/dto/warehouse/WarehouseDto";
import BaseController from "./BaseController";

export default class WarehouseController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/warehouses", page, per_page);
    const items = WarehouseDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/warehouses");
    return WarehouseDto.fromApiArray(data);
  }

  static async storeItem(item) {
    const data = await super.storeItem("/warehouses", item);
    return { item: data.warehouse, message: data.message };
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/warehouses", id, item);
    return { item: data.warehouse, message: data.message };
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouses", id);
  }
}
