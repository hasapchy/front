import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransferDto from "@/dto/transfer/TransferDto";
import BaseController from "./BaseController";

export default class TransferController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/transfers", page, per_page);
    const items = TransferDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/transfers", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/transfers", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/transfers", id);
  }
}
