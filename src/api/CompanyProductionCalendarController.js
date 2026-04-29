import BaseController from './BaseController';

class CompanyProductionCalendarController extends BaseController {
  static async getAll(params = {}) {
    return this.getData('/company-production-calendar-days/all', { params });
  }

  static async storeDates(dates) {
    const list = Array.isArray(dates) ? dates : [];
    const data = await this.postData('/company-production-calendar-days', {
      dates: list,
    });
    return {
      created: data?.created ?? 0,
      total_requested: data?.total_requested ?? list.length,
    };
  }

  static async deleteById(id) {
    return this.delete(`/company-production-calendar-days/${id}`);
  }
}

export default CompanyProductionCalendarController;
