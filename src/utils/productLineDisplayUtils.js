import { formatNumberForDisplay } from '@/utils/numberUtils';
import { formatStockAlternateSummary } from '@/utils/stockByUnitsDisplay';

/**
 * @param {object|null|undefined} product
 * @returns {'product'|'service'}
 */
export function resolveProductTypeName(product) {
  if (typeof product?.typeName === 'function') {
    return product.typeName.call(product);
  }
  const typeName = product?.typeName;
  if (typeName === 'product' || typeName === 'service') {
    return typeName;
  }
  return Number(product?.type) === 1 ? 'product' : 'service';
}

/**
 * @param {object|null|undefined} product
 * @returns {string}
 */
export function resolveRetailPriceFormatted(product) {
  if (typeof product?.retailPriceFormatted === 'function') {
    return product.retailPriceFormatted.call(product);
  }
  const price = parseFloat(
    product?.retailPrice ?? product?.purchasePrice ?? product?.price ?? 0,
  );
  return Number.isNaN(price) ? '' : formatNumberForDisplay(price, false);
}

/**
 * @param {object|null|undefined} product
 * @param {number} [max=2]
 * @returns {string}
 */
export function resolveStockAlternateSummary(product, max = 2) {
  if (typeof product?.stockAlternateSummary === 'function') {
    return product.stockAlternateSummary.call(product, max);
  }
  const rows = product?.stockByUnits;
  return formatStockAlternateSummary(Array.isArray(rows) ? rows : [], max);
}

/**
 * @param {object} line
 * @param {(id: number) => string} getUnitShortName
 * @returns {string}
 */
export function resolveProductLineUnitLabel(line, getUnitShortName) {
  const fromLine = line?.unitShortName ?? line?.unit_short_name;
  if (fromLine) {
    return String(fromLine).trim();
  }
  const unitId = line?.unitId ?? line?.unit_id;
  if (unitId != null && unitId !== '' && getUnitShortName) {
    const fromStore = getUnitShortName(Number(unitId));
    if (fromStore) {
      return String(fromStore).trim();
    }
  }
  return '—';
}

/**
 * @param {object} product
 * @returns {string}
 */
export function defaultProductLineIconHtml(product) {
  if (product?.isTempProduct) {
    return '<i class="fas fa-bolt text-[#EAB308]"></i>';
  }
  const isProduct = product?.type == 1;
  return isProduct
    ? '<i class="fas fa-box text-[#3571A4]"></i>'
    : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
}
