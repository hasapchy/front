import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import basementApi from "./basementAxiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";

export default class BasementClientController {
  static async getItem(id) {
    try {
      const response = await basementApi.get(`/clients/${id}`);
      const item = response.data.item;
      
      return ClientDto.fromApiArray([item])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении клиента:", error);
      throw error;
    }
  }

  static async getItems(page = 1, search = null, includeInactive = false, per_page = 20) {
    try {
      const params = { page: page, per_page: per_page };
      if (search) {
        params.search = search;
      }
      if (includeInactive) {
        params.include_inactive = true;
      }
      const response = await basementApi.get("/clients", { params });
      const data = response.data;
      
      const items = ClientDto.fromApiArray(data.items);

      const paginatedResponse = new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );

      return paginatedResponse;
    } catch (error) {
      console.error("Ошибка при получении клиентов:", error);
      throw error;
    }
  }

  static async search(term) {
    try {
      const response = await basementApi.get(`/clients/search?search_request=${term}`);
      const data = response.data;
      
      const items = ClientSearchDto.fromApiArray(data);
      return items;
    } catch (summary) {
      console.error("Ошибка при поиске клиентов:", summary);
      throw summary;
    }
  }

  static async getAllItems() {
    try {
      const response = await basementApi.get(`/clients/all`);
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
      const { data } = await basementApi.post("/clients", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании клиента:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await basementApi.put(`/clients/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении клиента:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await basementApi.delete(`/clients/${id}`);
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
      const response = await basementApi.get(`/clients/${id}/balance-history`);
      const data = response.data;
      const historyArray = data.history;
      const items = ClientBalanceHistoryDto.fromApiArray(historyArray);
      return items;
    } catch (error) {
      console.error("Ошибка при получении истории баланса клиента:", error);
      throw error;
    }
  }
}


