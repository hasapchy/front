import { getStore } from '@/store/storeManager';
import { EXCHANGE_RATE_DECIMAL_PLACES } from '@/constants/exchangeRateDecimals';
import {
  DEFAULT_AMOUNT_ROUNDING_SCOPE,
  findRoundingModuleByScope,
} from '@/constants/roundingModules';

function appGetters() {
  return getStore().getters;
}

export function formatNumber(value, decimals, showDecimals = false) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  let num = parseFloat(value);

  if (isNaN(num)) {
    return '0';
  }

  const numStr = num.toString();
  const decimalIndex = numStr.indexOf('.');

  let result;
  if (decimalIndex !== -1) {
    const integerPart = numStr.substring(0, decimalIndex);
    let decimalPart = numStr.substring(decimalIndex + 1);

    if (showDecimals && decimals > 0) {
      if (decimalPart.length > decimals) {
        decimalPart = decimalPart.substring(0, decimals);
      }
      while (decimalPart.length < decimals) {
        decimalPart += '0';
      }
      result = `${integerPart}.${decimalPart}`;
    } else {
      if (decimalPart.match(/^0+$/)) {
        result = integerPart;
      } else if (decimalPart.length > 0) {
        result = `${integerPart}.${decimalPart}`;
      } else {
        result = integerPart;
      }
    }
  } else {
    if (decimals === 0) {
      result = numStr;
    } else if (showDecimals && decimals > 0) {
      result = `${numStr}.${'0'.repeat(decimals)}`;
    } else {
      result = numStr;
    }
  }

  const parts = result.split('.');

  const isNegative = parts[0].startsWith('-');
  if (isNegative) {
    parts[0] = parts[0].substring(1);
  }

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (isNegative) {
    parts[0] = '-' + parts[0];
  }

  return parts.join('.');
}

export function formatCurrency(value, currencyCode = '', decimals, showDecimals = false) {
  const formattedNumber = formatNumber(value, decimals, showDecimals);
  return currencyCode ? `${formattedNumber} ${currencyCode}` : formattedNumber;
}

export function multiplyWithoutFloatNoise(left, right) {
  const a = Number(left);
  const b = Number(right);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return 0;
  }

  return Number((a * b).toFixed(10));
}

function roundWithPolicy(value, policy) {
  let num = parseFloat(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  const { active, decimals, direction, threshold } = policy;

  if (!active) {
    return num;
  }

  if (decimals >= 0) {
    const factor = Math.pow(10, decimals);

    if (direction === 'up') {
      num = Math.ceil(num * factor) / factor;
    } else if (direction === 'down') {
      num = Math.floor(num * factor) / factor;
    } else if (direction === 'custom') {
      const t =
        threshold !== null && threshold !== undefined && threshold !== ''
          ? Number(threshold)
          : null;
      if (t !== null && !Number.isNaN(t)) {
        const multiplied = num * factor;
        const fraction = Math.abs(multiplied) - Math.floor(Math.abs(multiplied));
        if (fraction >= t) {
          num = (num >= 0 ? Math.ceil(multiplied) : Math.floor(multiplied)) / factor;
        } else {
          num = Number(num.toFixed(decimals));
        }
      } else {
        num = Math.round(num * factor) / factor;
      }
    } else {
      num = Math.round(num * factor) / factor;
    }
  }

  return num;
}

function roundWithSettings(value, decimalsKey, enabledKey, directionKey, thresholdKey) {
  const g = appGetters();
  return roundWithPolicy(value, {
    active: g[enabledKey],
    decimals: g[decimalsKey],
    direction: g[directionKey],
    threshold: g[thresholdKey],
  });
}

/**
 * @param {'order'|'contract'|'warehouse'|'transaction'} scope
 */
export function getAmountRoundingPolicy(scope = DEFAULT_AMOUNT_ROUNDING_SCOPE) {
  const g = appGetters();
  const mod = findRoundingModuleByScope(scope);

  if (!mod) {
    return getAmountRoundingPolicy(DEFAULT_AMOUNT_ROUNDING_SCOPE);
  }

  return {
    active: !!g[mod.enabledFormKey],
    decimals: g[mod.decimalsFormKey],
    direction: g.roundingDirection,
    threshold: g.roundingCustomThreshold,
  };
}

/**
 * @param {number} value
 * @param {'order'|'contract'|'warehouse'|'transaction'} [scope]
 * @returns {number}
 */
export function roundValue(value, scope = DEFAULT_AMOUNT_ROUNDING_SCOPE) {
  return roundDocumentTotalForScope(value, scope);
}

export function getAmountDisplayDecimals() {
  return appGetters().displayDecimals;
}

/**
 * @param {number} value
 * @param {'order'|'contract'|'warehouse'|'transaction'} scope
 * @returns {number}
 */
export function roundDocumentTotalForScope(value, scope = DEFAULT_AMOUNT_ROUNDING_SCOPE) {
  return roundWithPolicy(value, getAmountRoundingPolicy(scope));
}

export function roundQuantityValue(value) {
  return roundWithSettings(
    value,
    'roundingQuantityDecimals',
    'roundingQuantityEnabled',
    'roundingQuantityDirection',
    'roundingQuantityCustomThreshold',
  );
}

export function formatQuantity(value) {
  const d = appGetters().roundingQuantityDecimals;
  const num = parseFloat(value);
  const normalized = Number.isFinite(num) ? num : 0;
  return formatNumber(normalized, d, false);
}

export function formatNumberForInput(value, decimals) {
  const d = decimals == null ? getAmountDisplayDecimals() : decimals;
  return formatNumber(value, d, false);
}

export function parseDecimalInput(raw) {
  const normalized = String(raw ?? '').replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatNumberForDisplay(value, showDecimals = false) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) {
    return formatNumber(0, getAmountDisplayDecimals(), showDecimals);
  }
  const decimals = getAmountDisplayDecimals();
  return formatNumber(num, decimals, showDecimals);
}

export function formatCurrencyForDisplay(value, currencyCode = '', showDecimals = false) {
  const formattedNumber = formatNumberForDisplay(value, showDecimals);
  return currencyCode ? `${formattedNumber} ${currencyCode}` : formattedNumber;
}

export function normalizeExchangeRateValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n.toFixed(EXCHANGE_RATE_DECIMAL_PLACES);
}

export function formatExchangeRateForDisplay(value) {
  return normalizeExchangeRateValue(value) ?? '';
}

export function getStepForDecimals(decimals) {
  if (decimals === 0) {
    return '1';
  }
  return `0.${'0'.repeat(decimals - 1)}1`;
}
