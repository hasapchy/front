import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import WarehouseWriteoffDto from "@/dto/warehouse/WarehouseWriteoffDto";
import BaseController from "./BaseController";

const WRITEOFF_LIST_FILTER_KEYS = ["reason"];

export default class WarehouseWriteoffController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = null) {
    const queryParams = {};
    if (params && typeof params === "object") {
      for (const key of WRITEOFF_LIST_FILTER_KEYS) {
        const v = params[key];
        if (v !== undefined && v !== null && v !== "") {
          queryParams[key] = v;
        }
      }
    }
    const data = await super.getItems(
      "/warehouse_writeoffs",
      page,
      perPage,
      queryParams
    );
    const items = WarehouseWriteoffDto.fromApiArray(data.items);

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

  static async getItem(id) {
    const data = await super.getItem("/warehouse_writeoffs", id);
    return WarehouseWriteoffDto.fromApi(data);
  }

  static async updateItem(id, item) {
    return super.updateItem("/warehouse_writeoffs", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/warehouse_writeoffs", id);
  }
}
