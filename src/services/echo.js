import Echo from "laravel-echo";
import Pusher from "pusher-js";
import TokenUtils from "@/utils/tokenUtils";
import { getStore } from "@/store/storeManager";

window.Pusher = Pusher;

// Значения заголовков должны быть строками, а не функциями.
const token = TokenUtils.getToken();
const store = getStore();
const companyId = store?.getters?.currentCompanyId || import.meta.env.VITE_DEFAULT_COMPANY_ID || "1";

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_PUSHER_APP_KEY || "hasapchy-key",
  wsHost: import.meta.env.VITE_PUSHER_HOST || "192.168.50.71", // ваш сервер, не 127.0.0.1
  wsPort: import.meta.env.VITE_PUSHER_PORT || 8080,
  wssPort: import.meta.env.VITE_PUSHER_PORT || 8080,
  forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || "http") === "https",
  enabledTransports: ["ws", "wss"],
  authEndpoint: `${import.meta.env.VITE_APP_BASE_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      "X-Company-ID": companyId,
    },
  },
});
export default echo;