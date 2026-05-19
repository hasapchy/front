import { dt } from "@/utils/displayI18n";
import { formatQuantity } from "@/utils/numberUtils";
import { formatLineOrigThenBaseQty } from "@/utils/warehouseLineOrigDisplay";

export function getImageUrl(imagePath) {
  if (imagePath == null || imagePath === '') {
    return null;
  }
  const normalizedPath = String(imagePath).trim();
  if (!normalizedPath || normalizedPath === 'null' || normalizedPath === 'undefined') {
    return null;
  }
  return `${import.meta.env.VITE_APP_BASE_URL}/storage/${normalizedPath}`;
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
    const quantity = getQuantityFn ? getQuantityFn(product.quantity) : formatQuantity(product.quantity);
    const unitName = product.unitShortName ;
    const productName = product.productName ;
    const qtyLabel = formatLineOrigThenBaseQty(product) || `${quantity}${unitName ? ` ${unitName}` : ''}`;
    res += `${productName} - ${qtyLabel}</li>`;
  });
  if (hasMore) {
    res += `<li style="color: #666; font-style: italic;">${dt('dtoProductListMore', { n: products.length - maxItems })}</li>`;
  }
  res += "</ul>";
  return res;
}

export function createProductsTooltipList(products, getQuantityFn = null, getUnitName = null) {
  if (!products?.length) return "";
  const lineQty = (product) => {
    const dual = formatLineOrigThenBaseQty(product);
    if (dual) {
      return dual;
    }
    const quantity = getQuantityFn ? getQuantityFn(product.quantity) : formatQuantity(product.quantity);
    const unitName = getUnitName ? getUnitName(product) : (product.unitShortName);
    return `${quantity}${unitName ? ` ${unitName}` : ''}`;
  };
  if (products.length === 1) {
    const product = products[0];
    return `<span>${product.productName} - ${lineQty(product)}</span>`;
  }
  const tooltip = products
    .map((product) => `${product.productName} - ${lineQty(product)}`)
    .join('\n');
  const first = products[0];
  return `<span title="${tooltip}">${first.productName} - ${lineQty(first)} ...</span>`;
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
  const currency = currencySymbol ;
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

