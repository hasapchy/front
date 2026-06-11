export function stripPositionFromFullName(full) {
  const normalized = String(full);
  if (!normalized) return '';
  return normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getClientDisplayName(client) {
  if (!client) return '';
  const displayName = client.displayName?.trim?.();
  if (displayName) {
    return displayName;
  }
  const employeeName = client.employee?.name ?? '';
  const employeeSurname = client.employee?.surname ?? '';
  const employeeFullName = [employeeName, employeeSurname].filter(Boolean).join(' ').trim();
  if (employeeFullName) {
    return employeeFullName;
  }
  const firstName = client.firstName ?? '';
  const lastName = client.lastName ?? '';
  const fromNames = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fromNames) {
    return fromNames;
  }
  const fullName = client.fullName?.trim?.();
  if (fullName) {
    return stripPositionFromFullName(fullName);
  }
  return (client.clientName ?? '').trim();
}

export function getClientDisplayPosition(client) {
  if (!client) return '';
  const displayPosition = typeof client.displayPosition === 'function'
    ? client.displayPosition()
    : client.displayPosition;
  return displayPosition ?? client.position ?? client.employee?.position ?? '';
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
