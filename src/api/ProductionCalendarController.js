import BaseController from './BaseController';

class ProductionCalendarController extends BaseController {
  static async getAll(params = {}) {
    return this.getData('/production-calendar-days/all', { params });
  }

  static async getItem(id) {
    const items = await this.getAll({});
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return null;
    }
    const row = Array.isArray(items)
      ? items.find((item) => Number(item.id) === targetId)
      : null;
    return row ?? null;
  }

  static async storeDates(dates) {
    const list = Array.isArray(dates) ? dates : [];
    const data = await this.postData('/production-calendar-days', {
      dates: list,
    });
    return {
      created: data?.created ?? 0,
      total_requested: data?.total_requested ?? list.length,
    };
  }

  static async deleteById(id) {
    return this.delete(`/production-calendar-days/${id}`);
  }

  static async updateById(id, date) {
    return this.putData(`/production-calendar-days/${id}`, {
      date,
    });
  }
}

export default ProductionCalendarController;
