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
