import api, { fetchSanctumCsrfCookie } from "./axiosInstance";
import TokenUtils from "@/utils/tokenUtils";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class AuthController extends BaseController {
  static async login(email, password, remember = false) {
    return super.handleRequest(
      async () => {
        await fetchSanctumCsrfCookie();
        const payload = await super.postData("/user/login", {
          email,
          password,
          remember,
        });
        TokenUtils.setAuthUser(payload.user ?? null);
        await fetchSanctumCsrfCookie();
        return payload;
      },
      apiErrorMessage("authLogin")
    );
  }

  static async getUser() {
    try {
      const { data } = await api.get("/user/me");
      const payload = data?.data;
      if (!payload?.user) {
        return null;
      }
      return {
        user: payload.user,
        permissions: payload.user.permissions,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  static async logout() {
    try {
      return super.handleRequest(
        async () => {
          await super.post("/user/logout");
        },
        apiErrorMessage("authLogout")
      );
    } finally {
      TokenUtils.clearAuthData();
      localStorage.removeItem("current_company");
    }
  }
}
