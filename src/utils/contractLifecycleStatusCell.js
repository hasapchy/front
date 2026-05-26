import { getDocumentStatusCellProps } from '@/utils/documentStatusSelectCell';
import { toIconStatusSelectItems } from '@/utils/statusSelectIcons';

/**
 * @param {(key: string) => string} t
 * @returns {ReturnType<typeof toIconStatusSelectItems>}
 */
function buildContractLifecycleStatusOptions(t) {
    return toIconStatusSelectItems([
        { value: 'draft', label: t('contractStatusDraft') },
        { value: 'active', label: t('contractStatusActive') },
    ]);
}

/**
 * @param {object} item
 * @param {(key: string) => string} t
 * @param {(newValue: string) => void} onChange
 * @returns {ReturnType<typeof getDocumentStatusCellProps>}
 */
export function getContractLifecycleStatusCellProps(item, t, onChange) {
    return getDocumentStatusCellProps(
        item,
        buildContractLifecycleStatusOptions(t),
        onChange,
        { lockedValue: 'active' },
    );
}
