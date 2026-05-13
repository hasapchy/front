import BaseController from "./BaseController";

export default class SettingsUnitsController extends BaseController {
  static async listUnits() {
    return super.getData("/settings/units");
  }

  static async listConversions() {
    return super.getData("/settings/unit-conversions");
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

  static async createConversion(payload) {
    return super.postData("/settings/unit-conversions", payload);
  }

  static async updateConversion(id, payload) {
    return super.putData(`/settings/unit-conversions/${id}`, payload);
  }

  static async deleteConversion(id) {
    return super.deleteData(`/settings/unit-conversions/${id}`);
  }
}
