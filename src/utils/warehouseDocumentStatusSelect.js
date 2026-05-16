export const WAREHOUSE_DOCUMENT_STATUS_COLORS = {
    draft: '#F59E0B',
    in_progress: '#F59E0B',
    approved: '#3571A4',
    completed: '#64748B',
};

/**
 * @param {Array<{ value: string, label: string, color?: string }>} options
 * @param {Record<string, string>} [colorMap]
 * @returns {Array<{ id: string, name: string, color: string }>}
 */
export function toStatusSelectItems(options, colorMap = WAREHOUSE_DOCUMENT_STATUS_COLORS) {
    return (options || []).map((opt) => ({
        id: opt.value,
        name: opt.label,
        color: opt.color ?? colorMap[opt.value] ?? '#3571A4',
    }));
}

/**
 * @param {Array<[string, string]>} definitions [value, i18nKey]
 * @param {(key: string) => string} translate
 * @returns {{ options: Array<{ value: string, label: string }>, statusesForSelect: ReturnType<typeof toStatusSelectItems> }}
 */
export function createWarehouseDocumentStatusConfig(definitions, translate) {
    const options = definitions.map(([value, labelKey]) => ({
        value,
        label: translate(labelKey),
    }));

    return {
        options,
        statusesForSelect: toStatusSelectItems(options),
    };
}

/**
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} [status]
 * @returns {string}
 */
export function warehouseStatusLabel(options, status) {
    const match = (options || []).find((opt) => opt.value === status);
    return match?.label ?? status ?? '—';
}
