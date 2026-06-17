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

  static async getBalanceHistory(projectId, options = {}) {
    const {
      timestamp = null,
      page = 1,
      perPage = 20,
      signal = null,
      search = null,
      dateFrom = null,
      dateTo = null,
      source = null,
      transactionType = null,
      excludeDebt = null,
      isDebt = null,
      cashRegisterId = null,
    } = options;
    return super.handleRequest(
      async () => {
        const params = { page, per_page: perPage };
        if (timestamp) params.t = timestamp;
        if (search) params.search = search;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (source) params.source = source;
        if (transactionType) params.transaction_type = transactionType;
        if (excludeDebt === true) params.exclude_debt = true;
        if (isDebt === true) params.is_debt = true;
        if (cashRegisterId) params.cash_register_id = cashRegisterId;
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

  static async createDriveFolder(id, payload) {
    const data = await super.handleRequest(
      () => super.postData(`/projects/${id}/drive-folder`, payload),
      apiErrorMessage("projectDriveFolderCreate")
    );
    await CacheInvalidator.onUpdate('projects');
    return data;
  }
}
