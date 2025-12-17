import LeaveDto from "@/dto/leave/LeaveDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";
import api from "./axiosInstance";

export default class LeaveController extends BaseController {
  static async getItems(page = 1, per_page = 20, filters = {}) {
    const data = await super.getItems("/leaves", page, per_page, filters);
    const items = LeaveDto.fromApiArray(data.items || []);

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
    return LeaveDto.fromApiArray(data || []);
  }

  static async getItem(id) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/leaves/${id}`);
        const item = LeaveDto.fromApiArray([response.data.item || response.data])[0];
        return item;
      },
      `Ошибка при получении записи отпуска: /leaves/${id}`
    );
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

