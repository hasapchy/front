const DRAFT_ROW_CLASS = 'opacity-60 text-gray-500 dark:text-gray-400';

/**
 * @param {{ status?: string }|null|undefined} item
 * @returns {boolean}
 */
export function isDraftTableRow(item) {
    if (!item || item.status == null || item.status === '') {
        return false;
    }
    const status = String(item.status);
    return status === 'draft' || status === 'in_progress';
}

/**
 * @param {{ status?: string }|null|undefined} item
 * @returns {string|null}
 */
export function draftTableRowClassFn(item) {
    return isDraftTableRow(item) ? DRAFT_ROW_CLASS : null;
}
