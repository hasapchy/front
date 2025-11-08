import ProjectStatusDto from "@/dto/project/ProjectStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

export default class ProjectStatusController {
  static async getAllItems() {
    try {
      const response = await api.get(`/project-statuses/all`);
      return ProjectStatusDto.fromApiArray(response.data);
    } catch (error) {
      console.error("Ошибка при получении статусов проектов:", error);
      throw error;
    }
  }

  static async getItems(page = 1, per_page = 20) {
    try {
      const response = await api.get(`/project-statuses?page=${page}&per_page=${per_page}`);
      const data = response.data;
      const items = ProjectStatusDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении статусов проектов:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/project-statuses", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании статуса проекта:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/project-statuses/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении статуса проекта:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/project-statuses/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении статуса проекта:", error);
      throw error;
    }
  }
}
