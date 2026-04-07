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

export function kanbanColumnStatuses(statuses) {
    return (statuses ?? []).filter((s) => s.isActive !== false);
}

export function statusAccentFill(status, alpha = 0.45) {
    const h = normalizeHex6(status);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
