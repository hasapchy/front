import CategoryDto from "@/dto/category/CategoryDto";
import basementApi from "./basementAxiosInstance";

export default class BasementCategoryController {
  static async getAllItems() {
    try {
      const response = await basementApi.get("/categories/all");
      const data = response.data;
      
      const items = CategoryDto.fromApiArray(data);

      return items;
    } catch (error) {
      console.error("Ошибка при получении категорий:", error);
      throw error;
    }
  }
}

