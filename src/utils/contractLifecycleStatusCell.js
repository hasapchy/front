/**
 * @param {(key: string) => string} t
 * @returns {Array<{ value: string, label: string, color: string, icon: string }>}
 */
function getContractLifecycleStatusOptions(t) {
    return [
        {
            value: 'draft',
            label: t('contractStatusDraft'),
            color: '#f8f9fa',
            borderColor: '#d1d5db',
            icon: 'far fa-file-lines',
            iconClass: 'text-gray-500 dark:text-[var(--text-secondary)]',
            chevronClass: 'text-gray-400 dark:text-[var(--text-secondary)]',
            cellClass: 'border dark:!bg-[#343c46] dark:!border-[var(--border-subtle)]',
        },
        {
            value: 'active',
            label: t('contractStatusActive'),
            color: '#5CB85C',
            icon: 'fa-solid fa-check',
        },
    ];
}

/**
 * @param {object} item
 * @param {(key: string) => string} t
 * @param {(newValue: string) => void} onChange
 * @returns {{ value: string, options: Array, disabled: boolean, onChange: (newValue: string) => void }}
 */
export function getContractLifecycleStatusCellProps(item, t, onChange) {
    const options = getContractLifecycleStatusOptions(t);
    const status = item?.status ?? 'draft';
    const isActive = status === 'active';

    return {
        value: status,
        options: isActive ? options.filter((o) => o.value === 'active') : options,
        disabled: isActive,
        onChange,
    };
}
