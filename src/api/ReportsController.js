import BaseController from "./BaseController";

export default class ReportsController extends BaseController {
  static normalizeRows(rows = []) {
    return (rows || []).map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      amount: row.amount,
    }));
  }

  static normalizeByCategories(data) {
    return {
      income: this.normalizeRows(data?.income || []),
      expenses: this.normalizeRows(data?.expenses || []),
    };
  }

  /**
   * @param {string} [dateFilterType]
   * @param {string|null} [startDate]
   * @param {string|null} [endDate]
   * @param {'report'|'default'} [currencyMode]
   * @param {number|null} [categoryId]
   * @returns {Promise<{ income: Array<{ category_id: number, category_name: string, amount: number }>, expenses: Array<{ category_id: number, category_name: string, amount: number }> }>}
   */
  static async getByCategories(dateFilterType = null, startDate = null, endDate = null, currencyMode = 'report', categoryId = null) {
    const params = { currency_mode: currencyMode };
    if (dateFilterType) params.date_filter_type = dateFilterType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (categoryId) params.category_ids = categoryId;
    const data = await this.get('/reports/by-categories', { params });
    return this.normalizeByCategories(data);
  }

  static async getCashflow({
    dateFilterType = null,
    startDate = null,
    endDate = null,
    currencyMode = 'report',
    groupBy = 'month',
    projectId = null,
    clientId = null,
    categoryId = null,
  } = {}) {
    const params = { currency_mode: currencyMode, group_by: groupBy };
    if (dateFilterType) params.date_filter_type = dateFilterType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (projectId) params.project_id = projectId;
    if (clientId) params.client_id = clientId;
    if (categoryId) params.category_id = categoryId;
    return this.get('/reports/cashflow', { params });
  }

  static async getCounterparties({
    dateFilterType = null,
    startDate = null,
    endDate = null,
    currencyMode = 'report',
    mode = 'net',
    projectId = null,
  } = {}) {
    const params = { currency_mode: currencyMode, mode };
    if (dateFilterType) params.date_filter_type = dateFilterType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (projectId) params.project_id = projectId;
    return this.get('/reports/counterparties', { params });
  }

  static async getOrders({
    dateFilterType = null,
    startDate = null,
    endDate = null,
    currencyMode = 'report',
    projectId = null,
  } = {}) {
    const params = { currency_mode: currencyMode };
    if (dateFilterType) params.date_filter_type = dateFilterType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (projectId) params.project_id = projectId;
    return this.get('/reports/orders', { params });
  }

  static async getContracts({
    dateFilterType = null,
    startDate = null,
    endDate = null,
    currencyMode = 'report',
    projectId = null,
  } = {}) {
    const params = { currency_mode: currencyMode };
    if (dateFilterType) params.date_filter_type = dateFilterType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (projectId) params.project_id = projectId;
    return this.get('/reports/contracts', { params });
  }

  static async getPlanFactBlueprint() {
    return this.get('/reports/plan-fact-blueprint');
  }
}
