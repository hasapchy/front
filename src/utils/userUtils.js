export function isBasementWorkerOnly(user) {
  if (!user || !user.roles) return false;
  return user.roles.includes('basement_worker') && !user.roles.includes('admin');
}

export function getUserFromStorage() {
  try {
    const store = require('@/store').default;
    return store.getters.user || null;
  } catch {
    return null;
  }
}

