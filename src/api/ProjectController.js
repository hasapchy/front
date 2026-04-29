import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProjectDto from "@/dto/project/ProjectDto";
import { CacheInvalidator } from "@/cache";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class ProjectController extends BaseController {
  static async getItems(page = 1, params = {}, perPage = 20) {
    const data = await super.getItems("/projects", page, perPage, params);
    const items = ProjectDto.fromApiArray(data.items);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/projects", { activeOnly: true });
    return ProjectDto.fromApiArray(data);
  }

  static async getItem(id) {
    const data = await super.getItem("/projects", id);
    return ProjectDto.fromApi(data);
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

        const response = await super.post(
          `/projects/${projectId}/upload-files`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data;
      },
      apiErrorMessage("projectFilesLoad")
    );
  }

  static async deleteFile(projectId, filePath) {
    return super.handleRequest(
      async () => {
        const response = await super.delete(`/v2/projects/${projectId}/files`, {
          params: { path: filePath },
        });
        return response.data;
      },
      apiErrorMessage("projectFileDelete")
    );
  }

  static async downloadFiles(projectId, filePaths) {
    return super.handleRequest(
      async () => {
        const response = await super.post(
          `/projects/${projectId}/download-files`,
          { paths: filePaths },
          {
            responseType: 'blob',
          }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let filename = `project_${projectId}_files.zip`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
      },
      apiErrorMessage("projectFilesDownload")
    );
  }

  static async getBalanceHistory(projectId, timestamp = null, page = 1, perPage = 20, signal = null) {
    return super.handleRequest(
      async () => {
        const params = { page, per_page: perPage };
        if (timestamp) params.t = timestamp;
        const config = { params };
        if (signal) {
          config.signal = signal;
        }
        const data = await super.getData(`/projects/${projectId}/balance-history`, config);

        const ProjectBalanceHistoryDto = (
          await import("@/dto/project/ProjectBalanceHistoryDto")
        ).default;
        const history = ProjectBalanceHistoryDto.fromApiArray(data.history || []);

        const result = {
          history,
          balance: data.balance,
          budget: data.budget,
        };
        if (data.current_page != null) {
          result.currentPage = data.current_page;
          result.lastPage = data.last_page;
          result.total = data.total;
          result.perPage = data.per_page;
        }
        return result;
      },
      apiErrorMessage("projectBalanceHistory")
    );
  }

  static async getDetailedBalance(projectId) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/projects/${projectId}/detailed-balance`);
        return {
          totalBalance: data.total_balance ?? 0,
          realBalance: data.real_balance ?? 0,
          totalIncome: data.total_income ?? 0,
          totalExpense: data.total_expense ?? 0,
        };
      },
      apiErrorMessage("projectBalanceDetail")
    );
  }

  static async batchUpdateStatus(data) {
    const ids = Array.isArray(data.ids) ? data.ids : [];
    const statusId = data.statusId ?? data.status_id;
    return super.handleRequest(
      async () =>
        super.mapUnifiedBatchChunks(ids, (chunk) =>
          super.postUnifiedBatch({
            entity: "projects",
            action: "update_status",
            ids: chunk,
            payload: { statusId },
            sync: true,
          }),
        ),
      apiErrorMessage("projectsStatusUpdate"),
    );
  }
}
