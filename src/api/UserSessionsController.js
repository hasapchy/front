import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class UserSessionsController extends BaseController {
  static async list() {
    return super.handleRequest(
      async () => super.getData("/user/sessions"),
      apiErrorMessage("userSessionsList")
    );
  }

  static async revoke(sessionId) {
    return super.handleRequest(
      async () => super.deleteData(`/user/sessions/${sessionId}`),
      apiErrorMessage("userSessionRevoke")
    );
  }

  static async revokeAll() {
    return super.handleRequest(
      async () => super.deleteData("/user/sessions"),
      apiErrorMessage("userSessionsRevokeAll")
    );
  }

  static async listForUser(userId) {
    return super.handleRequest(
      async () => super.getData(`/users/${userId}/sessions`),
      apiErrorMessage("userAdminSessionsList")
    );
  }

  static async revokeForUser(userId, sessionId) {
    return super.handleRequest(
      async () => super.deleteData(`/users/${userId}/sessions/${sessionId}`),
      apiErrorMessage("userAdminSessionRevoke")
    );
  }

  static async revokeAllForUser(userId) {
    return super.handleRequest(
      async () => super.deleteData(`/users/${userId}/sessions`),
      apiErrorMessage("userAdminSessionsRevokeAll")
    );
  }
}
