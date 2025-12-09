import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProjectDto from "@/dto/project/ProjectDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";

export default class ProjectController extends BaseController {
  static async getItems(page = 1, params = {}, per_page = 20) {
    const data = await super.getItems("/projects", page, per_page, params);
    const items = ProjectDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/projects", { active_only: true });
    return ProjectDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getItem("/projects", id);
    return ProjectDto.fromApiArray([data.item])[0] || null;
  }

  static async storeItem(item) {
    const data = await super.storeItem("/projects", item);
    await CacheInvalidator.onCreate('projects');
    return data;
  }

  static async updateItem(id, item) {
    const data = await super.updateItem("/projects", id, item);
    await CacheInvalidator.onUpdate('projects');
    return data;
  }

  static async deleteItem(id) {
    const data = await super.deleteItem("/projects", id);
    await CacheInvalidator.onDelete('projects');
    return data;
  }

  static async uploadFiles(projectId, files) {
    return super.handleRequest(
      async () => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append("files[]", files[i]);
        }

        const response = await api.post(
          `/projects/${projectId}/upload-files`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data.files;
      },
      "Ошибка при загрузке файлов проекта:"
    );
  }

  static async deleteFile(projectId, filePath) {
    return super.handleRequest(
      async () => {
        const response = await api.post(`/projects/${projectId}/delete-file`, {
          path: filePath,
        });
        return response.data.files;
      },
      "Ошибка при удалении файла проекта:"
    );
  }

  static async getBalanceHistory(projectId, timestamp = null) {
    return super.handleRequest(
      async () => {
        const params = timestamp ? { t: timestamp } : {};
        const { data } = await api.get(`/projects/${projectId}/balance-history`, { params });

        const ProjectBalanceHistoryDto = (
          await import("@/dto/project/ProjectBalanceHistoryDto")
        ).default;
        const history = ProjectBalanceHistoryDto.fromApiArray(data.history);

        return {
          history,
          balance: data.balance,
          budget: data.budget,
        };
      },
      "Ошибка при получении истории баланса проекта:"
    );
  }

  static async getDetailedBalance(projectId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/projects/${projectId}/detailed-balance`);
        return data;
      },
      "Ошибка при получении детального баланса проекта:"
    );
  }

  static async batchUpdateStatus(data) {
    return super.handleRequest(
      async () => {
        const { data: response } = await api.post("/projects/batch-status", data);
        return response;
      },
      "Ошибка при обновлении статуса проектов:"
    );
  }
}
