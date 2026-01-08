// front/src/services/echo.js
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import TokenUtils from "@/utils/tokenUtils";
import { getStore } from "@/store/storeManager";

window.Pusher = Pusher;

// Production = npm run build, Development = npm run dev
const IS_PROD = import.meta.env.PROD;

// Конфигурация WebSocket
const WS_HOST = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const WS_KEY = import.meta.env.VITE_REVERB_APP_KEY || "hasapchy-key";
const AUTH_URL = `${import.meta.env.VITE_APP_BASE_URL || window.location.origin}/broadcasting/auth`;

console.log('[Echo] Config:', { IS_PROD, WS_HOST, WS_KEY, AUTH_URL });

// Создаём Echo
const echo = new Echo({
  broadcaster: "reverb",
  key: WS_KEY,
  wsHost: WS_HOST,
  wsPort: IS_PROD ? undefined : 6001,
  wssPort: 443,
  forceTLS: IS_PROD,
  enabledTransports: IS_PROD ? ['wss'] : ['ws', 'wss'],
  authEndpoint: AUTH_URL,
  
  // Динамическая авторизация - токен берётся при каждом запросе
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      const token = TokenUtils.getToken();
      const store = getStore();
      const companyId = store?.getters?.currentCompanyId || "1";

      console.log('[Echo] Auth:', channel.name);

      fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Company-ID': companyId.toString(),
        },
        body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('[Echo] Auth OK:', channel.name);
          callback(null, data);
        })
        .catch(err => {
          console.error('[Echo] Auth ERROR:', err.message);
          callback(err, null);
        });
    },
  }),
});

// Логи подключения (работают и в production)
const pusher = echo.connector?.pusher;
if (pusher) {
  pusher.connection.bind('connecting', () => console.log('[Echo] Connecting...'));
  pusher.connection.bind('connected', () => console.log('[Echo] ✅ Connected!'));
  pusher.connection.bind('disconnected', () => console.log('[Echo] Disconnected'));
  pusher.connection.bind('unavailable', () => console.error('[Echo] ❌ Server unavailable'));
  pusher.connection.bind('failed', () => console.error('[Echo] ❌ Connection failed'));
  pusher.connection.bind('error', (err) => {
    if (err?.message?.includes('message port closed')) return;
    console.error('[Echo] Error:', err);
  });
}

export default echo;
