import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import RoleDto from "@/dto/role/RoleDto";
import BaseController from "./BaseController";

export default class RolesController extends BaseController {
  static async getItems(page = 1, per_page = 20, search = null) {
    const params = search ? { search } : {};
    const responseData = await super.getItems("/roles", page, per_page, params);
    
    // Поддержка новой структуры с meta и старой структуры
    const items = RoleDto.fromApiArray(responseData.data || responseData.items || []);
    const meta = responseData.meta;
    
    if (meta) {
      return new PaginatedResponse(
        items,
        meta.current_page || page,
        meta.next_page || null,
        meta.last_page || 1,
        meta.total || 0
      );
    } else {
      // Старая структура
      return new PaginatedResponse(
        items,
        responseData.current_page || page,
        responseData.next_page || null,
        responseData.last_page || 1,
        responseData.total || 0
      );
    }
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

