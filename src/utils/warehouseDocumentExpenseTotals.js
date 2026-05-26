import { formatCurrencyWithRounding } from '@/utils/numberUtils';

export function transactionIsDebt(transaction) {
  return Boolean(transaction?.isDebt) || Number(transaction?.is_debt) === 1;
}

/**
 * @param {Array} list
 * @param {number|null} fixedCategoryId
 * @param {number[]} excludedCategoryIds
 */
export function formatWarehouseExpenseBucketTotals(list, fixedCategoryId = null, excludedCategoryIds = []) {
  const byCurrency = {};
  const excluded = new Set(excludedCategoryIds.map((id) => Number(id)));

  for (const t of list) {
    if (t?.isDeleted || Number(t.type) !== 0 || transactionIsDebt(t)) {
      continue;
    }
    const cid = t.categoryId != null ? Number(t.categoryId) : (t.category_id != null ? Number(t.category_id) : null);
    if (fixedCategoryId != null) {
      if (cid !== fixedCategoryId) {
        continue;
      }
    } else if (cid != null && excluded.has(cid)) {
      continue;
    }
    const amount = Math.abs(Number(t.origAmount ?? t.orig_amount) || 0);
    if (amount <= 0) {
      continue;
    }
    const key = String(t.origCurrencyId ?? t.orig_currency_id ?? '');
    const symbol = t.origCurrencySymbol ?? t.orig_currency_symbol ?? '';
    if (!byCurrency[key]) {
      byCurrency[key] = { total: 0, symbol };
    }
    byCurrency[key].total += amount;
    if (!byCurrency[key].symbol && symbol) {
      byCurrency[key].symbol = symbol;
    }
  }

  const parts = Object.values(byCurrency)
    .filter((entry) => entry.total > 0)
    .map((entry) => formatCurrencyWithRounding(entry.total, entry.symbol, true, 'warehouse'));

  return parts.length ? parts.join(' · ') : null;
}
