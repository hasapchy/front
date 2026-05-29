export function isSquareMeterUnit(unitShortNameRaw) {
  const normalized = String(unitShortNameRaw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

  return normalized === 'м²'
    || normalized === 'м2'
    || normalized === 'm²'
    || normalized === 'm2';
}
