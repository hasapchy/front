import TokenUtils from "@/utils/tokenUtils";
import AuthController from "@/api/AuthController";
import { onUserChange } from "@/services/userUiPreferencesSync";
import { clearAuthSessionId } from "@/utils/authSessionStorage";
import inAppNotificationsRealtime from "@/services/inAppNotificationsRealtime";
import globalChatRealtime from "@/services/globalChatRealtime";
import { getStore } from "@/store/storeManager";
import i18n from "@/i18n";

/**
 * @param {{ subtitleKey?: string, callServerLogout?: boolean }} [options]
 */
export async function forceAuthLogout(options = {}) {
  const { subtitleKey = "sessionExpired", callServerLogout = false } = options;
  const store = getStore();

  if (callServerLogout) {
    try {
      await AuthController.logout();
    } catch {
      void 0;
    }
  }

  TokenUtils.clearAuthData();
  clearAuthSessionId();
  onUserChange(null);
  localStorage.removeItem("current_company");

  inAppNotificationsRealtime.cleanup();
  globalChatRealtime.cleanup?.();

  if (store) {
    store.commit("SET_IN_APP_UNREAD_TOTAL", 0);
    await store.dispatch("setUser", null);
    await store.dispatch("setPermissions", []);
    await store.dispatch("initializeMenu");
    await store.dispatch("showNotification", {
      title: i18n.global.t("info"),
      subtitle: i18n.global.t(subtitleKey),
      isDanger: false,
    });
  }

  if (window.location.pathname.startsWith("/auth/login")) {
    return;
  }

  const { default: router } = await import("@/router");
  await router.push("/auth/login");
}
