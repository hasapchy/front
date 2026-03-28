import i18n from '@/i18n';

export function getCashRegisterTypeLabel(isCash, t = null) {
  const translate = t ?? i18n.global.t.bind(i18n.global);
  return isCash ? translate('cash') : translate('cashless');
}

function normalizeCashRegisterType(isCash) {
  if (typeof isCash === 'boolean') {
    return isCash;
  }

  if (typeof isCash === 'number') {
    return isCash === 1;
  }

  if (typeof isCash === 'string') {
    const normalized = isCash.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') {
      return true;
    }
    if (normalized === '0' || normalized === 'false') {
      return false;
    }
  }

  return null;
}

export function getCashRegisterDisplayNameByParts(name, isCash = null, t = null) {
  const normalizedType = normalizeCashRegisterType(isCash);
  if (normalizedType !== null) {
    return getCashRegisterTypeLabel(normalizedType, t);
  }

  const normalizedName = typeof name === 'string' ? name.trim() : '';
  return normalizedName;
}

export function formatCashRegisterDisplay(displayName, currencySymbol = null) {
  const label = typeof displayName === 'string' ? displayName.trim() : '';
  if (!label) {
    return '';
  }
  const symbol = typeof currencySymbol === 'string' ? currencySymbol.trim() : '';
  return symbol ? `${label} (${symbol})` : label;
}
