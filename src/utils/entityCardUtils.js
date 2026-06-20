import { normalizePaymentStatus, paymentStatusColor, resolvePaymentStatusLabel } from '@/utils/paymentStatusCell';
import { getClientDisplayName } from '@/utils/displayUtils';
import { resolveProductImageSrc } from '@/utils/dtoUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export const ENTITY_CHIP_ICON = {
    project: 'fas fa-briefcase',
    client: 'fas fa-user',
    type: 'fas fa-tag',
    cashRegister: 'fas fa-cash-register',
    source: 'fas fa-link',
    credit: 'fas fa-hand-holding-usd',
};

export function entityHero(name, options = {}) {
    const lineClamp = options.lineClamp ?? 1;
    return { name, slot: 'hero', lineClamp, ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @param {string} [icon]
 * @returns {object}
 */
export function entityChip(name, icon = ENTITY_CHIP_ICON.project, options = {}) {
    return { name, slot: 'hero', lineClamp: false, chipIcon: icon, ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeroCompact(name, options = {}) {
    return entityHero(name, { lineClamp: 1, ...options });
}

/**
 * @param {string} [name]
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeroActions(name = 'contactActions', options = {}) {
    return { name, slot: 'hero-actions', ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeroFull(name, options = {}) {
    return entityHero(name, { lineClamp: 1, heroSpan: 'full', ...options });
}

/**
 * @param {string} name
 * @param {string|null} [label]
 * @param {object} [options]
 * @returns {object}
 */
export function entityMeta(name, label = null, options = {}) {
    return { name, slot: 'meta', ...options, label: options.label ?? label ?? name };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityTitleMeta(name, options = {}) {
    return { name, slot: 'title-meta', ...options, label: options.label ?? name };
}

/**
 * @param {string} [name]
 * @returns {object}
 */
export function entityFooterDate(name = 'date', options = {}) {
    return {
        name,
        slot: 'footer-date',
        ...options,
        type: options.type ?? 'datetime',
        label: options.label ?? name,
    };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeroDeadline(name = 'deadline', options = {}) {
    return {
        name,
        slot: 'hero-deadline',
        heroSpan: 'full',
        ...options,
        label: options.label ?? name,
    };
}

/**
 * @param {string} [name]
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeroAssignees(name = 'assignees', options = {}) {
    return {
        name,
        slot: 'hero-assignees',
        heroSpan: 'full',
        ...options,
        label: options.label ?? name,
    };
}

/**
 * @param {string} [name]
 * @param {object} [options]
 * @returns {object}
 */
export function entityHeaderDeadline(name = 'deadline', options = {}) {
    return {
        name,
        slot: 'header-deadline',
        ...options,
        label: options.label ?? name,
    };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityFooterCorner(name, options = {}) {
    return {
        name,
        slot: 'footer-corner',
        ...options,
        label: options.label ?? name,
    };
}

/**
 * @param {string} [name]
 * @param {object} [options]
 * @returns {object}
 */
export function entityFooterStatus(name = 'statusName', options = {}) {
    return { name, slot: 'footer-status', ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @param {object} [options]
 * @returns {object}
 */
export function entityFooterAmount(name, options = {}) {
    return { name, slot: 'footer-amount', ...options, label: options.label ?? name };
}

/**
 * @param {string} [name]
 * @returns {object}
 */
export function entityFooterPayment(name = 'paymentStatusPlain', options = {}) {
    return { name, slot: 'footer-amount-sub', ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @returns {object}
 */
export function entityFooterCaption(name, options = {}) {
    return { name, slot: 'footer-caption', ...options, label: options.label ?? name };
}

/**
 * @param {string} name
 * @returns {object}
 */
export function entityHeaderBadge(name) {
    return { name, slot: 'header-badge', label: name };
}

/**
 * @param {object|null|undefined} item
 * @returns {string|Date|null}
 */
export function entityItemDate(item) {
    return item?.date ?? null;
}

/**
 * @param {object|null|undefined} item
 * @param {object[]|null} [statuses]
 * @returns {string|null}
 */
export function resolveStatusAccentColor(item, statuses = null) {
    const statusObj = item?.status;
    if (statusObj) {
        const color = statusObj.color || statusObj.category?.color;
        if (color) {
            return color;
        }
    }
    const statusId = item?.statusId;
    if (statuses?.length && statusId != null) {
        const found = statuses.find((s) => Number(s.id) === Number(statusId));
        if (found) {
            return found.color || found.category?.color || null;
        }
    }
    return null;
}

/**
 * @param {object|null|undefined} item
 * @returns {string|null}
 */
export function entityStatusAccent(item) {
    return resolveStatusAccentColor(item);
}

/**
 * @param {object} item
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function mapPaymentStatusPlain(item, t) {
    return resolvePaymentStatusLabel(item, t);
}

/**
 * @param {object} item
 * @returns {string}
 */
export function mapPaymentStatusColor(item) {
    const { status } = normalizePaymentStatus(item);
    return paymentStatusColor(status);
}

/**
 * @param {object} item
 * @param {number} [maxItems]
 * @returns {string}
 */
export function mapProductsOrDescription(item, maxItems = 3) {
    if (item?.products?.length) {
        const products = item.products;
        const names = products
            .slice(0, maxItems)
            .map((product) => product.productName)
            .filter(Boolean);
        if (!names.length) {
            return item?.description || '';
        }
        let text = names.join(', ');
        const restCount = products.length - maxItems;
        if (restCount > 0) {
            text += ` (+${restCount})`;
        }
        return text;
    }
    return item?.description || '';
}

/**
 * @param {object} item
 * @param {number} [maxItems]
 * @param {number} [maxThumbs]
 * @returns {string}
 */
export function mapEntityProductsLine(item, maxItems = 1, maxThumbs = 3) {
    if (!item?.products?.length) {
        return item?.description || '';
    }
    const products = item.products;
    const names = products
        .slice(0, maxItems)
        .map((product) => product.productName)
        .filter(Boolean);
    if (!names.length) {
        return item?.description || '';
    }
    const nameText = names.join(', ');
    const restCount = products.length - maxItems;
    const moreSuffix = restCount > 0 ? `(+${restCount})` : '';
    const thumbs = products
        .slice(0, maxThumbs)
        .map((product) => {
            const src = resolveProductImageSrc(product);
            if (!src) {
                return '';
            }
            return `<img src="${src}" alt="" class="entity-card__product-thumb" loading="lazy" width="18" height="18" />`;
        })
        .filter(Boolean)
        .join('');
    const thumbsHtml = thumbs ? `<span class="entity-card__product-thumbs">${thumbs}</span>` : '';
    const moreHtml = moreSuffix ? `<span class="entity-card__products-more">${moreSuffix}</span>` : '';
    return `<span class="entity-card__products">${thumbsHtml}<span class="entity-card__products-text">${nameText}</span>${moreHtml}</span>`;
}

/**
 * @param {string} iconClass
 * @param {string} text
 * @returns {string}
 */
export function mapEntityChip(iconClass, text) {
    const label = String(text ?? '').trim();
    if (!label) {
        return '';
    }
    return `<span class="entity-card__chip"><i class="${iconClass}" aria-hidden="true"></i><span>${label}</span></span>`;
}

/**
 * @param {string} accent
 * @param {string} iconClass
 * @param {string} title
 * @param {string} [extraClass]
 * @returns {string}
 */
export function buildEntityStatusIconHtml(accent, iconClass, title, extraClass = '') {
    const bareIcon = iconClass.split(/\s+/).filter((token) => !token.startsWith('text-')).join(' ');
    const iconClassNames = ['entity-card__status-icon', 'filter-modal-icon-badge', extraClass].filter(Boolean).join(' ');
    const safeTitle = String(title ?? '').replace(/"/g, '&quot;');
    return (
        `<span class="${iconClassNames}" style="color:${accent}" title="${safeTitle}">` +
        `<i class="${bareIcon} text-sm leading-none" aria-hidden="true"></i>` +
        `</span>`
    );
}

export function buildEntityAccentPillHtml(accent, iconClass, label, extraClass = '') {
    const text = String(label ?? '').trim();
    if (!text) {
        return '';
    }
    const bareIcon = iconClass.split(/\s+/).filter((token) => !token.startsWith('text-')).join(' ');
    const pillClass = ['entity-card__accent-pill', 'card-status-pill__static', extraClass].filter(Boolean).join(' ');
    return (
        `<span class="${pillClass}" style="--card-status-accent:${accent};background-color:color-mix(in srgb, ${accent} 18%, transparent);color:${accent}">` +
        `<i class="${bareIcon} card-status-pill__icon" aria-hidden="true"></i>` +
        `<span class="card-status-pill__label">${text}</span>` +
        `</span>`
    );
}

/**
 * @param {string} label
 * @returns {string}
 */
export function mapEntityCreditPillHtml(label) {
    return buildEntityAccentPillHtml('var(--color-warning)', ENTITY_CHIP_ICON.credit, label);
}

/**
 * @param {string} [projectChipHtml]
 * @param {string} [creditPillHtml]
 * @returns {string}
 */
export function mapEntityProjectCreditRow(projectChipHtml = '', creditPillHtml = '') {
    if (!projectChipHtml && !creditPillHtml) {
        return '';
    }
    return (
        `<span class="entity-card__hero-row">` +
        `<span class="entity-card__hero-row-start">${projectChipHtml}</span>` +
        `<span class="entity-card__hero-row-end">${creditPillHtml}</span>` +
        `</span>`
    );
}

/**
 * @param {object|null|undefined} item
 * @returns {boolean}
 */
export function isTransactionDebt(item) {
    const value = item?.isDebt;
    if (value === true || value === 1) {
        return true;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true';
    }
    return false;
}

/**
 * @param {number|string|null|undefined} id
 * @returns {string}
 */
export function mapEntityIdSubtitle(id) {
    if (id == null || id === '') {
        return '';
    }
    return `№${id}`;
}

/**
 * @returns {object[]}
 */
export function buildCatalogEntityCardConfig(options = {}) {
    const rows = [
        entityChip('category_name', 'fas fa-folder'),
        entityChip('sku', 'fas fa-barcode'),
        entityFooterDate(),
    ];
    if (options.showStock) {
        rows.push(entityFooterAmount('stock', { html: true }));
    }
    return rows;
}

/**
 * @param {object|null|undefined} item
 * @param {string} nameHtml
 * @param {object} [options]
 * @returns {string}
 */
export function mapProductEntityTitleHtml(item, nameHtml, options = {}) {
    const parts = [];
    const imageSrc = resolveProductImageSrc(item);
    if (imageSrc) {
        parts.push(`<img src="${imageSrc}" alt="" class="entity-card__product-thumb" loading="lazy" width="18" height="18" />`);
    } else {
        const iconClass = options.fallbackIconClass ?? 'fas fa-box';
        parts.push(buildEntityStatusIconHtml('var(--nav-accent)', iconClass, ''));
    }
    return (
        `<span class="entity-card__title-inline">` +
        parts.join('') +
        `<span class="entity-card__title-text">${nameHtml}</span>` +
        `</span>`
    );
}

/**
 * @param {string} projectName
 * @returns {string}
 */
export function mapEntityProjectChip(projectName) {
    return mapEntityChip(ENTITY_CHIP_ICON.project, projectName);
}

/**
 * @param {string} projectName
 * @returns {string}
 */
export function mapEntityProjectRef(projectName) {
    const label = String(projectName ?? '').trim();
    if (!label) {
        return '';
    }
    return `<span class="entity-card__project-ref"><i class="${ENTITY_CHIP_ICON.project}" aria-hidden="true"></i><span>${label}</span></span>`;
}

/**
 * @param {string|null|undefined} clientType
 * @returns {string}
 */
export function resolveClientTypeIconClass(clientType) {
    const typeIcons = {
        company: 'fas fa-building',
        employee: 'fas fa-id-badge',
        investor: 'fas fa-hand-holding-usd',
    };
    return typeIcons[clientType] || ENTITY_CHIP_ICON.client;
}

/**
 * @param {object|string|null|undefined} clientOrName
 * @param {string} [displayName]
 * @returns {string}
 */
export function mapEntityClientChip(clientOrName, displayName) {
    let client = null;
    let name = '';

    if (clientOrName != null && typeof clientOrName === 'object') {
        client = clientOrName;
        name = String(displayName ?? getClientDisplayName(client) ?? '').trim();
    } else {
        name = String(displayName ?? clientOrName ?? '').trim();
    }

    if (!name) {
        return '';
    }

    return mapEntityChip(resolveClientTypeIconClass(client?.clientType), name);
}

/**
 * @param {object|string|null|undefined} clientOrName
 * @param {string} [displayName]
 * @returns {string}
 */
export function mapEntityClientTitleHtml(clientOrName, displayName) {
    let client = null;
    let name = '';

    if (clientOrName != null && typeof clientOrName === 'object') {
        client = clientOrName;
        name = String(displayName ?? getClientDisplayName(client) ?? '').trim();
    } else {
        name = String(displayName ?? clientOrName ?? '').trim();
    }

    if (!name) {
        return '';
    }

    const iconClass = resolveClientTypeIconClass(client?.clientType);
    return (
        `<span class="entity-card__title-inline">` +
        `<i class="${iconClass}" aria-hidden="true"></i>` +
        `<span class="entity-card__title-text">${name}</span>` +
        `</span>`
    );
}

/**
 * @param {string} [statusField]
 * @param {string} amountField
 * @param {object} [options]
 * @returns {object[]}
 */
export function entityStandardFooter(statusField = 'statusName', amountField, options = {}) {
    const rows = [
        entityFooterDate(),
        entityFooterStatus(statusField, options.statusOptions ?? {}),
        entityFooterAmount(amountField, options.amountOptions ?? {}),
    ];
    if (options.withPayment !== false) {
        rows.push(entityFooterPayment(options.paymentField));
    }
    return rows;
}

/**
 * @param {object} item
 * @returns {'paid'|'partially_paid'|'unpaid'}
 */
export function resolveContractPaymentStatus(item) {
    const paidAmount = Number(item?.paidAmount ?? 0);
    const amount = Number(item?.amount ?? 0);
    const fromApi = item?.paymentStatus;

    if (fromApi === 'paid' || (amount > 0 && paidAmount >= amount)) {
        return 'paid';
    }
    if (fromApi === 'partially_paid' || (paidAmount > 0 && paidAmount < amount)) {
        return 'partially_paid';
    }
    return 'unpaid';
}

/**
 * @param {object|null|undefined} item
 * @returns {string}
 */
export function resolveContractAccentColor(item) {
    if (!item) {
        return 'var(--text-secondary)';
    }
    if (item.status === 'draft') {
        return 'var(--text-secondary)';
    }
    if (item.returned) {
        return 'var(--color-success)';
    }
    return 'var(--color-danger)';
}

/**
 * @param {object|null|undefined} item
 * @returns {string}
 */
export function resolveClientAccentColor(item) {
    if (!item) {
        return 'var(--text-secondary)';
    }
    if (item.isConflict) {
        return 'var(--color-danger)';
    }
    if (!item.status) {
        return 'var(--text-secondary)';
    }
    return 'var(--color-success)';
}

/**
 * @param {object|null|undefined} item
 * @returns {string}
 */
export function resolveTransactionAccentColor(item) {
    if (!item) {
        return 'var(--text-secondary)';
    }
    if (item.isTransfer == 1) {
        return 'var(--color-info)';
    }
    if (item.type == 1) {
        return 'var(--color-success)';
    }
    return 'var(--color-danger)';
}

/**
 * @param {object|null|undefined} item
 * @returns {string}
 */
export function resolveTransactionAmountColor(item) {
    if (!item) {
        return 'var(--text-secondary)';
    }
    if (item.type == 1) {
        return 'var(--color-success)';
    }
    return 'var(--color-danger)';
}

/**
 * @param {object|null|undefined} item
 * @returns {string}
 */
export function resolveTransactionTypeIcon(item) {
    if (!item) {
        return '';
    }
    if (item.isTransfer == 1) {
        return 'fas fa-right-left';
    }
    if (item.type == 1) {
        return 'fas fa-circle-down';
    }
    return 'fas fa-circle-up';
}

export function mapContractSubtitle(item) {
    const number = item.number || String(item.id ?? '');
    return item.id ? `${number} (${item.id})` : number;
}

/**
 * @param {object} options
 * @returns {object}
 */
export function createEntityStatusPill({
    statuses,
    getValue,
    getLabel,
    getColor,
    onChange,
}) {
    return {
        getValue,
        getStatuses: () => statuses,
        getLabel,
        getColor,
        onChange,
    };
}

/**
 * @param {object} options
 * @returns {object}
 */
export function createEntityStatusPillForItem({
    statuses,
    translateStatus,
    onChange,
    getStatusName = (item) => item.status?.name || item.statusName,
}) {
    return createEntityStatusPill({
        statuses,
        getValue: (item) => item.statusId,
        getLabel: (item) => {
            const name = getStatusName(item);
            return name ? translateStatus(name) : '';
        },
        getColor: (item) => resolveStatusAccentColor(item, statuses) || '#3571A4',
        onChange: (item, statusId) => onChange(item, statusId),
    });
}

/**
 * @param {object|null|undefined} item
 * @returns {object|null}
 */
export function resolveEntityCardCreator(item) {
    if (!item) {
        return null;
    }
    const direct = item.creator ?? item.user ?? null;
    const normalized = normalizeUserForCell(direct);
    if (normalized) {
        return normalized;
    }
    return normalizeUserForCell({
        id: item.creator_id ?? item.creatorId,
        name: item.creator_name ?? item.creatorName,
        surname: item.creator_surname ?? item.creatorSurname,
        photo: item.creator_photo ?? item.creatorPhoto,
    });
}

/**
 * @param {object} [options]
 * @returns {object}
 */
export function createEntityCardOptions(options = {}) {
    return {
        accentColor: options.accentColor ?? entityStatusAccent,
        statusPill: options.statusPill ?? null,
        dateOf: options.dateOf ?? entityItemDate,
        paymentSubColor: options.paymentSubColor ?? mapPaymentStatusColor,
        captionColor: options.captionColor ?? null,
        headerSuffix: options.headerSuffix ?? null,
        headerCreator: options.headerCreator ?? resolveEntityCardCreator,
        isInactiveCard: options.isInactiveCard ?? null,
        showAccent: options.showAccent ?? true,
    };
}

/**
 * @param {object} item
 * @param {string} field
 * @param {Record<string, (item: object) => string>} handlers
 * @param {(field: string) => string} fallback
 * @returns {string}
 */
export function resolveEntityCardField(item, field, handlers, fallback) {
    if (handlers[field]) {
        return handlers[field](item) ?? '';
    }
    return fallback(field) ?? '';
}
