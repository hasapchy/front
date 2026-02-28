import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import ClientBalanceDto from "@/dto/client/ClientBalanceDto";
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
    per_page = 20,
    signal = null
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
        const config = { params: { page, per_page, ...params } };
        if (signal) config.signal = signal;
        const response = await api.get("/clients", config);
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

  static async export(filters = {}, ids = null) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.include_inactive) params.include_inactive = true;
    if (filters.status_filter) params.status_filter = filters.status_filter;
    if (filters.type_filter != null) params.type_filter = Array.isArray(filters.type_filter) ? filters.type_filter : [filters.type_filter];
    return super.downloadExport('/clients', params, ids, 'clients.xlsx');
  }

  static async searchItems(term, typeFilter = null) {
    return super.handleRequest(
      async () => {
        const params = { search_request: term };
        if (typeFilter && Array.isArray(typeFilter) && typeFilter.length > 0) {
          params.type_filter = typeFilter;
        }
        const response = await api.get("/clients/search", { params });
        const data = Array.isArray(response.data) ? response.data : [];
        return ClientSearchDto.fromApiArray(data);
      },
      "Ошибка при поиске клиентов:"
    );
  }

  static async getListItems(forMutualSettlements = false, extraParams = {}) {
    return super.handleRequest(
      async () => {
        const params = { ...extraParams };
        if (forMutualSettlements) params.for_mutual_settlements = true;
        if (!params.search) delete params.search;
        if (!params.type_filter || (Array.isArray(params.type_filter) && !params.type_filter.length)) delete params.type_filter;
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

  static async getClientBalances(clientId) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/clients/${clientId}/balances`);
        const balancesData = response.data.data || [];
        return ClientBalanceDto.fromApiArray(balancesData);
      },
      `Ошибка при получении балансов клиента: /clients/${clientId}/balances`
    );
  }

  static async createClientBalance(clientId, currencyId, isDefault = false, initialBalance = 0, note = '', userIds = []) {
    return super.handleRequest(
      async () => {
        const response = await api.post(`/clients/${clientId}/balances`, {
          currency_id: currencyId,
          is_default: isDefault,
          balance: initialBalance,
          note: note,
          creator_ids: Array.isArray(userIds) ? userIds : []
        });
        const balanceData = response.data.data || response.data;
        return ClientBalanceDto.fromApi(balanceData);
      },
      `Ошибка при создании баланса клиента: /clients/${clientId}/balances`
    );
  }

  static async updateClientBalance(clientId, balanceId, data) {
    return super.handleRequest(
      async () => {
        const response = await api.put(`/clients/${clientId}/balances/${balanceId}`, data);
        const responseData = response.data;
        
        if (responseData.requires_confirmation) {
          return {
            requires_confirmation: true,
            message: responseData.message,
            current_default: responseData.current_default,
          };
        }
        
        const balanceData = responseData.data || responseData;
        return ClientBalanceDto.fromApi(balanceData);
      },
      `Ошибка при обновлении баланса клиента: /clients/${clientId}/balances/${balanceId}`
    );
  }

  static async deleteClientBalance(clientId, balanceId) {
    return super.handleRequest(
      async () => {
        await api.delete(`/clients/${clientId}/balances/${balanceId}`);
        return true;
      },
      `Ошибка при удалении баланса клиента: /clients/${clientId}/balances/${balanceId}`
    );
  }

  static async getBalanceHistory(id, excludeDebt = null, cashRegisterId = null, dateFrom = null, dateTo = null, balanceId = null, page = 1, perPage = 20) {
    return super.handleRequest(
      async () => {
        const params = { page, per_page: perPage };
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
        if (balanceId) {
          params.balance_id = balanceId;
        }
        const response = await api.get(`/clients/${id}/balance-history`, {
          params,
        });
        const data = response.data;
        const history = ClientBalanceHistoryDto.fromApiArray(data.history || []);
        return {
          history,
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? 0,
          per_page: data.per_page ?? perPage,
        };
      },
      "Ошибка при получении истории баланса клиента:"
    );
  }
}
