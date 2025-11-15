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
      
      const itemsData = params.active_only ? data : data.items;
      const normalizedItems = itemsData.map(item => {
        if (!item.client && (item.client_first_name || item.client_last_name)) {
          item.client = {
            id: item.client_id,
            first_name: item.client_first_name,
            last_name: item.client_last_name,
            contact_person: item.client_contact_person,
            phones: [],
            emails: []
          };
        }
        if (item.user && !item.user_name) {
          item.user_name = item.user.name;
        }
        return item;
      });
      const items = ProjectDto.fromApiArray(normalizedItems);

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
      
      const normalizedItems = data.map(item => {
        if (!item.client && (item.client_first_name || item.client_last_name)) {
          item.client = {
            id: item.client_id,
            first_name: item.client_first_name,
            last_name: item.client_last_name,
            contact_person: item.client_contact_person,
            phones: [],
            emails: []
          };
        }
        if (item.user && !item.user_name) {
          item.user_name = item.user.name;
        }
        return item;
      });
      const items = ProjectDto.fromApiArray(normalizedItems);

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
      
      const normalizedData = { ...data };
      if (!normalizedData.client && (normalizedData.client_first_name || normalizedData.client_last_name)) {
        normalizedData.client = {
          id: normalizedData.client_id,
          first_name: normalizedData.client_first_name,
          last_name: normalizedData.client_last_name,
          contact_person: normalizedData.client_contact_person,
          phones: [],
          emails: []
        };
      }
      if (normalizedData.user && !normalizedData.user_name) {
        normalizedData.user_name = normalizedData.user.name;
      }
      return ProjectDto.fromApiArray([normalizedData])[0] || null;
    } catch (error) {
      console.error("Ошибка при получении проекта:", error);
      throw error;
    }
  }
}

