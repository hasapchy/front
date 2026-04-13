import { getStore } from '@/store/storeManager';

function appGetters() {
  return getStore().getters;
}

export function formatNumber(value, decimals = null, showDecimals = false) {
  if (decimals === null || decimals === undefined) {
    decimals = appGetters().roundingDecimals;
  }
  
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

export function formatCurrency(value, currencySymbol = '', decimals = null, showDecimals = false) {
  const formattedNumber = formatNumber(value, decimals, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
}

export function formatQuantity(value) {
  const d = appGetters().roundingQuantityDecimals;
  const num = parseFloat(value);
  return (Number.isFinite(num) ? num : 0).toFixed(d);
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

function roundWithSettings(value, decimalsKey, enabledKey, directionKey, thresholdKey) {
  const g = appGetters();
  const decimals = g[decimalsKey];
  const roundingEnabled = g[enabledKey];
  const direction = g[directionKey];
  const threshold = g[thresholdKey];

  let num = parseFloat(value);
  if (isNaN(num)) return 0;

  if (!roundingEnabled) {
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

export function roundValue(value) {
  return roundWithSettings(
    value,
    'roundingDecimals',
    'roundingEnabled',
    'roundingDirection',
    'roundingCustomThreshold'
  );
}

export function roundQuantityValue(value) {
  return roundWithSettings(
    value,
    'roundingQuantityDecimals',
    'roundingQuantityEnabled',
    'roundingQuantityDirection',
    'roundingQuantityCustomThreshold'
  );
}

export function formatNumberWithRounding(value, showDecimals = false) {
  return formatNumber(value, appGetters().roundingDecimals, showDecimals);
}

export function formatCurrencyWithRounding(value, currencySymbol = '', showDecimals = false) {
  const formattedNumber = formatNumberWithRounding(value, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
}

export function getStepForDecimals(decimals) {
  if (decimals === 0) {
    return '1';
  }
  return `0.${'0'.repeat(decimals - 1)}1`;
}