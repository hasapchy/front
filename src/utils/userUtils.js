export function isBasementWorkerOnly(user) {
  if (!user || !user.roles) return false;
  return user.roles.includes('basement_worker') && !user.roles.includes('admin');
}

export function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

