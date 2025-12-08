import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseStockDto from "@/dto/warehouse/WarehouseStockDto";
import BaseController from "./BaseController";

export default class WarehouseStockController extends BaseController {
  static async getItems(
    page = 1,
    warehouse_id = null,
    category_id = null,
    per_page = 20,
    search = null,
    availability = "all"
  ) {
    const params = {
      warehouse_id,
      category_id,
      availability,
      ...(search ? { search } : {}),
    };
    const data = await super.getItems("/warehouse_stocks", page, per_page, params);
    const items = WarehouseStockDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }
}
