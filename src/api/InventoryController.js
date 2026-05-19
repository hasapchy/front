import BaseController from "./BaseController";
import InventoryDto from "@/dto/warehouse/InventoryDto";
import InventoryItemDto from "@/dto/warehouse/InventoryItemDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

export default class InventoryController extends BaseController {
  static async getPaginatedList(page = 1, perPage = 20, params = {}) {
    const raw = await super.getItems("/inventories", page, perPage, params);
    const items = InventoryDto.fromApiArray(raw.items ?? []);

    return new PaginatedResponse(
      items,
      raw.current_page,
      raw.next_page,
      raw.last_page,
      raw.total
    );
  }

  static async create(payload) {
    const data = await super.postData("/inventories", payload);
    return InventoryDto.fromApi(data);
  }

  static async getItem(id) {
    const data = await super.getItem("/inventories", id);
    return InventoryDto.fromApi(data);
  }

  static async getItems(id, page = 1, perPage = 100) {
    const data = await super.getItems(`/inventories/${id}/items`, page, perPage);
    const items = InventoryItemDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async updateItems(id, payload) {
    return super.patch(`/inventories/${id}/items`, payload);
  }

  static async finalize(id) {
    const data = await super.postData(`/inventories/${id}/finalize`, {});
    return InventoryDto.fromApi(data);
  }

  static async applyInventoryStockAdjustment(id) {
    const data = await super.postData(`/inventories/${id}/apply-shortage`, {});
    return InventoryDto.fromApi(data);
  }

  static async delete(id) {
    return super.delete(`/inventories/${id}`);
  }

  static async export(id, sort = "category") {
    return super.handleRequest(async () => {
      const response = await super.get(`/inventories/${id}/export`, {
        params: { sort },
        responseType: "blob",
      });
      return response;
    }, `Export failed: /inventories/${id}/export`);
  }
}
