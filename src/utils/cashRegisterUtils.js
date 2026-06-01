import i18n from '@/i18n';
import {
  getCashRegisterUserColorPreference,
  isValidCashRegisterHex,
  resolveCashRegisterId,
} from '@/utils/cashRegisterUserColors';

export function getCashRegisterTypeLabel(isCash, t = null) {
  const translate = t ?? i18n.global.t.bind(i18n.global);
  return isCash ? translate('cashRegisterTypeCash') : translate('cashRegisterTypeNonCash');
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
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (normalizedName) {
    return normalizedName;
  }

  const normalizedType = normalizeCashRegisterType(isCash);
  if (normalizedType !== null) {
    return getCashRegisterTypeLabel(normalizedType, t);
  }

  return '';
}

export function formatCashRegisterDisplay(displayName, currencySymbol = null) {
  const label = typeof displayName === 'string' ? displayName.trim() : '';
  if (!label) {
    return '';
  }
  const code = typeof currencySymbol === 'string' ? currencySymbol.trim() : '';
  return code ? `${label} (${code})` : label;
}

export function getCashRegisterSelectPrimaryLabel(cash, t = null) {
  if (!cash || typeof cash !== 'object') {
    return '';
  }
  const typeLabel = getCashRegisterTypeLabel(cash.isCash, t);
  const currency = (cash.currencySymbol || '').trim();
  return currency ? `${typeLabel} ${currency}` : typeLabel;
}

export function getCashRegisterSelectSecondaryLabel(cash) {
  if (!cash || typeof cash !== 'object') {
    return '';
  }
  return (cash.displayName || cash.name || '').trim();
}

export function getCashRegisterSelectLabel(cash, t = null) {
  if (!cash || typeof cash !== 'object') {
    return '';
  }
  const typeLabel = getCashRegisterTypeLabel(cash.isCash, t);
  const name = (cash.displayName || cash.name || '').trim();
  const currency = (cash.currencySymbol || '').trim();
  const title = name ? `${typeLabel} ${name}` : typeLabel;
  return currency ? `${title} (${currency})` : title;
}

export function normalizeCashRegisterModelValue(value) {
  if (value == null || value === '') {
    return '';
  }
  const id = Number(value);
  return Number.isNaN(id) ? '' : id;
}

export const CASH_REGISTER_DEFAULT_ACCENT = '#3571A4';

export function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function getCashRegisterSystemAccentHex(source) {
  let raw = source;
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    raw = source.color ?? source.cashColor ?? source.cash_color;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^#[0-9A-Fa-f]{6}$/i.test(trimmed)) {
      return trimmed;
    }
  }
  return CASH_REGISTER_DEFAULT_ACCENT;
}

export function getCashRegisterAccentHex(source) {
  const systemHex = getCashRegisterSystemAccentHex(source);
  const cashRegisterId = resolveCashRegisterId(source);
  if (cashRegisterId == null) {
    return systemHex;
  }
  const pref = getCashRegisterUserColorPreference(cashRegisterId);
  if (pref?.mode === 'custom' && isValidCashRegisterHex(pref.color)) {
    return pref.color.trim();
  }
  return systemHex;
}

function resolveCashRegisterIconClass(item) {
  if (!item || typeof item !== 'object') {
    return 'fas fa-cash-register';
  }
  const raw = [item.icon, item.cashIcon, item.cash_icon].find((v) => typeof v === 'string' && v.trim());
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/"/g, '');
  }
  return 'fas fa-cash-register';
}

export function getCashRegisterShellIconClass(item) {
  return resolveCashRegisterIconClass(item);
}

function buildCashRegisterAccentBadgeHtml(item, boxClass, iconExtraClass) {
  const hex = getCashRegisterAccentHex(item);
  const iconClass = resolveCashRegisterIconClass(item);
  return (
    `<span class="${boxClass}" style="background-color: color-mix(in srgb, ${hex} 22%, transparent)">` +
    `<i class="${iconClass} ${iconExtraClass}" style="color: ${hex}"></i></span>`
  );
}

export function buildCashRegisterTitlePrefixHtml(item) {
  return buildCashRegisterAccentBadgeHtml(
    item,
    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mr-1.5',
    'text-sm'
  );
}

export function buildCashRegisterIconBadgeOnlyHtml(item, preset = 'table') {
  if (preset === 'table') {
    return buildCashRegisterAccentBadgeHtml(
      item,
      'inline-flex h-7 w-7 items-center justify-center rounded-lg',
      'text-xs'
    );
  }
  return buildCashRegisterAccentBadgeHtml(
    item,
    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
    'text-xs leading-none'
  );
}

export function buildCashRegisterRowInlineHtml(row, displayText) {
  const badge = buildCashRegisterIconBadgeOnlyHtml(row, 'row');
  const safeText = escapeHtmlText(displayText);
  return (
    `<span class="inline-flex min-w-0 max-w-full items-center gap-1.5">` +
    badge +
    `<span class="min-w-0 truncate">${safeText}</span></span>`
  );
}
