export function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  return `${import.meta.env.VITE_APP_BASE_URL}/storage/${imagePath}`;
}

/**
 * Creates an array of DTO instances from API response array.
 * Automatically filters out null/undefined/falsy values.
 * @param {Array} dataArray - Array of data objects from API.
 * @param {Function} fromApiMethod - Function to convert single data object to DTO.
 * @returns {Array} Array of DTO instances.
 */
export function createFromApiArray(dataArray, fromApiMethod) {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(data => fromApiMethod(data)).filter(Boolean);
}

export function getUserIdsFromArray(users) {
  return users?.map(user => user.id.toString()) || [];
}

export function createProductsHtmlList(products, getQuantityFn = null, maxItems = null) {
  if (!products?.length) return "";
  const displayProducts = (maxItems != null && maxItems > 0) ? products.slice(0, maxItems) : products;
  const hasMore = (maxItems != null && maxItems > 0) && products.length > maxItems;
  let res = "<ul>";
  displayProducts.forEach((product) => {
    res += `<li style="display: flex; align-items: center; gap: 10px;">`;
    if (product.productImage && product.imgUrl) {
      res += `<img src="${product.imgUrl()}" alt="" width="20px" class="rounded">`;
    }
    const quantity = getQuantityFn ? getQuantityFn(product.quantity) : product.quantity;
    const unitName = product.unitShortName || product.unitName || '';
    const productName = product.productName || '';
    res += `${productName} - ${quantity}${unitName}</li>`;
  });
  if (hasMore) {
    res += `<li style="color: #666; font-style: italic;">... и еще ${products.length - maxItems}</li>`;
  }
  res += "</ul>";
  return res;
}

export function createProductsTooltipList(products, getQuantityFn = null, getUnitName = null) {
  if (!products?.length) return "";
  if (products.length === 1) {
    const product = products[0];
    const quantity = getQuantityFn ? getQuantityFn(product.quantity) : product.quantity;
    const unitName = getUnitName ? getUnitName(product) : (product.unitShortName || product.unitName || '');
    return `<span>${product.productName} - ${quantity}${unitName}</span>`;
  }
  const tooltip = products
    .map(product => {
      const quantity = getQuantityFn ? getQuantityFn(product.quantity) : product.quantity;
      const unitName = getUnitName ? getUnitName(product) : (product.unitShortName || product.unitName || '');
      return `${product.productName} - ${quantity}${unitName}`;
    })
    .join('\n');
  const first = products[0];
  const firstQuantity = getQuantityFn ? getQuantityFn(first.quantity) : first.quantity;
  const firstUnitName = getUnitName ? getUnitName(first) : (first.unitShortName || first.unitName || '');
  return `<span title="${tooltip}">${first.productName} - ${firstQuantity}${firstUnitName} ...</span>`;
}

export function formatAmountWithColor(amount, options = {}) {
  const {
    positiveColor = "text-[#5CB85C]",
    negativeColor = "text-[#EE4F47]",
    showSign = true,
    formatFn = (val) => Math.abs(val).toFixed(2),
    currencySymbol = '',
    className = "font-semibold"
  } = options;
  
  const val = parseFloat(amount);
  const colorClass = val >= 0 ? positiveColor : negativeColor;
  const sign = showSign ? (val >= 0 ? "+" : "-") : "";
  const formatted = formatFn(val);
  const currency = currencySymbol ? ` ${currencySymbol}` : '';
  
  return `<span class="${colorClass} ${className}">${sign}${formatted}${currency}</span>`;
}

export function formatAmountWithStyle(amount, currencyCode = '', formatFn = null) {
  const val = parseFloat(amount);
  const color = val >= 0 ? "#EE4F47" : "#5CB85C";
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  const currency = currencyCode || '';
  return `<span style="color:${color};font-weight:bold">${formatted} ${currency}</span>`;
}

export function formatAmountWithSignAndColor(amount, currencyCode = '', formatFn = null, isDebt = false) {
  const val = parseFloat(amount);
  const currencySymbol = currencyCode || '';
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  
  if (isDebt) {
    return `<span class="text-[#EE4F47] font-semibold">+${formatted} ${currencySymbol}</span>`;
  }
  return `<span class="text-[#5CB85C] font-semibold">-${formatted} ${currencySymbol}</span>`;
}

export function formatAmountSimple(amount, currencyCode = '', formatFn = null) {
  const val = parseFloat(amount);
  const currencySymbol = currencyCode || '';
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  return `<span class="text-[#5CB85C] font-semibold">${formatted} ${currencySymbol}</span>`;
}

/**
 * Normalizes a number value, converting it to a number or returning undefined.
 * @param {any} value - The value to normalize.
 * @returns {number|undefined} Normalized number or undefined if invalid.
 */
export function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Normalizes a boolean value from various formats.
 * @param {any} value - The value to normalize.
 * @param {boolean} fallback - Default value if value is null/undefined.
 * @returns {boolean} Normalized boolean value.
 */
export function normalizeBoolean(value, fallback = true) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    if (value === "0") return false;
    if (value === "1") return true;
    return value.toLowerCase() === "true";
  }
  return fallback;
}

