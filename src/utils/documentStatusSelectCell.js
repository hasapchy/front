import { toIconStatusSelectItems } from '@/utils/statusSelectIcons';

/**
 * @param {Array<[string, string]>} definitions [value, i18nKey]
 * @param {(key: string) => string} translate
 * @returns {{ options: Array<{ value: string, label: string }>, statusesForSelect: ReturnType<typeof toIconStatusSelectItems> }}
 */
export function createDocumentStatusConfig(definitions, translate) {
    const options = definitions.map(([value, labelKey]) => ({
        value,
        label: translate(labelKey),
    }));

    return {
        options,
        statusesForSelect: toIconStatusSelectItems(options),
    };
}

/**
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} [status]
 * @returns {string}
 */
export function documentStatusLabel(options, status) {
    const match = (options || []).find((opt) => opt.value === status);
    return match?.label ?? status ?? '—';
}

/**
 * @param {object} item
 * @param {ReturnType<typeof toIconStatusSelectItems>} allStatuses
 * @param {(newValue: string) => void} onChange
 * @param {{ disabled?: boolean, lockedValue?: string, lockedValues?: string[], filterStatuses?: (item: object, statuses: ReturnType<typeof toIconStatusSelectItems>) => ReturnType<typeof toIconStatusSelectItems> }} [config]
 * @returns {{ value: string, statuses: ReturnType<typeof toIconStatusSelectItems>, disabled: boolean, onChange: (newValue: string) => void, plainNames: boolean }}
 */
export function getDocumentStatusCellProps(item, allStatuses, onChange, config = {}) {
    const status = item?.status ?? 'draft';
    const lockedValues = config.lockedValues
        ?? (config.lockedValue != null ? [config.lockedValue] : ['completed']);
    const isLocked = lockedValues.includes(status);

    let statuses = allStatuses;
    if (isLocked) {
        statuses = allStatuses.filter((s) => s.id === status);
    } else if (config.filterStatuses) {
        statuses = config.filterStatuses(item, allStatuses);
    }

    return {
        value: status,
        statuses,
        disabled: isLocked || Boolean(config.disabled),
        onChange,
        plainNames: true,
    };
}
