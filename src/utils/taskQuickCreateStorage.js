const STORAGE_PREFIX = 'tasks.quickCreate.executor';

function storageKey(companyId) {
  return `${STORAGE_PREFIX}.${companyId || 'default'}`;
}

export function readLastQuickTaskExecutor(companyId) {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLastQuickTaskExecutor(companyId, user) {
  if (!user?.id) {
    return;
  }
  localStorage.setItem(storageKey(companyId), JSON.stringify({
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    position: user.position,
    photo: user.photo,
  }));
}
