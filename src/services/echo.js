import Echo from "laravel-echo";
import Pusher from "pusher-js";
import api, { APP_ORIGIN_URL } from "@/api/axiosInstance";

window.Pusher = Pusher;

const IS_PROD = import.meta.env.PROD;

const WS_HOST = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const WS_KEY = import.meta.env.VITE_REVERB_APP_KEY || "hasapchy-key";
const WS_PORT = Number(import.meta.env.VITE_REVERB_PORT) || 6001;

function broadcastingAuthOrigin() {
  const fromEnv = (APP_ORIGIN_URL || "").replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

const BROADCAST_AUTH_PATH = "/api/broadcasting/auth";
const BROADCAST_AUTH_URL = `${broadcastingAuthOrigin()}${BROADCAST_AUTH_PATH}`;

const echo = new Echo({
  broadcaster: "reverb",
  key: WS_KEY,
  wsHost: WS_HOST,
  wsPort: IS_PROD ? undefined : WS_PORT,
  wssPort: 443,
  forceTLS: IS_PROD,
  enabledTransports: IS_PROD ? ["wss"] : ["ws"],
  authEndpoint: BROADCAST_AUTH_URL,
  authorizer: (channel) => ({
    authorize: async (socketId, callback) => {
      try {
        const { data } = await api.post(
          BROADCAST_AUTH_PATH,
          { socket_id: socketId, channel_name: channel.name },
          {
            baseURL: broadcastingAuthOrigin(),
            skipCaseTransform: true,
          }
        );
        callback(null, data);
      } catch (err) {
        console.error("[Echo] Auth ERROR:", err.message);
        callback(err, null);
      }
    },
  }),
});

const pusher = echo.connector?.pusher;
if (pusher) {
  pusher.connection.bind("unavailable", () => console.error("[Echo] Server unavailable"));
  pusher.connection.bind("failed", () => console.error("[Echo] Connection failed"));
  pusher.connection.bind("error", (err) => {
    if (err?.message?.includes("message port closed")) return;
    console.error("[Echo] Error:", err);
  });
}

export default echo;
