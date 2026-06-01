import { cashRegisterUserColorsStorageKey } from '@/utils/browserLocalStorageUi';

export const CASH_REGISTER_PRESET_COLORS = [
    '#3571A4',
    '#5CB85C',
    '#EE4F47',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#64748B',
    '#14B8A6',
    '#EAB308',
    '#F97316',
    '#6366F1',
];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

let preferencesByCashRegisterId = {};
let storageUserId = 'guest';
let storageCompanyId = 'default';

/**
 * @param {string} hex
 * @returns {boolean}
 */
export function isValidCashRegisterHex(hex) {
    return typeof hex === 'string' && HEX_PATTERN.test(hex.trim());
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function parseCashRegisterId(value) {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * @param {unknown} source
 * @returns {number|null}
 */
export function resolveCashRegisterId(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return null;
    }
    const direct = source.cashRegisterId ?? source.cashId;
    if (direct != null && direct !== '') {
        return parseCashRegisterId(direct);
    }
    if (typeof source.id === 'string' && source.id.startsWith('cash_')) {
        return parseCashRegisterId(source.id.slice(5));
    }
    if (source.cashId === undefined && source.cashRegisterId === undefined) {
        return parseCashRegisterId(source.id);
    }
    return null;
}

/**
 * @param {unknown} raw
 * @returns {{ mode: 'system'|'custom', color?: string }|null}
 */
function normalizePreference(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    if (raw.mode === 'custom' && isValidCashRegisterHex(raw.color)) {
        return { mode: 'custom', color: raw.color.trim() };
    }
    if (raw.mode === 'system' || raw.mode === 'custom') {
        return { mode: 'system' };
    }
    return null;
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(
            cashRegisterUserColorsStorageKey(storageUserId, storageCompanyId)
        );
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        const result = {};
        for (const [key, value] of Object.entries(parsed)) {
            const pref = normalizePreference(value);
            if (pref) {
                result[key] = pref;
            }
        }
        return result;
    } catch {
        return {};
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(
            cashRegisterUserColorsStorageKey(storageUserId, storageCompanyId),
            JSON.stringify(preferencesByCashRegisterId)
        );
    } catch {
        void 0;
    }
}

/**
 * @param {string|number|null|undefined} userId
 * @param {string|number|null|undefined} companyId
 */
export function hydrateCashRegisterUserColors(userId, companyId) {
    storageUserId = userId != null && userId !== '' ? String(userId) : 'guest';
    storageCompanyId = companyId != null && companyId !== '' ? String(companyId) : 'default';
    preferencesByCashRegisterId = loadFromStorage();
}

/**
 * @param {number|string} cashRegisterId
 * @returns {{ mode: 'system'|'custom', color?: string }|null}
 */
export function getCashRegisterUserColorPreference(cashRegisterId) {
    return preferencesByCashRegisterId[String(cashRegisterId)] ?? null;
}

/**
 * @param {number|string} cashRegisterId
 * @param {{ mode: 'system'|'custom', color?: string }} preference
 */
export function setCashRegisterUserColorPreference(cashRegisterId, preference) {
    const id = String(cashRegisterId);
    if (!parseCashRegisterId(id)) {
        return;
    }
    preferencesByCashRegisterId[id] = normalizePreference(preference) ?? { mode: 'system' };
    saveToStorage();
}
