import api from "./axiosInstance";
import BaseController from "./BaseController";

export default class ReportsController extends BaseController {
  /**
   * @param {string} [dateFilterType]
   * @param {string|null} [startDate]
   * @param {string|null} [endDate]
   * @param {'report'|'default'} [currencyMode]
   * @param {number|null} [categoryId]
   * @returns {Promise<{ income: Array<{ category_id: number, category_name: string, amount: number }>, expenses: Array<{ category_id: number, category_name: string, amount: number }> }>}
   */
  static async getByCategories(dateFilterType = null, startDate = null, endDate = null, currencyMode = 'report', categoryId = null) {
    return this.handleRequest(async () => {
      const params = { currency_mode: currencyMode };
      if (dateFilterType) params.date_filter_type = dateFilterType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (categoryId) params.category_ids = categoryId;
      const response = await api.get('/reports/by-categories', { params });
      return response.data;
    }, 'Ошибка при загрузке отчёта по категориям');
  }
}
