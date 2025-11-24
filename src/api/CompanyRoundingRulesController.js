import api from "./axiosInstance";

/**
 * Контроллер для работы с правилами округления компании
 * @class CompanyRoundingRulesController
 */
export default class CompanyRoundingRulesController {
  /**
   * Получить правила округления компании
   * @returns {Promise<Array>} Массив правил округления
   */
  static async getItems() {
    const response = await api.get("/company-rounding-rules");
    return response.data;
  }

  /**
   * Создать новое правило округления
   * @param {Object} item - Данные правила
   * @returns {Promise<Object>} Созданное правило
   */
  static async storeItem(item) {
    const response = await api.post("/company-rounding-rules", item);
    return response.data.rule;
  }

  /**
   * Обновить правило округления
   * @param {number|string} id - ID правила
   * @param {Object} item - Данные правила
   * @returns {Promise<Object>} Обновленное правило
   */
  static async updateItem(id, item) {
    const response = await api.put(`/company-rounding-rules/${id}`, item);
    return response.data.rule || response.data;
  }
}

