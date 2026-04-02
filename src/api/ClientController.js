import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import ClientBalanceDto from "@/dto/client/ClientBalanceDto";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class ClientController extends BaseController {
  static async getItems(
    page = 1,
    search = null,
    includeInactive = false,
    statusFilter = null,
    typeFilter = null,
    perPage = 20,
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
        const config = { params: { page, per_page: perPage, ...params } };
        if (signal) config.signal = signal;
        const responseData = await super.getData("/clients", config);
        const items = ClientDto.fromApiArray(responseData.items);
        const meta = responseData.meta;

        return new PaginatedResponse(
          items,
          meta.current_page,
          meta.next_page,
          meta.last_page,
          meta.total
        );
      },
      apiErrorMessage("clientList")
    );
  }

  static async getListItems(forMutualSettlements = false, extraParams = {}) {
    return super.handleRequest(
      async () => {
        const params = { ...extraParams };
        if (forMutualSettlements) params.for_mutual_settlements = true;
        if (!params.search) delete params.search;

        const typeFilterCamel = params.typeFilter;
        const typeFilterSnake = params.type_filter;
        const typeFilter = typeFilterSnake ?? typeFilterCamel;
        if (typeFilterSnake == null && typeFilterCamel != null) {
          params.type_filter = typeFilterCamel;
        }
        if (!typeFilter || (Array.isArray(typeFilter) && !typeFilter.length)) {
          delete params.typeFilter;
          delete params.type_filter;
        }

        if (params.currency_id === null || params.currency_id === undefined || params.currency_id === '') {
          delete params.currency_id;
        }
        if (params.only_with_balance === null || params.only_with_balance === undefined || params.only_with_balance === '') {
          delete params.only_with_balance;
        }
        if (!params.balance_direction) {
          delete params.balance_direction;
        }
        const data = await super.getData("/clients/all", { params });
        return ClientDto.fromApiArray(data);
      },
      apiErrorMessage("clientAll")
    );
  }

  static async getItem(id) {
    return super.handleRequest(
      async () => {
        const clientData = await super.getData(`/clients/${id}`);
        return ClientDto.fromApi(clientData);
      },
      apiErrorMessage("clientGet", { path: `/clients/${id}` })
    );
  }

  static async storeItem(item) {
    return super.handleRequest(
      async () => {
        const responseData = await super.post("/clients", item);
        const clientData = responseData.data;
        return {
          item: ClientDto.fromApi(clientData),
          message: responseData.message,
        };
      },
      apiErrorMessage("clientCreate")
    );
  }

  static async updateItem(id, item) {
    return super.handleRequest(
      async () => {
        const responseData = await super.put(`/clients/${id}`, item);
        const clientData = responseData.data;
        return {
          client: ClientDto.fromApi(clientData),
          message: responseData.message,
        };
      },
      apiErrorMessage("clientUpdate", { path: `/clients/${id}` })
    );
  }

  static async deleteItem(id) {
    return super.deleteItem("/clients", id);
  }

  static async export(filters = {}, ids = null) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.includeInactive) params.include_inactive = true;
    if (filters.statusFilter) params.status_filter = filters.statusFilter;
    if (filters.typeFilter != null) params.type_filter = Array.isArray(filters.typeFilter) ? filters.typeFilter : [filters.typeFilter];
    return super.downloadExport('/clients', params, ids, 'clients.xlsx');
  }

  static async searchItems(term, typeFilter = null) {
    return super.handleRequest(
      async () => {
        const params = { searchRequest: term };
        if (typeFilter && Array.isArray(typeFilter) && typeFilter.length > 0) {
          params.type_filter = typeFilter;
        }
        const data = await super.getData("/clients/search", { params });
        return ClientSearchDto.fromApiArray(data);
      },
      apiErrorMessage("clientSearch")
    );
  }

  static async getClientBalances(clientId) {
    return super.handleRequest(
      async () => {
        const balancesData = await super.getData(`/clients/${clientId}/balances`);
        return ClientBalanceDto.fromApiArray(balancesData);
      },
      apiErrorMessage("clientBalances", { path: `/clients/${clientId}/balances` })
    );
  }

  static async createClientBalance(clientId, currencyId, isDefault = false, initialBalance = 0, note = '', type = 1, userIds = []) {
    return super.handleRequest(
      async () => {
        const response = await super.post(`/clients/${clientId}/balances`, {
          currencyId: currencyId,
          type: type,
          isDefault: isDefault,
          balance: initialBalance,
          note: note,
          creatorIds: Array.isArray(userIds) ? userIds : []
        });
        const balanceData = response.data;
        return ClientBalanceDto.fromApi(balanceData);
      },
      apiErrorMessage("clientBalanceCreate", { path: `/clients/${clientId}/balances` })
    );
  }

  static async updateClientBalance(clientId, balanceId, data) {
    return super.handleRequest(
      async () => {
        const responseData = await super.put(`/clients/${clientId}/balances/${balanceId}`, data);
        
        if (responseData.data.requires_confirmation) {
          return {
            requires_confirmation: true,
            message: responseData.data.message,
            current_default: responseData.data.current_default,
          };
        }
        
        const balanceData = responseData.data;
        return ClientBalanceDto.fromApi(balanceData);
      },
      apiErrorMessage("clientBalanceUpdate", { path: `/clients/${clientId}/balances/${balanceId}` })
    );
  }

  static async deleteClientBalance(clientId, balanceId) {
    return super.handleRequest(
      async () => {
        await super.delete(`/clients/${clientId}/balances/${balanceId}`);
        return true;
      },
      apiErrorMessage("clientBalanceDelete", { path: `/clients/${clientId}/balances/${balanceId}` })
    );
  }

  static async getBalanceHistory(
    id,
    excludeDebt = null,
    cashRegisterId = null,
    dateFrom = null,
    dateTo = null,
    balanceId = null,
    page = 1,
    perPage = 20,
    source = null,
    isDebt = null
  ) {
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
        if (source) {
          params.source = source;
        }
        if (isDebt === true) {
          params.is_debt = true;
        }
        const data = await super.getData(`/clients/${id}/balance-history`, {
          params,
        });
        const history = ClientBalanceHistoryDto.fromApiArray(data.history || []);
        return {
          history,
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
          per_page: data.per_page,
        };
      },
      apiErrorMessage("clientBalanceHistory")
    );
  }
}
