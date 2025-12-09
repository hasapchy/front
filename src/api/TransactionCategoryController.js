import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransactionCategoryDto from "@/dto/transaction/TransactionCategoryDto";
import BaseController from "./BaseController";

export default class TransactionCategoryController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/transaction_categories", page, per_page);
    const items = TransactionCategoryDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/transaction_categories");
    return TransactionCategoryDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem("/transaction_categories", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/transaction_categories", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/transaction_categories", id);
  }
}
