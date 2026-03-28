import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import RoleDto from "@/dto/role/RoleDto";
import BaseController from "./BaseController";

export default class RolesController extends BaseController {
  static async getItems(page = 1, perPage = 20, search = null) {
    const params = search ? { search } : {};
    const responseData = await super.getItems("/roles", page, perPage, params);

    const items = RoleDto.fromApiArray(responseData.items);
    return new PaginatedResponse(
      items,
      responseData.current_page,
      responseData.next_page,
      responseData.last_page,
      responseData.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/roles");
    return RoleDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getItem("/roles", id);
    return RoleDto.fromApi(data);
  }

  static async storeItem(payload) {
    return super.storeItem("/roles", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  static async updateItem(id, payload) {
    return super.updateItem("/roles", id, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  static async deleteItem(id) {
    return super.deleteItem("/roles", id);
  }
}

