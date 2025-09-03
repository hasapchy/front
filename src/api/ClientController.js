import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ClientSearchDto from "@/dto/client/ClientSearchDto";
import ClientBalanceHistoryDto from "@/dto/client/ClientBalanceHistoryDto";

export default class ClientController {
  static async getItem(id) {
    try {
      const response = await api.get(`/clients/${id}`);
      const item = response.data.item || response.data;
      
      // Получаем данные телефонов и email'ов из Eloquent relationships
      let phones = item.phones || [];
      let emails = item.emails || [];

      return new ClientDto(
        item.id,
        item.client_type,
        item.balance_amount || 0,
        item.is_supplier,
        item.is_conflict,
        item.first_name,
        item.last_name,
        item.contact_person,
        item.address,
        item.note,
        item.status,
        item.discount_type,
        item.discount,
        item.created_at,
        item.updated_at,
        emails,
        phones
      );
    } catch (error) {
      console.error("Ошибка при получении клиента:", error);
      throw error;
    }
  }

  static async getItems(page = 1, search = null) {
    try {
      const params = { page: page };
      if (search) {
        params.search = search;
      }
      const response = await api.get("/clients", { params });
      const data = response.data;
      
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        // Получаем данные телефонов и email'ов из Eloquent relationships
        let phones = item.phones || [];
        let emails = item.emails || [];

        return new ClientDto(
          item.id,
          item.client_type,
          item.balance_amount || 0,
          item.is_supplier,
          item.is_conflict,
          item.first_name,
          item.last_name,
          item.contact_person,
          item.address,
          item.note,
          item.status,
          item.discount_type,
          item.discount,
          item.created_at,
          item.updated_at,
          emails,
          phones
        );
      });

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
      const response = await api.get(`/clients/search?search_request=${term}`);
      const data = response.data;
      
      // Преобразуем полученные данные в DTO для поиска (только необходимые поля)
      const items = data.map((item) => {
        // Получаем данные телефонов из Eloquent relationships
        let phones = item.phones || [];

        return new ClientSearchDto(
          item.id,
          item.client_type,
          item.balance_amount || 0,
          item.is_supplier,
          item.is_conflict,
          item.first_name,
          item.last_name,
          item.contact_person,
          item.status,
          phones
        );
      });
      return items;
    } catch (summary) {
      console.error("Ошибка при поиске клиентов:", summary);
      throw summary;
    }
  }

  // static async getAllItems() {
  //     try {
  //         const response = await api.get(`/categories/all`);
  //         const data = response.data;
  //         // Преобразуем полученные данные в DTO
  //         const items = data.map(item => {
  //             return new CategoryDto(
  //                 item.id,
  //                 item.name,
  //                 item.parent_id,
  //                 item.parent_name,
  //                 item.user_id,
  //                 item.user_name,
  //                 item.users,
  //                 item.created_at,
  //                 item.updated_at,
  //             );
  //         });
  //         return items;
  //     } catch (error) {
  //         console.error('Ошибка при получении категорий:', error);
  //         throw error;
  //         }
  //     }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/clients", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании клиента:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/clients/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении клиента:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/clients/${id}`);
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
      // Если data — объект с history, используем его, иначе предполагаем массив
      const historyArray = Array.isArray(data) ? data : (data.history || []);
      const items = historyArray.map((item) => {
        return new ClientBalanceHistoryDto(
          item.source,
          item.source_id, // Исправлено: было item.sourceId
          item.date,
          item.amount,
          item.description
        );
      });
      return items;
    } catch (error) {
      console.error("Ошибка при получении истории баланса клиента:", error);
      throw error;
    }
  }

}
