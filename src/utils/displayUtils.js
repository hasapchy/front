export function stripPositionFromFullName(full) {
  const normalized = String(full );
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

export function getUserPosition(user) {
  if (!user) return '';
  return user.position ?? '';
}
