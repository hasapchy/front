import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehousePurchaseDto from "@/dto/warehouse/WarehousePurchaseDto";
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
    return WarehousePurchaseDto.fromApi(data);
  }

  static async storeItem(item) {
    const response = await super.storeItem("/warehouse_purchases", item);
    const dto = response?.data ? WarehousePurchaseDto.fromApi(response.data) : null;

    return {
      message: response?.message,
      item: dto,
      data: dto,
    };
  }

  static async updateItem(id, item) {
    const response = await super.updateItem("/warehouse_purchases", id, item);
    const dto = response?.data ? WarehousePurchaseDto.fromApi(response.data) : null;

    return {
      message: response?.message,
      item: dto,
    };
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_purchases", id);
  }

  static async pay(id, payload) {
    return super.storeItem(`/warehouse_purchases/${id}/pay`, payload);
  }
}
