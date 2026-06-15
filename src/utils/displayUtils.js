export function stripPositionFromFullName(full) {
  const normalized = String(full);
  if (!normalized) return '';
  return normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getClientDisplayName(client) {
  if (!client) return '';
  const clientType = client.clientType ?? client.client_type;
  if (clientType === 'employee' || clientType === 'investor') {
    const employeeName = client.employee?.name ?? '';
    const employeeSurname = client.employee?.surname ?? '';
    const employeeFullName = [employeeName, employeeSurname].filter(Boolean).join(' ').trim();
    if (employeeFullName) {
      return employeeFullName;
    }
    return (client.firstName ?? '').trim();
  }
  const firstName = client.firstName ?? client.first_name ?? '';
  const lastName = client.lastName ?? client.last_name ?? '';
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function getClientDisplayPosition(client) {
  if (!client) return '';
  const clientType = client.clientType ?? client.client_type;
  if (clientType === 'employee' || clientType === 'investor') {
    return client.employee?.position ?? client.position ?? '';
  }
  return client.position ?? '';
}

export function getUserDisplayName(user) {
  if (!user) return '';
  const displayName = user.displayName?.trim?.();
  if (displayName) {
    return displayName;
  }
  const name = user.name ?? user.firstName ?? '';
  const surname = user.surname ?? user.lastName ?? '';
  return [name, surname].filter(Boolean).join(' ').trim();
}

/**
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function getUserInitials(user) {
  if (!user) {
    return '';
  }
  const name = String(user.name ?? user.firstName ?? '').trim();
  const surname = String(user.surname ?? user.lastName ?? '').trim();
  if (name && surname) {
    return `${name[0]}${surname[0]}`.toUpperCase();
  }
  const full = getUserDisplayName(user);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return '';
}

export function getUserPosition(user) {
  if (!user) return '';
  return user.position ?? '';
}
