const AUTH_SESSION_ID_KEY = "hasap_auth_session_id";

export function setAuthSessionId(id) {
  if (id === null || id === undefined || id === "") {
    sessionStorage.removeItem(AUTH_SESSION_ID_KEY);
    return;
  }
  sessionStorage.setItem(AUTH_SESSION_ID_KEY, String(id));
}

export function getAuthSessionId() {
  const raw = sessionStorage.getItem(AUTH_SESSION_ID_KEY);
  if (raw === null || raw === "") {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearAuthSessionId() {
  sessionStorage.removeItem(AUTH_SESSION_ID_KEY);
}
