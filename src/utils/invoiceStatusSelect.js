import {
    createDocumentStatusConfig,
    documentStatusLabel,
    getDocumentStatusCellProps,
} from '@/utils/documentStatusSelectCell';

const INVOICE_STATUS_DEFINITIONS = [
    ['new', 'new'],
    ['in_progress', 'inProgress'],
    ['paid', 'paid'],
    ['cancelled', 'cancelled'],
];

/**
 * @param {(key: string) => string} translate
 * @returns {ReturnType<typeof createDocumentStatusConfig>}
 */
export function createInvoiceStatusConfig(translate) {
    return createDocumentStatusConfig(INVOICE_STATUS_DEFINITIONS, translate);
}

/**
 * @param {object} item
 * @param {ReturnType<typeof createInvoiceStatusConfig>['statusesForSelect']} statusesForSelect
 * @param {(newValue: string) => void} onChange
 * @param {{ disabled?: boolean }} [config]
 * @returns {ReturnType<typeof getDocumentStatusCellProps>}
 */
export function getInvoiceStatusCellProps(item, statusesForSelect, onChange, config = {}) {
    const disabled = Boolean(config.disabled);
    const base = getDocumentStatusCellProps(item, statusesForSelect, onChange, config);

    return {
        ...base,
        disabled,
        showTriggerLabel: true,
        onChange: disabled ? undefined : onChange,
    };
}

/**
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} [status]
 * @returns {string}
 */
export function invoiceStatusLabel(options, status) {
    return documentStatusLabel(options, status);
}
