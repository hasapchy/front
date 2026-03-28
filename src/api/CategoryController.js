import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import CategoryDto from "@/dto/category/CategoryDto";
import BaseController from "./BaseController";

export default class CategoryController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems("/categories", page, perPage);
    const items = CategoryDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/categories");
    return CategoryDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem("/categories", item);
  }

  static async updateItem(id, item) {
    return super.updateItem("/categories", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/categories", id);
  }
  static async getParentCategories() {
    const data = await super.getData("/categories/parents");
    return CategoryDto.fromApiArray(data);
  }

}
