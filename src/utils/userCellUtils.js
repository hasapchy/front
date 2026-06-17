import { getUserDisplayName } from '@/utils/displayUtils';
import { formatDateByDisplayMode } from '@/utils/dateUtils';

function pickUserId(source) {
    const raw = source.id
        ?? source.userId
        ?? source.user_id
        ?? source.creatorId
        ?? source.creator_id
        ?? source.employee_id
        ?? source.employeeId;
    if (raw == null || raw === '') {
        return null;
    }
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
}

function splitFullName(fullName) {
    const normalized = String(fullName ?? '').trim();
    if (!normalized) {
        return { name: '', surname: '' };
    }
    const parts = normalized.split(/\s+/);
    return {
        name: parts[0] ?? '',
        surname: parts.slice(1).join(' '),
    };
}

export function buildDateUserCellProps(item, searchQuery = '', dateDisplayMode = null) {
    const rawDate = item?.date ?? '';
    let date = formatDateByDisplayMode(rawDate, 'datetime', dateDisplayMode);
    if (!date && typeof item?.formatDate === 'function') {
        date = item.formatDate() || '';
    }
    return {
        date,
        user: item?.creator ?? null,
        searchQuery,
    };
}

export function normalizeUserForCell(source) {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const id = pickUserId(source);
    const flatName = source.creator_name ?? source.creatorName ?? source.employee_name ?? '';
    const flatSurname = source.creator_surname ?? source.creatorSurname ?? source.employee_surname ?? '';
    const hasName = Boolean(getUserDisplayName(source) || String(flatName).trim() || String(flatSurname).trim());

    if (id == null && !hasName) {
        return null;
    }

    const fromFlat = splitFullName(flatName);

    return {
        id,
        name: source.name ?? source.firstName ?? fromFlat.name,
        surname: source.surname ?? source.lastName ?? flatSurname ?? fromFlat.surname,
        photo: source.photo ?? null,
        position: source.position ?? null,
        displayName: source.displayName ?? null,
    };
}
