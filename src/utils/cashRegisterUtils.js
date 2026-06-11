import i18n from '@/i18n';
import {
  getCashRegisterUserColorPreference,
  isValidCashRegisterHex,
  resolveCashRegisterId,
} from '@/utils/cashRegisterUserColors';

export function getCashRegisterTypeLabel(isCash, t = null) {
  const translate = t ?? i18n.global.t.bind(i18n.global);
  const normalizedType = normalizeCashRegisterBoolean(isCash, null);
  return normalizedType ? translate('cashRegisterTypeCash') : translate('cashRegisterTypeNonCash');
}

export function normalizeCashRegisterBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') {
      return true;
    }
    if (normalized === '0' || normalized === 'false') {
      return false;
    }
  }

  return fallback;
}

function normalizeCashRegisterType(isCash) {
  return normalizeCashRegisterBoolean(isCash, null);
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

export function formatCashRegisterDisplay(displayName, currencyCode = null) {
  const label = typeof displayName === 'string' ? displayName.trim() : '';
  if (!label) {
    return '';
  }
  const code = typeof currencyCode === 'string' ? currencyCode.trim() : '';
  return code ? `${label} (${code})` : label;
}

export function getCashRegisterSelectPrimaryLabel(cash, t = null) {
  if (!cash || typeof cash !== 'object') {
    return '';
  }
  const typeLabel = getCashRegisterTypeLabel(cash.isCash, t);
  const currency = (cash.currencyCode || '').trim();
  return currency ? `${typeLabel} ${currency}` : typeLabel;
}

export function getCashRegisterSelectSecondaryLabel(cash) {
  if (!cash || typeof cash !== 'object') {
    return '';
  }
  return (cash.displayName || cash.name || '').trim();
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

export function resolveCashRegisterIconSize(item) {
  if (!item || typeof item !== 'object') {
    return 'medium';
  }
  const raw = [item.iconSize, item.icon_size, item.cashIconSize, item.cash_icon_size]
    .find((v) => typeof v === 'string' && v.trim());
  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return ['small', 'medium', 'large'].includes(normalized) ? normalized : 'medium';
}

export function getCashRegisterShellIconClass(item) {
  return resolveCashRegisterIconClass(item);
}

function getBadgeClassesByIconSize(iconSize, preset = 'default') {
  if (preset === 'row') {
    if (iconSize === 'small') {
      return {
        boxClass: 'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
        iconClass: 'text-[10px] leading-none',
      };
    }
    if (iconSize === 'large') {
      return {
        boxClass: 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
        iconClass: 'text-sm leading-none',
      };
    }
    return {
      boxClass: 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
      iconClass: 'text-xs leading-none',
    };
  }

  if (iconSize === 'small') {
    return {
      boxClass: 'inline-flex h-5 w-5 items-center justify-center rounded-lg',
      iconClass: 'text-[10px] leading-none',
    };
  }
  if (iconSize === 'large') {
    return {
      boxClass: 'inline-flex h-9 w-9 items-center justify-center rounded-lg',
      iconClass: 'text-sm leading-none',
    };
  }
  return {
    boxClass: 'inline-flex h-7 w-7 items-center justify-center rounded-lg',
    iconClass: 'text-xs',
  };
}

function buildCashRegisterAccentBadgeHtml(item, boxClass, iconExtraClass) {
  const hex = getCashRegisterAccentHex(item);
  const iconClass = resolveCashRegisterIconClass(item);
  return (
    `<span class="cash-register-icon-badge ${boxClass}" style="--cash-register-accent: ${hex}">` +
    `<i class="${iconClass} ${iconExtraClass}" style="color: ${hex}"></i></span>`
  );
}

export function buildCashRegisterTitlePrefixHtml(item) {
  const iconSize = resolveCashRegisterIconSize(item);
  const classes = getBadgeClassesByIconSize(iconSize, 'default');
  return buildCashRegisterAccentBadgeHtml(item, `${classes.boxClass} mr-1.5`, classes.iconClass);
}

export function buildCashRegisterIconBadgeOnlyHtml(item, preset = 'table') {
  const iconSize = resolveCashRegisterIconSize(item);
  const classes = getBadgeClassesByIconSize(iconSize, preset === 'table' ? 'default' : 'row');
  return buildCashRegisterAccentBadgeHtml(item, classes.boxClass, classes.iconClass);
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

/**
 * @param {object|null|undefined} item
 * @param {string} displayText
 * @returns {string}
 */
export function buildCashRegisterEntityChipHtml(item, displayText) {
  const label = typeof displayText === 'string' ? displayText.trim() : '';
  if (!label) {
    return '';
  }
  const hex = getCashRegisterAccentHex(item);
  const iconClass = getCashRegisterShellIconClass(item);
  const safeText = escapeHtmlText(label);
  return (
    `<span class="entity-card__chip">` +
    `<i class="${iconClass}" aria-hidden="true" style="color: ${hex}"></i>` +
    `<span>${safeText}</span></span>`
  );
}
