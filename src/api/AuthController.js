import api, { fetchSanctumCsrfCookie } from "./axiosInstance";
import TokenUtils from "@/utils/tokenUtils";
import { setAuthSessionId } from "@/utils/authSessionStorage";
import { getWebDeviceHeaders } from "@/utils/webDeviceHeaders";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class AuthController extends BaseController {
  static async login(email, password, remember = false) {
    return super.handleRequest(
      async () => {
        await fetchSanctumCsrfCookie();
        const payload = await super.postData(
          "/user/login",
          {
            email,
            password,
            remember,
          },
          { headers: getWebDeviceHeaders() },
        );
        TokenUtils.setAuthUser(payload.user ?? null);
        if (payload.auth_session_id != null) {
          setAuthSessionId(payload.auth_session_id);
        }
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
      if (payload.current_auth_session_id != null) {
        setAuthSessionId(payload.current_auth_session_id);
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
