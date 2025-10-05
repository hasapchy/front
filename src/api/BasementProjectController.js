import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProjectDto from "@/dto/project/ProjectDto";
import basementApi from "./basementAxiosInstance";

export default class BasementProjectController {
  static async getItems(page = 1, params = {}) {
    try {
      // Строим query string из параметров
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      
      // Добавляем дополнительные параметры
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      // Если запрашиваем активные проекты, используем endpoint /projects/all
      const endpoint = params.active_only ? '/projects/all' : '/projects';
      const response = await basementApi.get(`${endpoint}?${queryParams.toString()}`);
      const data = response.data;
      
      // Обрабатываем данные в зависимости от endpoint
      const itemsData = params.active_only ? data : data.items;
      const items = itemsData.map((item) => {
        // Обрабатываем данные клиента
        let clientData = null;
        if (item.client) {
          // Если клиент загружен как объект
          clientData = {
            id: item.client.id,
            first_name: item.client.first_name,
            last_name: item.client.last_name,
            contact_person: item.client.contact_person,
            phones: item.client.phones || [],
            emails: item.client.emails || []
          };
        } else if (item.client_first_name || item.client_last_name) {
          // Если данные клиента в отдельных полях
          clientData = {
            id: item.client_id,
            first_name: item.client_first_name,
            last_name: item.client_last_name,
            contact_person: item.client_contact_person,
            phones: [],
            emails: []
          };
        }
        
        return new ProjectDto(
          item.id,
          item.name,
          item.budget,
          item.currency_id,
          item.exchange_rate,
          item.date,
          item.client_id,
          clientData,
          item.user_id,
          item.user?.name || item.user_name,
          item.users || [],
          item.created_at,
          item.updated_at,
          item.files || [],
          item.currency,
          item.description,
          item.creator,
          item.status_id,
          item.status
        );
      });

      // Для активных проектов возвращаем массив, для обычных - пагинированный ответ
      if (params.active_only) {
        return items;
      }

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

  static async search(searchTerm) {
    try {
      const response = await basementApi.get(`/projects/search?search=${searchTerm}`);
      const data = response.data;
      
      const items = data.map((item) => {
        // Обрабатываем данные клиента
        let clientData = null;
        if (item.client) {
          clientData = {
            id: item.client.id,
            first_name: item.client.first_name,
            last_name: item.client.last_name,
            contact_person: item.client.contact_person,
            phones: item.client.phones || [],
            emails: item.client.emails || []
          };
        } else if (item.client_first_name || item.client_last_name) {
          clientData = {
            id: item.client_id,
            first_name: item.client_first_name,
            last_name: item.client_last_name,
            contact_person: item.client_contact_person,
            phones: [],
            emails: []
          };
        }
        
        return new ProjectDto(
          item.id,
          item.name,
          item.budget,
          item.currency_id,
          item.exchange_rate,
          item.date,
          item.client_id,
          clientData,
          item.user_id,
          item.user?.name || item.user_name,
          item.users || [],
          item.created_at,
          item.updated_at,
          item.files || [],
          item.currency,
          item.description,
          item.creator,
          item.status_id,
          item.status
        );
      });

      return items;
    } catch (error) {
      console.error("Ошибка при поиске проектов:", error);
      throw error;
    }
  }

  static async getItem(id) {
    try {
      const response = await basementApi.get(`/projects/${id}`);
      const data = response.data;
      
      // Обрабатываем данные клиента
      let clientData = null;
      if (data.client) {
        clientData = {
          id: data.client.id,
          first_name: data.client.first_name,
          last_name: data.client.last_name,
          contact_person: data.client.contact_person,
          phones: data.client.phones || [],
          emails: data.client.emails || []
        };
      } else if (data.client_first_name || data.client_last_name) {
        clientData = {
          id: data.client_id,
          first_name: data.client_first_name,
          last_name: data.client_last_name,
          contact_person: data.client_contact_person,
          phones: [],
          emails: []
        };
      }
      
      return new ProjectDto(
        data.id,
        data.name,
        data.budget,
        data.currency_id,
        data.exchange_rate,
        data.date,
        data.client_id,
        clientData,
        data.user_id,
        data.user?.name || data.user_name,
        data.users || [],
        data.created_at,
        data.updated_at,
        data.files || [],
        data.currency,
        data.description,
        data.creator,
        data.status_id,
        data.status
      );
    } catch (error) {
      console.error("Ошибка при получении проекта:", error);
      throw error;
    }
  }
}
