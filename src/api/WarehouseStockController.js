import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseStockDto from "@/dto/warehouse/WarehouseStockDto";
import BaseController from "./BaseController";

export default class WarehouseStockController extends BaseController {
  static async getItems(
    page = 1,
    warehouseId = null,
    categoryId = null,
    perPage = 20,
    search = null,
    availability = "all"
  ) {
    const params = {
      warehouseId,
      categoryId,
      availability,
      ...(search ? { search } : {}),
    };
    const data = await super.getItems("/warehouse_stocks", page, perPage, params);
    const items = WarehouseStockDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }
}
