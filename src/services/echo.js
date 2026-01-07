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
  const companyId = store?.getters?.currentCompanyId || "1";

  
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
  
  const echoInstance = new Echo({
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

  // Добавляем обработчики для проверки подключения
  const pusher = echoInstance.connector.pusher;
  
  // События подключения
  pusher.connection.bind('connected', () => {
    console.log('[WebSocket] ✅ Подключено к WebSocket серверу');
    if (window.onEchoConnected) window.onEchoConnected();
  });

  pusher.connection.bind('disconnected', () => {
    console.warn('[WebSocket] ❌ Отключено от WebSocket сервера');
    if (window.onEchoDisconnected) window.onEchoDisconnected();
  });

  pusher.connection.bind('error', (error) => {
    console.error('[WebSocket] ⚠️ Ошибка подключения:', error);
    if (window.onEchoError) window.onEchoError(error);
  });

  pusher.connection.bind('state_change', (states) => {
    console.log('[WebSocket] Состояние изменилось:', states.previous, '->', states.current);
  });

  // Методы для проверки состояния
  echoInstance.isConnected = () => {
    return pusher.connection.state === 'connected';
  };

  echoInstance.getConnectionState = () => {
    return pusher.connection.state; // 'initialized', 'connecting', 'connected', 'unavailable', 'failed', 'disconnected'
  };

  echoInstance.waitForConnection = (timeout = 10000) => {
    return new Promise((resolve, reject) => {
      if (pusher.connection.state === 'connected') {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for WebSocket connection'));
      }, timeout);

      const onConnected = () => {
        clearTimeout(timer);
        pusher.connection.unbind('connected', onConnected);
        pusher.connection.unbind('error', onError);
        resolve(true);
      };

      const onError = (error) => {
        clearTimeout(timer);
        pusher.connection.unbind('connected', onConnected);
        pusher.connection.unbind('error', onError);
        reject(error);
      };

      pusher.connection.bind('connected', onConnected);
      pusher.connection.bind('error', onError);
    });
  };

  return echoInstance;
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