import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import OrderCategoryDto from "@/dto/order/OrderCategoryDto";
import BaseController from "./BaseController";

export default class OrderCategoryController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/order_categories", page, per_page);
    const items = OrderCategoryDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/order_categories");
    return OrderCategoryDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem("/order_categories", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/order_categories", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/order_categories", id);
  }
}
