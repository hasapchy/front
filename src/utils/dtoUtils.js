export function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  return `${import.meta.env.VITE_APP_BASE_URL}/storage/${imagePath}`;
}

export function createFromApiArray(dataArray, fromApiMethod) {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(data => fromApiMethod(data));
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

export function formatAmountWithStyle(amount, currencySymbol = '', formatFn = null) {
  const val = parseFloat(amount);
  const color = val >= 0 ? "#EE4F47" : "#5CB85C";
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  const currency = currencySymbol || '';
  return `<span style="color:${color};font-weight:bold">${formatted} ${currency}</span>`;
}

export function formatAmountWithSignAndColor(amount, currencySymbol = '', formatFn = null, isDebt = false) {
  const val = parseFloat(amount);
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  
  if (isDebt) {
    return `<span class="text-[#EE4F47] font-semibold">+${formatted} ${currencySymbol}</span>`;
  }
  return `<span class="text-[#5CB85C] font-semibold">-${formatted} ${currencySymbol}</span>`;
}

export function formatAmountSimple(amount, currencySymbol = '', formatFn = null) {
  const val = parseFloat(amount);
  const formatted = formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2);
  return `<span class="text-[#5CB85C] font-semibold">${formatted} ${currencySymbol}</span>`;
}

