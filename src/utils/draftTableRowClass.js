export const DRAFT_TABLE_ROW_CELL_CLASS = [
    '[&>td]:!bg-[#e9ecef]',
    '[&>td]:!text-gray-500',
    'dark:[&>td]:!bg-[color-mix(in_srgb,var(--surface-muted)_88%,#1a1e24)]',
    'dark:[&>td]:!text-[var(--text-secondary)]',
    'dark:[&>td]:shadow-[inset_3px_0_0_rgba(255,255,255,0.2)]',
].join(' ');

export const DRAFT_ENTITY_CARD_CLASS = 'entity-card--draft';

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
