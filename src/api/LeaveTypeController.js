import LeaveTypeDto from "@/dto/leave/LeaveTypeDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class LeaveTypeController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems("/leave_types", page, perPage);
    const items = LeaveTypeDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/leave_types");
    return LeaveTypeDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getData(`/leave_types/${id}`);
    return LeaveTypeDto.fromApi(data);
  }

  static async storeItem(item) {
    return super.storeItem("/leave_types", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/leave_types", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/leave_types", id);
  }
}

