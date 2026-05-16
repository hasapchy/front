export const DRAFT_TABLE_ROW_CELL_CLASS = [
    '[&>td]:!bg-[#e9ecef]',
    '[&>td]:!text-gray-500',
    'dark:[&>td]:!bg-[var(--surface-elevated)]',
    'dark:[&>td]:!text-[var(--text-secondary)]',
].join(' ');

const DEFAULT_DRAFT_STATUSES = ['draft', 'in_progress'];

/**
 * @param {{ status?: string }|null|undefined} item
 * @param {string[]} [draftStatuses]
 * @returns {boolean}
 */
export function isDraftTableRow(item, draftStatuses = DEFAULT_DRAFT_STATUSES) {
    if (!item || item.status == null || item.status === '') {
        return false;
    }

    return draftStatuses.includes(String(item.status));
}
