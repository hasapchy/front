import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import BaseController from "./BaseController";

export default class ClientController extends BaseController {
  static async getItem(id) {
    const data = await super.getItem("/clients", id);
    return ClientDto.fromApiArray([data.item])[0] || null;
  }

  static async getItems(
    page = 1,
    search = null,
    includeInactive = false,
    statusFilter = null,
    typeFilter = null,
    per_page = 20
  ) {
    const params = {};
    if (search) {
      params.search = search;
    }
    if (includeInactive) {
      params.include_inactive = true;
    }
    if (statusFilter) {
      params.status_filter = statusFilter;
    }
    if (typeFilter) {
      params.type_filter = typeFilter;
    }

    const data = await super.getItems("/clients", page, per_page, params);
    const items = ClientDto.fromApiArray(data.items || []);

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async searchItems(term) {
    return super.handleRequest(
      async () => {
        const response = await api.get("/clients/search", {
          params: { search_request: term },
        });
        const data = Array.isArray(response.data) ? response.data : [];
        return ClientSearchDto.fromApiArray(data);
      },
      "Ошибка при поиске клиентов:"
    );
  }

  static async getListItems(forMutualSettlements = false) {
    const params = forMutualSettlements ? { for_mutual_settlements: true } : {};
    const data = await super.getListItems("/clients", params);
    return ClientDto.fromApiArray(data);
  }

  static async storeItem(item) {
    const data = await super.storeItem("/clients", item);
    return {
      item: data.item,
      message: data.message || "Client created successfully",
    };
  }

  static async updateItem(id, item) {
    return super.updateItem("/clients", id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem("/clients", id);
  }

  static async getBalanceHistory(id, excludeDebt = null) {
    return super.handleRequest(
      async () => {
        const params = excludeDebt === true ? { exclude_debt: true } : {};
        const response = await api.get(`/clients/${id}/balance-history`, {
          params,
        });
        return ClientBalanceHistoryDto.fromApiArray(response.data.history);
      },
      "Ошибка при получении истории баланса клиента:"
    );
  }
}
