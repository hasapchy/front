import { isAdmin } from './checker';

export const CLIENT_BALANCE_VIEW_PERM = 'settings_client_balance_view';
export const CLIENT_BALANCE_VIEW_OWN_PERM = 'settings_client_balance_view_own';
export const CLIENT_BALANCE_VIEW_CASH_PERM = 'settings_client_balance_view_cash';
export const CLIENT_BALANCE_VIEW_NON_CASH_PERM = 'settings_client_balance_view_non_cash';

export const CLIENT_BALANCE_TYPE_PERMS = [
  CLIENT_BALANCE_VIEW_CASH_PERM,
  CLIENT_BALANCE_VIEW_NON_CASH_PERM,
];

export const CLIENT_BALANCE_TYPE_CASH = 1;
export const CLIENT_BALANCE_TYPE_NON_CASH = 0;

/**
 * @param {string[]} permissionNames
 * @returns {number[]}
 */
export function allowedTypesFromPermissionNames(permissionNames) {
  const perms = permissionNames || [];
  const hasCash = perms.includes(CLIENT_BALANCE_VIEW_CASH_PERM);
  const hasNonCash = perms.includes(CLIENT_BALANCE_VIEW_NON_CASH_PERM);

  if (!hasCash && !hasNonCash) {
    return [CLIENT_BALANCE_TYPE_NON_CASH, CLIENT_BALANCE_TYPE_CASH];
  }

  const allowed = [];
  if (hasNonCash) {
    allowed.push(CLIENT_BALANCE_TYPE_NON_CASH);
  }
  if (hasCash) {
    allowed.push(CLIENT_BALANCE_TYPE_CASH);
  }

  return allowed;
}

/**
 * @param {import('vuex').Store} store
 * @param {number} type
 * @returns {boolean}
 */
export function canViewClientBalanceType(store, type) {
  const user = store.getters.user;
  if (isAdmin(user)) {
    return true;
  }

  const perms = store.getters.permissions || [];
  if (
    !perms.includes(CLIENT_BALANCE_VIEW_PERM) &&
    !perms.includes(CLIENT_BALANCE_VIEW_OWN_PERM)
  ) {
    return false;
  }

  return allowedTypesFromPermissionNames(perms).includes(Number(type));
}

/**
 * @param {object} user
 * @param {number} balanceType
 * @returns {boolean}
 */
export function userCanBeAssignedToClientBalance(user, balanceType) {
  if (!user || isAdmin(user)) {
    return Boolean(user);
  }

  const perms = user.permissions || [];
  if (!perms.includes(CLIENT_BALANCE_VIEW_PERM)) {
    return false;
  }

  return allowedTypesFromPermissionNames(perms).includes(Number(balanceType));
}
