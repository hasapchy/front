const STATUS_SELECT_ICONS = {
    draft: {
        color: '#f8f9fa',
        borderColor: '#d1d5db',
        icon: 'far fa-file-lines',
        iconClass: 'text-gray-500 dark:text-[var(--text-secondary)]',
        chevronClass: 'text-gray-400 dark:text-[var(--text-secondary)]',
        cellClass: 'border dark:!bg-[#343c46] dark:!border-[var(--border-subtle)]',
    },
    new: {
        color: '#3571A4',
        icon: 'fa-solid fa-star',
    },
    pending: {
        color: '#F59E0B',
        icon: 'fa-solid fa-clock',
    },
    active: {
        color: '#5CB85C',
        icon: 'fa-solid fa-check',
    },
    approved: {
        color: '#3571A4',
        icon: 'fa-solid fa-circle-check',
    },
    in_progress: {
        color: '#F59E0B',
        icon: 'fa-solid fa-bars-progress',
    },
    paid: {
        color: '#5CB85C',
        icon: 'fa-solid fa-circle-check',
    },
    ready: {
        color: '#5CB85C',
        icon: 'fa-solid fa-box-open',
    },
    completed: {
        color: '#64748B',
        icon: 'fa-solid fa-check',
    },
    cancelled: {
        color: '#EE4F47',
        icon: 'fa-solid fa-ban',
    },
    canceled: {
        color: '#EE4F47',
        icon: 'fa-solid fa-ban',
    },
};

function normalizeStatusKey(key) {
    if (key == null || key === '') {
        return '';
    }
    return String(key).trim().toLowerCase().replace(/-/g, '_');
}

function getStatusPreset(id, name) {
    const byId = STATUS_SELECT_ICONS[normalizeStatusKey(id)] ?? {};
    if (byId.icon) {
        return byId;
    }
    return STATUS_SELECT_ICONS[normalizeStatusKey(name)] ?? {};
}

function getCustomColor(item, id) {
    if (item.category?.color) {
        return item.category.color;
    }
    if (typeof id === 'number' && item.color) {
        return item.color;
    }
    return undefined;
}

/**
 * @param {Array<{ id?: string|number, value?: string|number, name?: string, label?: string, color?: string, category?: { color?: string }, icon?: string }>} statuses
 * @returns {Array<Record<string, unknown>>}
 */
export function enrichStatusesForSelect(statuses) {
    return (statuses || []).map((item) => {
        const id = item.id ?? item.value;
        const name = item.name ?? item.label ?? '';

        if (item.icon) {
            return { ...item, id, name };
        }

        const preset = getStatusPreset(id, name);
        const customColor = getCustomColor(item, id);
        const { color: presetColor, borderColor, cellClass, chevronClass, iconClass, ...iconFields } = preset;

        return {
            ...item,
            ...iconFields,
            id,
            name,
            color: customColor ?? presetColor,
            ...(customColor
                ? { iconClass: 'text-white' }
                : { borderColor, cellClass, chevronClass, iconClass }),
        };
    });
}

/**
 * @param {Array<{ value: string, label: string }>} options
 * @returns {Array<Record<string, unknown>>}
 */
export function toIconStatusSelectItems(options) {
    return enrichStatusesForSelect(
        (options || []).map((opt) => ({
            id: opt.value,
            name: opt.label,
        })),
    );
}
