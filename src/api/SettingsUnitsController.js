import BaseController from "./BaseController";

export default class SettingsUnitsController extends BaseController {
  static async listUnits() {
    return super.getData("/settings/units");
  }

  static async createUnit(payload) {
    return super.postData("/settings/units", payload);
  }

  static async updateUnit(id, payload) {
    return super.putData(`/settings/units/${id}`, payload);
  }

  static async deleteUnit(id) {
    return super.deleteData(`/settings/units/${id}`);
  }
}
