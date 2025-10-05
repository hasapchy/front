import ProjectStatusDto from "@/dto/project/ProjectStatusDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

export default class ProjectStatusController {
  static async getAllItems() {
    const response = await api.get(`/project-statuses/all`);
    return (response.data || []).map(
      (item) =>
        new ProjectStatusDto(
          item.id,
          item.name,
          item.color,
          item.user_id,
          item.user,
          item.created_at,
          item.updated_at
        )
    );
  }

  static async getItems(page = 1, per_page = 10) {
    const response = await api.get(`/project-statuses?page=${page}&per_page=${per_page}`);
    const data = response.data;
    const items = (data.items || []).map(
      (item) =>
        new ProjectStatusDto(
          item.id,
          item.name,
          item.color,
          item.user_id,
          item.user,
          item.created_at,
          item.updated_at
        )
    );
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item) {
    const { data } = await api.post("/project-statuses", item);
    return data;
  }

  static async updateItem(id, item) {
    const { data } = await api.put(`/project-statuses/${id}`, item);
    return data;
  }

  static async deleteItem(id) {
    const { data } = await api.delete(`/project-statuses/${id}`);
    return data;
  }
}
