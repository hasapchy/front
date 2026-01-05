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
  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,  // ← Исправлено на REVERB
    wsHost: import.meta.env.VITE_REVERB_HOST,  // ← Исправлено на REVERB
    wsPort: import.meta.env.VITE_REVERB_PORT,  // ← Исправлено на REVERB
    wssPort: import.meta.env.VITE_REVERB_PORT, // ← Исправлено на REVERB
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_APP_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: getAuthHeaders(), // Функция будет вызываться при каждом запросе
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