import TaskStatusDto from "@/dto/task/TaskStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class TaskStatusController extends BaseController {
  static async getListItems() {
    const data = await super.getListItems("/task-statuses");
    return TaskStatusDto.fromApiArray(data);
  }

  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/task-statuses", page, per_page);
    const items = TaskStatusDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/task-statuses", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/task-statuses", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/task-statuses", id);
  }
}
