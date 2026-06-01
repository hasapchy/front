import echo from "@/services/echo";
import { getAuthSessionId } from "@/utils/authSessionStorage";
import { forceAuthLogout } from "@/utils/forceAuthLogout";

let channel = null;
let boundUserId = null;

function unsubscribe() {
  if (channel === null || boundUserId === null) {
    return;
  }
  try {
    channel.stopListening(".user.credentials.revoked");
    channel.stopListening(".user.session.revoked");
    echo.leave(`App.Models.User.${boundUserId}`);
  } catch {
    void 0;
  }
  channel = null;
  boundUserId = null;
}

function subscribe(userId) {
  unsubscribe();
  if (!userId) {
    return;
  }

  boundUserId = Number(userId);
  channel = echo.private(`App.Models.User.${boundUserId}`);
  channel.listen(".user.credentials.revoked", () => {
    forceAuthLogout({ subtitleKey: "sessionEndedPasswordChanged" });
  });
  channel.listen(".user.session.revoked", (payload) => {
    const revokedId = Number(payload?.session_id);
    if (getAuthSessionId() === revokedId) {
      forceAuthLogout({ subtitleKey: "sessionRevoked" });
    }
  });
}

export function startUserCredentialsRealtime(store) {
  return store.watch(
    (state) => state.user?.id ?? null,
    (id) => subscribe(id),
    { immediate: true },
  );
}
