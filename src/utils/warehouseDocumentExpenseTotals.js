import { formatCurrencyForDisplay } from '@/utils/numberUtils';

/**
 * @param {Array} list
 * @param {number|null} fixedCategoryId
 * @param {number[]} excludedCategoryIds
 */
export function formatWarehouseExpenseBucketTotals(list, fixedCategoryId = null, excludedCategoryIds = []) {
  const byCurrency = {};
  const excluded = new Set(excludedCategoryIds.map((id) => Number(id)));

  for (const t of list) {
    if (t?.isDeleted || Number(t.type) !== 0 || Number(t.isDebt) === 1) {
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
    const key = String(t.origCurrencyId ?? '');
    const symbol = t.origCurrencySymbol ?? '';
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
    .map((entry) => formatCurrencyForDisplay(entry.total, entry.symbol, true));

  return parts.length ? parts.join(' · ') : null;
}
