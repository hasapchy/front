import { formatNumber } from '@/utils/numberUtils';

export function formatStockAlternateSummary(stockByUnits, max = 2) {
  if (!Array.isArray(stockByUnits) || stockByUnits.length === 0) {
    return '';
  }
  return stockByUnits
    .slice(0, max)
    .map((row) => {
      const q = formatNumber(parseFloat(row.quantity), null, false);
      return `${q} ${row.short_name}`.trim();
    })
    .filter(Boolean)
    .join(' · ');
}
