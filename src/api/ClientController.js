import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";
import { queryCache } from "@/utils/cacheHelper";

export default class ClientController {

  static async getItem(id) {
    try {
      const response = await api.get(`/clients/${id}`);
      const item = response.data.item;
      return ClientDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении клиента:", error);
      throw error;
    }
  }

  static async getItems(page = 1, search = null, includeInactive = false, statusFilter = null, typeFilter = null, per_page = 20) {
    try {
      const cacheKey = 'clients_list';
      const cacheParams = { page, per_page, search, includeInactive, statusFilter, typeFilter };
      const cached = await queryCache.get(cacheKey, cacheParams);
      
      if (cached && cached.items && cached.items.length > 0 && cached.items[0] instanceof ClientDto) {
        console.log('📦 Загружено из кэша: clients', cacheParams);
        return cached;
      }

      const params = { page: page, per_page: per_page };
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
      const response = await api.get("/clients", { params });
      const data = response.data;
      
      const items = ClientDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      queryCache.set(cacheKey, cacheParams, paginatedResponse);
      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении клиентов:", error);
      throw error;
    }
  }

  static async search(term) {
    try {
      const response = await api.get(`/clients/search?search_request=${term}`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      const items = ClientSearchDto.fromApiArray(data);
      return items;
    } catch (summary) {
      console.error("Ошибка при поиске клиентов:", summary);
      throw summary;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/clients/all`);
      const data = response.data;
      const items = ClientDto.fromApiArray(data);
      return items;
    } catch (error) {
      console.error('Ошибка при получении всех клиентов:', error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const response = await api.post("/clients", item);
      queryCache.invalidate('clients_list');
      const data = response.data;
      return { item: data.item, message: data.message || 'Client created successfully' };
    } catch (error) {
      console.error("Ошибка при создании клиента:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/clients/${id}`, item);
      queryCache.invalidate('clients_list');
      return data;
    } catch (error) {
      if (error?.response?.status !== 422) {
        console.error("Ошибка при обновлении клиента:", error);
      }
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/clients/${id}`);
      queryCache.invalidate('clients_list');
      return data;
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        throw new Error(serverMessage); 
      }
      throw error;
    }
  }

  static async getBalanceHistory(id) {
    try {
      const response = await api.get(`/clients/${id}/balance-history`);
      const data = response.data;
      const historyArray = data.history;
      const items = ClientBalanceHistoryDto.fromApiArray(historyArray);
      return items;
    } catch (error) {
      if (error?.response?.status !== 403) {
        console.error("Ошибка при получении истории баланса клиента:", error);
      }
      throw error;
    }
  }

}
