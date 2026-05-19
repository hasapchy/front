import BaseController from "./BaseController";

export default class UnitsController extends BaseController {
  static async listUnits() {
    return super.getData("/units");
  }

  static async createUnit(payload) {
    return super.postData("/units", payload);
  }

  static async updateUnit(id, payload) {
    return super.putData(`/units/${id}`, payload);
  }

  static async deleteUnit(id) {
    return super.deleteData(`/units/${id}`);
  }
}
