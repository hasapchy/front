import basementApi from "./basementAxiosInstance";
import TokenUtils from "@/utils/tokenUtils";

export class BasementAuthController {
  static async getBasementUser() {
    const token = TokenUtils.getToken();
    if (!token) {
      return null;
    }

    try {
      const { data } = await basementApi.get("/user/me");

      if (!data.user) {
        BasementAuthController.logout();
        return null;
      }

      if (!data.user.roles || !data.user.roles.includes("basement_worker")) {
        BasementAuthController.logout();
        return null;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("BasementAuth: Error getting user data:", error);
      BasementAuthController.logout();
      return null;
    }
  }

  static logout() {
    TokenUtils.clearAuthData();
  }

  static isAuthenticated() {
    const token = TokenUtils.getToken();
    const user = localStorage.getItem("user");
    if (!token || !user) return false;

    try {
      const userData = JSON.parse(user);
      return userData.roles && userData.roles.includes("basement_worker");
    } catch {
      return false;
    }
  }

  static getToken() {
    return TokenUtils.getToken();
  }
}
