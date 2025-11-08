import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import ProjectDto from "@/dto/project/ProjectDto";
import queryCache from "@/utils/queryCache";

export default class ProjectController {
  static async getItems(page = 1, params = {}, per_page = 20) {
    try {
      const queryParams = new URLSearchParams({
        page: page,
        per_page: per_page,
        ...params,
      });
      const response = await api.get(`/projects?${queryParams}`);
      const data = response.data;
      const items = ProjectDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении проектов:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/projects/all?active_only=true`);
      const data = response.data;
      const items = ProjectDto.fromApiArray(data);
      return items;
    } catch (error) {
      console.error("Ошибка при получении всего списка проектов:", error);
      throw error;
    }
  }

  static async getItem(id) {
    try {
      const response = await api.get(`/projects/${id}`);
      const item = response.data.item;

      return ProjectDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении проекта:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/projects", item);
      // Инвалидируем кэш списков проектов
      queryCache.invalidate("projects_list");
      return data;
    } catch (error) {
      console.error("Ошибка при создании проекта:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/projects/${id}`, item);
      // Инвалидируем кэш списков проектов
      queryCache.invalidate("projects_list");
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении проекта:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/projects/${id}`);
      // Инвалидируем кэш списков проектов
      queryCache.invalidate("projects_list");
      return data;
    } catch (error) {
      console.error("Ошибка при удалении проекта:", error);
      throw error;
    }
  }

  static async uploadFiles(projectId, files) {
    try {
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
    } catch (error) {
      console.error("Ошибка при загрузке файлов проекта:", error);
      throw error;
    }
  }

  static async deleteFile(projectId, filePath) {
    try {
      const response = await api.post(`/projects/${projectId}/delete-file`, {
        path: filePath,
      });
      return response.data.files;
    } catch (error) {
      console.error("Ошибка при удалении файла проекта:", error);
      throw error;
    }
  }

  static async getProjectFiles(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.item.files;
    } catch (error) {
      console.error("Ошибка при получении файлов проекта:", error);
      throw error;
    }
  }

  static async getBalanceHistory(projectId, timestamp = null) {
    try {
      const url = timestamp
        ? `/projects/${projectId}/balance-history?t=${timestamp}`
        : `/projects/${projectId}/balance-history`;
      const { data } = await api.get(url);

      // DRY: преобразуем историю в DTO
      const ProjectBalanceHistoryDto = (
        await import("@/dto/project/ProjectBalanceHistoryDto")
      ).default;
      const history = ProjectBalanceHistoryDto.fromApiArray(data.history);

      return {
        history,
        balance: data.balance,
        budget: data.budget,
      };
    } catch (error) {
      console.error("Ошибка при получении истории баланса проекта:", error);
      throw error;
    }
  }

  static async getDetailedBalance(projectId) {
    try {
      const { data } = await api.get(`/projects/${projectId}/detailed-balance`);
      return data; // { total_balance, real_balance, debt_balance }
    } catch (error) {
      console.error("Ошибка при получении детального баланса проекта:", error);
      throw error;
    }
  }

  static async batchUpdateStatus(data) {
    try {
      const { data: response } = await api.post("/projects/batch-status", data);
      // Инвалидируем кэш списков проектов после массового обновления
      queryCache.invalidate("projects_list");
      return response;
    } catch (error) {
      console.error("Ошибка при обновлении статуса проектов:", error);
      throw error;
    }
  }
}
