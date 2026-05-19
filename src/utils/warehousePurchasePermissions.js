export function canWarehousePurchase(getters, action) {
  const base = 'warehouse_purchases';
  const legacy = `${base}_${action}`;
  const scopedAll = `${base}_${action}_all`;
  const scopedOwn = `${base}_${action}_own`;

  return getters.hasPermission(legacy)
    || getters.hasPermission(scopedAll)
    || getters.hasPermission(scopedOwn);
}
