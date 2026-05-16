import { formatQuantity, roundQuantityValue } from '@/utils/numberUtils';

export function parseToBaseFactor(raw) {
  const f = parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(f) && f > 0 ? f : 1;
}

export function baseFromAlternate(altQty, toBaseFactor) {
  const alt = Number(altQty) || 0;
  return roundQuantityValue(alt * parseToBaseFactor(toBaseFactor));
}

export function alternateFromBase(baseQty, toBaseFactor) {
  const q = Number(baseQty) || 0;
  const f = parseToBaseFactor(toBaseFactor);
  if (f === 1) {
    return roundQuantityValue(q);
  }
  return roundQuantityValue(q / f);
}

export function formatQtyWithUnit(quantity, shortName) {
  const q = formatQuantity(quantity);
  const short = shortName != null && String(shortName).trim() !== '' ? String(shortName).trim() : '';
  return short ? `${q} ${short}` : q;
}

export function formatLineOrigThenBaseQty(line) {
  if (!line) {
    return null;
  }
  const origUnitId = Number(line.origUnitId ?? line.orig_unit_id);
  const origQty = line.origQuantity ?? line.orig_quantity;
  const baseUnitId = Number(line.unitId ?? line.unit_id);
  if (!origUnitId || origQty == null || origQty === '' || origUnitId === baseUnitId) {
    return null;
  }
  const origPart = formatQtyWithUnit(origQty, line.origUnitShortName ?? line.orig_unit_short_name);
  const basePart = formatQtyWithUnit(line.quantity, line.unitShortName ?? line.unit_short_name);
  return `${origPart} (${basePart})`;
}

export function formatSignedHistoryQuantity(signedBaseQty, line, baseUnitId) {
  const q = Number(signedBaseQty) || 0;
  const sign = q > 0 ? '+' : '';
  const dual = formatLineOrigThenBaseQty({
    quantity: Math.abs(q),
    unitShortName: line.unitShortName ?? line.unit_short_name,
    unitId: baseUnitId,
    origUnitId: line.origUnitId ?? line.orig_unit_id,
    origQuantity: Math.abs(Number(line.origQuantity ?? line.orig_quantity ?? 0)),
    origUnitShortName: line.origUnitShortName ?? line.orig_unit_short_name,
  });
  if (dual) {
    return `${sign}${dual}`;
  }
  return `${sign}${formatQtyWithUnit(Math.abs(q), line.unitShortName ?? line.unit_short_name)}`;
}

export function formatWarehouseStockQuantitySlash(baseQty, baseShortName, stockByUnits, baseUnitId) {
  const basePart = formatQtyWithUnit(baseQty, baseShortName);
  if (!Array.isArray(stockByUnits) || stockByUnits.length === 0) {
    return basePart;
  }
  const baseUid = baseUnitId != null && baseUnitId !== '' ? Number(baseUnitId) : null;
  const seen = new Set();
  const extras = [];
  for (const row of stockByUnits) {
    const uid = Number(row.unit_id);
    if (baseUid && uid === baseUid) {
      continue;
    }
    if (seen.has(uid)) {
      continue;
    }
    seen.add(uid);
    const part = formatQtyWithUnit(row.quantity, row.short_name);
    if (part) {
      extras.push(part);
    }
  }
  if (extras.length === 0) {
    return basePart;
  }
  return `${basePart} / ${extras.join(' / ')}`;
}

export function formatStockAlternateSummary(stockByUnits, max = 2) {
  if (!Array.isArray(stockByUnits) || stockByUnits.length === 0) {
    return '';
  }
  return stockByUnits
    .slice(0, max)
    .map((row) => formatQtyWithUnit(row.quantity, row.short_name))
    .filter(Boolean)
    .join(' · ');
}
