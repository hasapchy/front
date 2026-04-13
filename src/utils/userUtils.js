import { STORE_CONFIG } from "@/store/config";

export function isSimpleUserAccount(user) {
  if (!user) return false;
  const isAdmin =
    user.is_admin === true ||
    user.isAdmin === true ||
    (Array.isArray(user.roles) && user.roles.includes("admin"));
  if (isAdmin) return false;
  return Boolean(user.is_simple_user ?? user.isSimpleUser);
}

export function getUserFromStorage() {
  try {
    const userStr =
      localStorage.getItem(STORE_CONFIG.localStorageKeys.authUser) ??
      localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}
