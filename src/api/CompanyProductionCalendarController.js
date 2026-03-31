import BaseController from './BaseController';

class CompanyProductionCalendarController extends BaseController {
  static async getAll(params = {}) {
    return this.getData('/company-production-calendar-days/all', { params });
  }

  static async storeDates(dates) {
    return this.postData('/company-production-calendar-days', { dates });
  }

  static async batchDeleteDates(dates) {
    return this.post('/company-production-calendar-days/batch-delete', { dates });
  }

  static async deleteById(id) {
    return this.delete(`/company-production-calendar-days/${id}`);
  }
}

export default CompanyProductionCalendarController;
