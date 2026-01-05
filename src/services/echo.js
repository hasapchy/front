// front/src/services/echo.js
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import TokenUtils from "@/utils/tokenUtils";
import { getStore } from "@/store/storeManager";

window.Pusher = Pusher;

// Создаем функцию для получения текущих заголовков
const getAuthHeaders = () => {
  const token = TokenUtils.getToken();
  const store = getStore();
  const companyId = store?.getters?.currentCompanyId || 
                   import.meta.env.VITE_DEFAULT_COMPANY_ID || 
                   "1";
  
  return {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
    "X-Company-ID": companyId.toString(),
  };
};

// Создаем экземпляр Echo с динамическими заголовками
const createEchoInstance = () => {
  const scheme = import.meta.env.VITE_REVERB_SCHEME || import.meta.env.VITE_PUSHER_SCHEME || 'https';
  const host = import.meta.env.VITE_REVERB_HOST || import.meta.env.VITE_PUSHER_HOST || window.location.hostname;
  const isProduction = scheme === 'https' || window.location.protocol === 'https:';
  
  // Для production через nginx используем порт 443 (или не указываем)
  // Для development используем прямой порт
  const wsPort = isProduction ? 443 : (import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 6001);
  const wssPort = isProduction ? 443 : (import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 6001);
  
  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY || "hasapchy-key",
    wsHost: host,
    wsPort: isProduction ? undefined : wsPort, // Для production не указываем порт (используется 443)
    wssPort: wssPort,
    forceTLS: isProduction,
    enabledTransports: isProduction ? ['wss'] : ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_APP_BASE_URL || window.location.origin}/broadcasting/auth`,
    auth: {
      headers: getAuthHeaders(),
    },
  });
};

// Экспортируем функцию для создания нового экземпляра
// или создаем один раз с обновляемыми заголовками
const echo = createEchoInstance();

// Экспортируем также функцию для обновления экземпляра
export const refreshEchoInstance = () => {
  echo.disconnect();
  return createEchoInstance();
};

export default echo;