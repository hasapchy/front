import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";
import ClientDto from "@/dto/client/ClientDto";
import ProjectDto from "@/dto/project/ProjectDto";
import CurrencyDto from "@/dto/app/CurrencyDto";

export default class ProjectController {
  static async getItems(page = 1, params = {}) {
    try {
      const queryParams = new URLSearchParams({ page: page, ...params });
      const response = await api.get(`/projects?${queryParams}`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.items.map((item) => {
        var client = null;
        if (item.client) {
          client = new ClientDto(
            item.client.id,
            item.client.client_type,
            item.client.balance || 0,
            item.client.is_supplier,
            item.client.is_conflict,
            item.client.first_name,
            item.client.last_name,
            item.client.contact_person,
            item.client.address,
            item.client.note,
            item.client.status,
            item.client.discount_type,
            item.client.discount,
            item.client.created_at,
            item.client.updated_at,
            item.client.emails || [],
            item.client.phones || []
          );
        }
        
        var currency = null;
        if (item.currency) {
          currency = new CurrencyDto({
            id: item.currency.id,
            code: item.currency.code,
            name: item.currency.name,
            symbol: item.currency.symbol,
            is_default: item.currency.is_default,
            is_report: item.currency.is_report,
            status: item.currency.status
          });
        }
        
        return new ProjectDto(
          item.id,
          item.name,
          item.budget,
          item.currency_id,
          item.exchange_rate,
          item.date,
          item.client_id,
          client,
          item.user_id,
          item.user_name,
          item.users || [],
          item.created_at,
          item.updated_at,
          item.files || [],
          currency,
          item.description,
          item.creator,
          item.status_id,
          item.status
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
      console.error("Ошибка при получении проектов:", error);
      throw error;
    }
  }

  static async getAllItems() {
    try {
      const response = await api.get(`/projects/all`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.map((item) => {
        var client = null;
        if (item.client) {
          client = new ClientDto(
            item.client.id,
            item.client.client_type,
            item.client.balance || 0,
            item.client.is_supplier,
            item.client.is_conflict,
            item.client.first_name,
            item.client.last_name,
            item.client.contact_person,
            item.client.address,
            item.client.note,
            item.client.status,
            item.client.discount_type,
            item.client.discount,
            item.client.created_at,
            item.client.updated_at,
            item.client.emails || [],
            item.client.phones || []
          );
        }
        
        var currency = null;
        if (item.currency) {
          currency = new CurrencyDto({
            id: item.currency.id,
            code: item.currency.code,
            name: item.currency.name,
            symbol: item.currency.symbol,
            is_default: item.currency.is_default,
            is_report: item.currency.is_report,
            status: item.currency.status
          });
        }
        
        return new ProjectDto(
          item.id,
          item.name,
          item.budget,
          item.currency_id,
          item.exchange_rate,
          item.date,
          item.client_id,
          client,
          item.user_id,
          item.user_name,
          item.users || [],
          item.created_at,
          item.updated_at,
          item.files || [],
          currency,
          item.description,
          item.creator,
          item.status_id,
          item.status
        );
      });
      return items;
    } catch (error) {
      console.error("Ошибка при получении всего списка проектов:", error);
      throw error;
    }
  }

  static async getActiveItems() {
    try {
      const response = await api.get(`/projects/active`);
      const data = response.data;
      // Преобразуем полученные данные в DTO
      const items = data.map((item) => {
        var client = null;
        if (item.client) {
          client = new ClientDto(
            item.client.id,
            item.client.client_type,
            item.client.balance || 0,
            item.client.is_supplier,
            item.client.is_conflict,
            item.client.first_name,
            item.client.last_name,
            item.client.contact_person,
            item.client.address,
            item.client.note,
            item.client.status,
            item.client.discount_type,
            item.client.discount,
            item.client.created_at,
            item.client.updated_at,
            item.client.emails || [],
            item.client.phones || []
          );
        }
        
        var currency = null;
        if (item.currency) {
          currency = new CurrencyDto({
            id: item.currency.id,
            code: item.currency.code,
            name: item.currency.name,
            symbol: item.currency.symbol,
            is_default: item.currency.is_default,
            is_report: item.currency.is_report,
            status: item.currency.status
          });
        }
        
        return new ProjectDto(
          item.id,
          item.name,
          item.budget,
          item.currency_id,
          item.exchange_rate,
          item.date,
          item.client_id,
          client,
          item.user_id,
          item.user_name,
          item.users || [],
          item.created_at,
          item.updated_at,
          item.files || [],
          currency,
          item.description,
          item.creator,
          item.status_id,
          item.status
        );
      });
      return items;
    } catch (error) {
      console.error("Ошибка при получении активных проектов:", error);
      throw error;
    }
  }

  static async getItem(id) {
    try {
      const response = await api.get(`/projects/${id}`);
      const item = response.data;
      
      const client = item.client ? new ClientDto(
        item.client.id,
        item.client.client_type,
        item.client.balance || 0,
        item.client.is_supplier,
        item.client.is_conflict,
        item.client.first_name,
        item.client.last_name,
        item.client.contact_person,
        item.client.address,
        item.client.note,
        item.client.status,
        item.client.discount_type,
        item.client.discount,
        item.client.created_at,
        item.client.updated_at,
        item.client.emails || [],
        item.client.phones || []
      ) : null;

      const currency = item.currency ? new CurrencyDto({
        id: item.currency.id,
        code: item.currency.code,
        name: item.currency.name,
        symbol: item.currency.symbol,
        is_default: item.currency.is_default,
        is_report: item.currency.is_report,
        status: item.currency.status
      }) : null;

      return new ProjectDto(
        item.id,
        item.name,
        item.budget,
        item.currency_id,
        item.exchange_rate,
        item.date,
        item.client_id,
        client,
        item.user_id,
        item.user_name,
        item.users || [],
        item.created_at,
        item.updated_at,
        item.files || [],
        currency,
        item.description,
        item.creator,
        item.status_id,
        item.status
      );
    } catch (error) {
      console.error("Ошибка при получении проекта:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const { data } = await api.post("/projects", item);
      return data;
    } catch (error) {
      console.error("Ошибка при создании проекта:", error);
      throw error;
    }
  }

  static async updateItem(id, item) {
    try {
      const { data } = await api.put(`/projects/${id}`, item);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении проекта:", error);
      throw error;
    }
  }

  static async deleteItem(id) {
    try {
      const { data } = await api.delete(`/projects/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении проекта:", error);
      throw error;
    }
  }

  static async uploadFiles(projectId, files) {
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
  }

  static async deleteFile(projectId, filePath) {
    const response = await api.post(`/projects/${projectId}/delete-file`, {
      path: filePath,
    });
    return response.data.files;
  }

  static async getBalanceHistory(projectId, timestamp = null) {
    try {
      const url = timestamp 
        ? `/projects/${projectId}/balance-history?t=${timestamp}`
        : `/projects/${projectId}/balance-history`;
      const { data } = await api.get(url);
      return data; // { history, balance, budget }
    } catch (error) {
      console.error("Ошибка при получении истории баланса проекта:", error);
      throw error;
    }
  }

  static async batchUpdateStatus(data) {
    try {
      const { data: response } = await api.post("/projects/batch-status", data);
      return response;
    } catch (error) {
      console.error("Ошибка при обновлении статуса проектов:", error);
      throw error;
    }
  }
}
