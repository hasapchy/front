export function isSimpleWorkerOnly(user) {
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

const baseUrl = () => import.meta.env.VITE_APP_BASE_URL || '';

export function getUserPhotoSrc(user) {
  if (!user) return '';
  if (user.photoUrl && typeof user.photoUrl === 'function') {
    return user.photoUrl();
  }
  if (user.photo) {
    if (user.photo.startsWith('http://') || user.photo.startsWith('https://')) {
      return user.photo;
    }
    return `${baseUrl()}/storage/${user.photo}`;
  }
  return '';
}

export function getStoragePhotoUrl(path) {
  if (!path) return '';
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  return `${baseUrl()}/storage/${path}`;
}

