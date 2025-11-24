import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import ProjectDto from "@/dto/project/ProjectDto";
import basementApi from "./basementAxiosInstance";

/**
 * Нормализовать данные проекта
 * @private
 * @param {Object} item - Данные проекта
 * @returns {Object} Нормализованные данные проекта
 */
function normalizeProjectData(item) {
  const normalized = { ...item };
  
  if (!normalized.client && (normalized.client_first_name || normalized.client_last_name)) {
    normalized.client = {
      id: normalized.client_id,
      first_name: normalized.client_first_name,
      last_name: normalized.client_last_name,
      contact_person: normalized.client_contact_person,
      phones: [],
      emails: []
    };
  }
  
  if (normalized.user && !normalized.user_name) {
    normalized.user_name = normalized.user.name;
  }
  
  return normalized;
}

/**
 * Контроллер для работы с проектами в Basement
 * @class BasementProjectController
 */
export default class BasementProjectController {
  /**
   * Получить список проектов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {Object} [params={}] - Дополнительные параметры (active_only и др.)
   * @returns {Promise<PaginatedResponse|Array<ProjectDto>>} Объект с пагинированными данными или массив проектов
   */
  static async getItems(page = 1, params = {}) {
    const requestParams = {
      page,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value != null && value !== '')
      )
    };
    
    const endpoint = params.active_only ? '/projects/all' : '/projects';
    const response = await basementApi.get(endpoint, {
      params: requestParams
    });
    const data = response.data;
    
    const itemsData = params.active_only ? data.data : data.items;
    const normalizedItems = itemsData.map(normalizeProjectData);
    const items = ProjectDto.fromApiArray(normalizedItems);

    if (params.active_only) {
      return items;
    }

    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  /**
   * Поиск проектов
   * @param {string} searchTerm - Поисковый запрос
   * @returns {Promise<Array<ProjectDto>>} Массив найденных проектов
   */
  static async search(searchTerm) {
    const response = await basementApi.get('/projects/search', {
      params: { search: searchTerm }
    });
    const data = response.data.data || response.data;
    const normalizedItems = (Array.isArray(data) ? data : []).map(normalizeProjectData);
    return ProjectDto.fromApiArray(normalizedItems);
  }

  /**
   * Получить проект по ID
   * @param {number|string} id - ID проекта
   * @returns {Promise<ProjectDto|null>} Проект или null
   */
  static async getItem(id) {
    const response = await basementApi.get(`/projects/${id}`);
    const data = response.data.item || response.data.data || response.data;
    const normalizedData = normalizeProjectData(data);
    const items = ProjectDto.fromApiArray([normalizedData]);
    return items[0] || null;
  }
}

