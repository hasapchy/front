import { DepartmentDto } from "@/dto/departments/DepartmentDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class DepartmentController extends BaseController {
    static async getItems(page = 1, perPage = 20) {
        const data = await super.getItems("/departments", page, perPage);
        const items = DepartmentDto.fromApiArray(data.items);
        return new PaginatedResponse(
            items,
            data.current_page,
            data.next_page,
            data.last_page,
            data.total
        );
    }

    static async storeItem(payload) {
        return super.storeItem("/departments", payload);
    }

    static async updateItem(id, payload) {
        return super.updateItem("/departments", id, payload);
    }

    static async deleteItem(id) {
        return super.deleteItem("/departments", id);
    }
    static async getAllItems() {
        const data = await super.getData("/departments/all");
        return DepartmentDto.fromApiArray(data);
    }

}
