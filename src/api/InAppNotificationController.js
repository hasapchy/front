import BaseController from "./BaseController";

export default class InAppNotificationController extends BaseController {
  static async getSettings() {
    return super.getData("/user/notification-settings");
  }

  static async updateSettings(channels) {
    return super.putData("/user/notification-settings", { channels });
  }

  static async list(params = {}) {
    return super.getData("/user/notifications", { params });
  }

  static async markAllRead() {
    return super.postData("/user/notifications/read-all", {});
  }

  static async markRead(id) {
    return super.postData(`/user/notifications/${id}/read`, {});
  }
}
