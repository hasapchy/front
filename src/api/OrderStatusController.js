import OrderStatusDto from "@/dto/order/OrderStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class OrderStatusController extends BaseController {
  static async getListItems() {
    const data = await super.getListItems("/order_statuses");
    return OrderStatusDto.fromApiArray(data);
  }

  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/order_statuses", page, per_page);
    const items = OrderStatusDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/order_statuses", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/order_statuses", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/order_statuses", id);
  }
}
