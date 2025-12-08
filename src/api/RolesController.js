import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import RoleDto from "@/dto/role/RoleDto";
import BaseController from "./BaseController";

export default class RolesController extends BaseController {
  static async getItems(page = 1, per_page = 20, search = null) {
    const params = search ? { search } : {};
    const data = await super.getItems("/roles", page, per_page, params);
    const items = RoleDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/roles");
    return RoleDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getItem("/roles", id);
    return RoleDto.fromApiArray([data.item])[0] || null;
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

