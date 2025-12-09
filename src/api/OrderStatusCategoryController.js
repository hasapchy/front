import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class OrderStatusCategoryController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/order_status_categories", page, per_page);
    const items = OrderStatusCategoryDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/order_status_categories");
    return OrderStatusCategoryDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem("/order_status_categories", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/order_status_categories", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/order_status_categories", id);
  }
}
