/**
 * @param {Record<string, unknown>} source
 * @param {string[]} keys
 * @returns {Record<string, unknown>}
 */
export function pickFilterPresetValues(source, keys) {
  if (!source || !Array.isArray(keys)) {
    return {};
  }
  const result = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  });
  return result;
}

/**
 * @param {Record<string, unknown>} values
 * @param {string[]} keys
 * @returns {Record<string, unknown>}
 */
export function normalizeFilterPresetValues(values, keys) {
  const normalized = { ...values };
  if (!Array.isArray(keys)) {
    return normalized;
  }
  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(normalized, key)) {
      return;
    }
    const value = normalized[key];
    if (value === null || value === undefined) {
      if (key === 'startDate' || key === 'endDate') {
        normalized[key] = null;
        return;
      }
      if (key === 'categoryFilter') {
        normalized[key] = [];
        return;
      }
      if (key === 'paidOrdersFilter') {
        normalized[key] = false;
        return;
      }
      if (key === 'debtFilter') {
        normalized[key] = 'all';
        return;
      }
      normalized[key] = '';
      return;
    }
    if (key === 'categoryFilter') {
      normalized[key] = Array.isArray(value) ? value : [];
      return;
    }
    if (key === 'paidOrdersFilter') {
      normalized[key] = Boolean(value);
      return;
    }
    if (key === 'typeFilter') {
      if (value === '' || value === null || value === undefined) {
        normalized[key] = '';
      } else {
        normalized[key] = Number(value);
      }
      return;
    }
    if (key === 'startDate' || key === 'endDate') {
      normalized[key] = value || null;
      return;
    }
    if (typeof value === 'number') {
      normalized[key] = String(value);
    }
  });
  return normalized;
}

/**
 * @param {Record<string, unknown>} current
 * @param {Record<string, unknown>} saved
 * @param {string[]} keys
 * @returns {boolean}
 */
export function areFilterPresetValuesEqual(current, saved, keys) {
  if (!Array.isArray(keys)) {
    return true;
  }
  const left = normalizeFilterPresetValues({ ...(current || {}) }, keys);
  const right = normalizeFilterPresetValues({ ...(saved || {}) }, keys);
  return keys.every((key) => {
    const a = left[key];
    const b = right[key];
    if (Array.isArray(a) || Array.isArray(b)) {
      return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
    }
    if (typeof a === 'boolean' || typeof b === 'boolean') {
      return Boolean(a) === Boolean(b);
    }
    return String(a ?? '') === String(b ?? '');
  });
}
