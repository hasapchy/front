const FALLBACK = '3571a4';

function normalizeHex6(status) {
    let raw = status?.category?.color || status?.color;
    if (!raw) {
        return FALLBACK;
    }
    let h = String(raw).replace('#', '').trim();
    if (h.length === 3) {
        h = h.split('').map((c) => c + c).join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(h)) {
        return FALLBACK;
    }
    return h;
}

export function statusAccentHex(status) {
    return `#${normalizeHex6(status)}`;
}

export function normalizeKanbanStatuses(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list.map((status) => ({
        ...status,
        kanbanOutcome: status.kanbanOutcome !== undefined
            ? status.kanbanOutcome
            : (status.kanban_outcome ?? null),
    }));
}

export function kanbanColumnStatuses(statuses) {
    return (statuses ?? []).filter((s) => {
        const active = s.isActive !== undefined ? s.isActive : s.is_active;
        return active !== false;
    });
}

export function statusAccentFill(status, alpha = 0.45) {
    const h = normalizeHex6(status);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * @param {string} color
 * @param {number} amount
 * @returns {string}
 */
export function lightenColorHex(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * @param {object} status
 * @param {boolean} isDark
 * @returns {string}
 */
export function statusColumnBackground(status, isDark) {
    const accent = statusAccentHex(status);
    if (isDark) {
        return `color-mix(in srgb, ${accent} 22%, var(--surface-muted))`;
    }
    return lightenColorHex(accent, 0.92);
}
