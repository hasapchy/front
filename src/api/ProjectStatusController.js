import ProjectStatusDto from "@/dto/project/ProjectStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class ProjectStatusController extends BaseController {
  static async getListItems() {
    const data = await super.getListItems("/project-statuses");
    return ProjectStatusDto.fromApiArray(data);
  }

  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/project-statuses", page, per_page);
    const items = ProjectStatusDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    return super.storeItem("/project-statuses", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/project-statuses", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/project-statuses", id);
  }
}
