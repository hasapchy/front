import { cardGridColumnsStorageKey } from '@/utils/browserLocalStorageUi';

export const CARD_GRID_COLUMN_OPTIONS = [2, 3, 4, 6];
export const DEFAULT_CARD_GRID_COLUMNS = 4;

/**
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
export function normalizeCardGridColumns(value) {
    const parsed = Number(value);
    if (CARD_GRID_COLUMN_OPTIONS.includes(parsed)) {
        return parsed;
    }
    return DEFAULT_CARD_GRID_COLUMNS;
}

/**
 * @param {number|string|null|undefined} columns
 * @param {boolean} isEntityLayout
 * @returns {string}
 */
export function buildCardGridClass(columns, isEntityLayout = true) {
    const count = normalizeCardGridColumns(columns);
    const parts = ['grid', 'grid-cols-1', 'gap-4'];

    if (count >= 2) {
        parts.push('sm:grid-cols-2');
    }
    if (count >= 3) {
        parts.push(isEntityLayout ? 'md:grid-cols-3' : 'lg:grid-cols-3');
    }
    if (count >= 4) {
        parts.push(isEntityLayout ? 'lg:grid-cols-4' : 'xl:grid-cols-4');
    }
    if (count >= 5) {
        parts.push('xl:grid-cols-5');
    }
    if (count >= 6) {
        parts.push('2xl:grid-cols-6');
    }

    return parts.join(' ');
}

/**
 * @param {number|string|null|undefined} companyId
 * @returns {number|null}
 */
export function readLegacyCardGridColumns(companyId) {
    const raw = localStorage.getItem(cardGridColumnsStorageKey(companyId));
    if (raw == null) {
        return null;
    }
    return normalizeCardGridColumns(raw);
}

/**
 * @param {number|string|null|undefined} companyId
 */
export function removeLegacyCardGridColumns(companyId) {
    localStorage.removeItem(cardGridColumnsStorageKey(companyId));
}
