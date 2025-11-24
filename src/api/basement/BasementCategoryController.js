import CategoryDto from "@/dto/category/CategoryDto";
import basementApi from "./basementAxiosInstance";

/**
 * Контроллер для работы с категориями в Basement
 * @class BasementCategoryController
 */
export default class BasementCategoryController {
  /**
   * Получить все категории без пагинации
   * @returns {Promise<Array<CategoryDto>>} Массив категорий
   */
  static async getAllItems() {
    const response = await basementApi.get("/categories/all");
    return CategoryDto.fromApiArray(response.data.data);
  }
}

