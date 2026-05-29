import { getStore } from '@/store/storeManager';
import { EXCHANGE_RATE_DECIMAL_PLACES } from '@/constants/exchangeRateDecimals';

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

    if (decimals >= 0) {
      decimalPart = decimalPart.substring(0, decimals);
    }

    if (decimals === 0) {
      result = integerPart;
    } else if (showDecimals && decimals > 0) {
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

export function formatCurrency(value, currencySymbol = '', decimals, showDecimals = false) {
  const formattedNumber = formatNumber(value, decimals, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
}

function truncateToDecimals(value, decimals) {
  if (!Number.isFinite(value) || decimals < 0) {
    return value;
  }
  if (decimals === 0) {
    return Math.floor(Math.abs(value)) * (value >= 0 ? 1 : -1);
  }
  const mult = Math.pow(10, decimals);
  return Math.floor(Math.abs(value) * mult) / mult * (value >= 0 ? 1 : -1);
}

function roundWithPolicy(value, policy) {
  let num = parseFloat(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  const { active, decimals, direction, threshold } = policy;

  if (!active) {
    return truncateToDecimals(num, decimals);
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
 * @param {'default'|'order'|'contract'|'warehouse'} scope
 */
export function getAmountRoundingPolicy(scope = 'default') {
  const g = appGetters();
  let active = g.roundingEnabled;
  if (scope === 'order') {
    active = g.roundingOrdersEnabled;
  } else if (scope === 'contract') {
    active = g.roundingContractsEnabled;
  } else if (scope === 'warehouse') {
    active = g.roundingWarehouseEnabled;
  }

  return {
    active: !!active,
    decimals: g.roundingDecimals,
    direction: g.roundingDirection,
    threshold: g.roundingCustomThreshold,
  };
}

export function roundValue(value) {
  return roundWithSettings(
    value,
    'roundingDecimals',
    'roundingEnabled',
    'roundingDirection',
    'roundingCustomThreshold',
  );
}

export function getAmountInputDecimalsForScope(scope = 'default') {
  const policy = getAmountRoundingPolicy(scope);
  if (policy.active) {
    return policy.decimals;
  }
  return getAmountDisplayDecimals();
}

export function isAmountRoundingEnabledForScope(scope = 'default') {
  return getAmountRoundingPolicy(scope).active;
}

export function getAmountDisplayDecimals() {
  return appGetters().displayDecimals;
}

export function truncateValueForDisplay(value, decimals) {
  const d = decimals == null ? getAmountDisplayDecimals() : decimals;
  const num = parseFloat(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return truncateToDecimals(num, d);
}

export function roundValueForScope(value, scope = 'default') {
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
  const d = decimals == null ? appGetters().roundingDecimals : decimals;
  return formatNumber(value, d, false);
}

export function parseDecimalInput(raw) {
  const normalized = String(raw ?? '').replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatNumberForDisplay(value, showDecimals = false) {
  const decimals = getAmountDisplayDecimals();
  const truncated = truncateValueForDisplay(value, decimals);
  return formatNumber(truncated, decimals, showDecimals);
}

export function formatCurrencyForDisplay(value, currencySymbol = '', showDecimals = false) {
  const formattedNumber = formatNumberForDisplay(value, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
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
