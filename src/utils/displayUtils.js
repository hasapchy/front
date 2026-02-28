export function stripPositionFromFullName(full) {
  if (!full || typeof full !== 'string') return '';
  return full.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getClientDisplayName(client) {
  if (!client) return '';
  if (typeof client.displayName === 'function') return client.displayName();
  if (typeof client.fullName === 'function') {
    return stripPositionFromFullName(client.fullName());
  }
  const firstName = client.firstName ?? client.first_name ?? '';
  const lastName = client.lastName ?? client.last_name ?? '';
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function getClientDisplayPosition(client) {
  if (!client) return '';
  if (typeof client.displayPosition === 'function') return client.displayPosition();
  return client.position ?? client.employee?.position ?? '';
}

export function getUserDisplayName(user) {
  if (!user) return '';
  if (typeof user.displayName === 'function') return user.displayName();
  if (typeof user.fullName === 'function') {
    return stripPositionFromFullName(user.fullName());
  }
  const name = user.name ?? '';
  const surname = user.surname ?? '';
  return [name, surname].filter(Boolean).join(' ').trim();
}

export function getUserPosition(user) {
  if (!user) return '';
  return user.position ?? '';
}
