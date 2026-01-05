import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import BaseController from "./BaseController";

export default class ClientController extends BaseController {
  static async getItem(id) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/clients/${id}`);
        const clientData = response.data.data || response.data;
        return ClientDto.fromApiArray([clientData])[0] || null;
      },
      `Ошибка при получении клиента: /clients/${id}`
    );
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

    return super.handleRequest(
      async () => {
        const response = await api.get("/clients", { params: { page, per_page, ...params } });
        const responseData = response.data;
        const items = ClientDto.fromApiArray(responseData.data || []);
        const meta = responseData.meta || {};

        return new PaginatedResponse(
          items,
          meta.current_page || page,
          meta.next_page || null,
          meta.last_page || 1,
          meta.total || 0
        );
      },
      "Ошибка при получении списка клиентов:"
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

  static async getListItems(forMutualSettlements = false, cashRegisterId = null) {
    return super.handleRequest(
      async () => {
        const params = {};
        if (forMutualSettlements) {
          params.for_mutual_settlements = true;
        }
        if (cashRegisterId) {
          params.cash_register_id = cashRegisterId;
        }
        const response = await api.get("/clients/all", { params });
        const responseData = response.data;
        const items = responseData.data || responseData;
        return ClientDto.fromApiArray(Array.isArray(items) ? items : []);
      },
      "Ошибка при получении всех клиентов:"
    );
  }

  static async storeItem(item) {
    return super.handleRequest(
      async () => {
        const response = await api.post("/clients", item);
        const responseData = response.data;
        const clientData = responseData.data || responseData;
        return {
          item: ClientDto.fromApiArray([clientData])[0] || clientData,
          message: responseData.message || "Client created successfully",
        };
      },
      "Ошибка при создании клиента:"
    );
  }

  static async updateItem(id, item) {
    return super.handleRequest(
      async () => {
        const response = await api.put(`/clients/${id}`, item);
        const responseData = response.data;
        const clientData = responseData.data || responseData;
        return {
          client: ClientDto.fromApiArray([clientData])[0] || clientData,
          message: responseData.message || "Client updated successfully",
        };
      },
      `Ошибка при обновлении клиента: /clients/${id}`
    );
  }

  static async deleteItem(id) {
    return super.deleteItem("/clients", id);
  }

  static async getBalanceHistory(id, excludeDebt = null, cashRegisterId = null, dateFrom = null, dateTo = null) {
    return super.handleRequest(
      async () => {
        const params = {};
        if (excludeDebt === true) {
          params.exclude_debt = true;
        }
        if (cashRegisterId) {
          params.cash_register_id = cashRegisterId;
        }
        if (dateFrom) {
          params.date_from = dateFrom;
        }
        if (dateTo) {
          params.date_to = dateTo;
        }
        const response = await api.get(`/clients/${id}/balance-history`, {
          params,
        });
        return ClientBalanceHistoryDto.fromApiArray(response.data.history);
      },
      "Ошибка при получении истории баланса клиента:"
    );
  }
}
