import basementApi from "./basementAxiosInstance";
import TokenUtils from "@/utils/tokenUtils";

export const BasementAuthController = {
  async getBasementUser() {
    const token = TokenUtils.getToken();
    if (!token) {
      return null;
    }

    try {
      const { data } = await basementApi.get("/user/me");

      // Проверяем, что данные пользователя есть
      if (!data.user) {
        BasementAuthController.logout();
        return null;
      }

      // Проверяем роль пользователя
      if (!data.user.roles || !data.user.roles.includes("basement_worker")) {
        BasementAuthController.logout();
        return null;
      }

      // Обновляем данные в localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("BasementAuth: Error getting user data:", error);
      // Если токен недействителен, удаляем его
      BasementAuthController.logout();
      return null;
    }
  },

  logout() {
    TokenUtils.clearAuthData();
  },

  isAuthenticated() {
    const token = TokenUtils.getToken();
    const user = localStorage.getItem("user");
    if (!token || !user) return false;

    try {
      const userData = JSON.parse(user);
      return userData.roles && userData.roles.includes("basement_worker");
    } catch {
      return false;
    }
  },

  getToken() {
    return TokenUtils.getToken();
  },
};
