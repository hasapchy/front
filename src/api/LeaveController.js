import LeaveDto from "@/dto/leave/LeaveDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class LeaveController extends BaseController {
  static async getItems(page = 1, perPage = 20, filters = {}) {
    const data = await super.getItems("/leaves", page, perPage, filters);
    const items = LeaveDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems(filters = {}) {
    const data = await super.getListItems("/leaves", filters);
    return LeaveDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getData(`/leaves/${id}`);
    return LeaveDto.fromApi(data);
  }

  static async storeItem(item) {
    return super.storeItem("/leaves", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/leaves", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/leaves", id);
  }
}

