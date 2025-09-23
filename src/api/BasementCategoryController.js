import CategoryDto from "@/dto/category/CategoryDto";
import basementApi from "./basementAxiosInstance";

export default class BasementCategoryController {
  static async getAllItems() {
    try {
      const response = await basementApi.get("/categories/all");
      const data = response.data;
      
      const items = data.map((item) => {
        return new CategoryDto(
          item.id,
          item.name,
          item.parent_id,
          null, // parentName
          null, // userId
          null, // userName
          [], // users
          item.created_at,
          item.updated_at
        );
      });

      return items;
    } catch (error) {
      console.error("Ошибка при получении категорий:", error);
      throw error;
    }
  }
}

