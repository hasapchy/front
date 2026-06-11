const SOURCE_KIND_CONFIG = {
  sale: {
    aliases: ['Sale'],
    shortAliases: ['sale'],
    labelKey: 'sale',
    fallbackLabel: 'Продажа',
  },
  order: {
    aliases: ['Order'],
    shortAliases: ['order'],
    labelKey: 'order',
    fallbackLabel: 'Заказ',
  },
  receipt: {
    aliases: ['WhReceipt', 'WarehouseReceipt'],
    shortAliases: ['warehouse_receipt', 'receipt', 'wh_receipt'],
    labelKey: 'receipt',
    fallbackLabel: 'Оприходование',
  },
  writeoff: {
    aliases: ['WhWriteoff', 'WarehouseWriteoff'],
    shortAliases: ['writeoff'],
    labelKey: 'writeoff',
    fallbackLabel: 'Возврат',
  },
  purchase: {
    aliases: ['WhPurchase', 'WarehousePurchase'],
    shortAliases: ['purchase'],
    labelKey: 'purchase',
    fallbackLabel: 'Закупка',
  },
  salary: {
    aliases: ['EmployeeSalary'],
    shortAliases: ['salary'],
    labelKey: null,
    fallbackLabel: 'Зарплата',
  },
  contract: {
    aliases: ['ProjectContract'],
    shortAliases: ['contract'],
    labelKey: 'contract',
    fallbackLabel: 'Контракт',
  },
  transaction: {
    aliases: ['Transaction'],
    shortAliases: ['transaction'],
    labelKey: null,
    fallbackLabel: 'Транзакция',
  },
};

const SOURCE_KIND_ORDER = ['sale', 'order', 'receipt', 'writeoff', 'purchase', 'salary', 'contract', 'transaction'];
const SOURCE_KIND_FALLBACK = 'transaction';
const SOURCE_KIND_BY_SHORT_ALIAS = SOURCE_KIND_ORDER.reduce((acc, kind) => {
  for (const alias of SOURCE_KIND_CONFIG[kind].shortAliases) {
    acc[alias] = kind;
  }
  return acc;
}, {});
const SOURCE_KIND_BY_TYPE_ALIAS = SOURCE_KIND_ORDER.map((kind) => ({
  kind,
  aliases: SOURCE_KIND_CONFIG[kind].aliases,
}));
const DOCUMENT_SOURCE_KINDS = ['order', 'sale', 'receipt', 'purchase', 'contract'];
const WAREHOUSE_SOURCE_KINDS = ['receipt', 'purchase'];

export const SOURCE_ICON_CLASS_MAP = {
  sale: 'fas fa-shopping-cart text-[var(--color-success)]',
  order: 'fas fa-file-invoice text-[var(--color-info)]',
  receipt: 'fas fa-box text-[#FFA500]',
  writeoff: 'fas fa-box-open text-[var(--color-danger)]',
  purchase: 'fas fa-cart-plus text-[var(--color-info)]',
  salary: 'fas fa-money-bill-wave text-[#28A745]',
  contract: 'fas fa-file-contract text-[var(--color-info)]',
  transaction: 'fas fa-exchange-alt text-[#6C757D]',
};

export const SOURCE_BADGE_META_MAP = {
  sale: { icon: 'fa-shopping-cart', color: 'text-[var(--color-success)]' },
  order: { icon: 'fa-clipboard-list', color: 'text-[var(--color-info)]' },
  receipt: { icon: 'fa-box', color: 'text-[#FFA500]' },
  writeoff: { icon: 'fa-box-open', color: 'text-[var(--color-danger)]' },
  purchase: { icon: 'fa-cart-plus', color: 'text-[var(--color-info)]' },
  salary: { icon: 'fa-money-bill-wave', color: 'text-[#28A745]' },
  contract: { icon: 'fa-file-contract', color: 'text-[var(--color-info)]' },
  transaction: { icon: 'fa-money-bill-transfer', color: 'text-[#6C757D]' },
};

import { buildEntityAccentPillHtml } from '@/utils/entityCardUtils';

const SOURCE_ACCENT_COLOR_MAP = {
  sale: 'var(--color-success)',
  order: 'var(--color-info)',
  receipt: '#FFA500',
  writeoff: 'var(--color-danger)',
  purchase: 'var(--color-info)',
  salary: '#28A745',
  contract: 'var(--color-info)',
  transaction: '#6C757D',
};

function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function getSourceKind(sourceType = '', source = '') {
  const typeValue = String(sourceType ?? '');
  const sourceValue = String(source ?? '').toLowerCase();

  if (sourceValue && SOURCE_KIND_BY_SHORT_ALIAS[sourceValue]) {
    return SOURCE_KIND_BY_SHORT_ALIAS[sourceValue];
  }

  if (typeValue) {
    for (const { kind, aliases } of SOURCE_KIND_BY_TYPE_ALIAS) {
      if (aliases.some((alias) => typeValue.includes(alias))) {
        return kind;
      }
    }
  }

  return SOURCE_KIND_FALLBACK;
}

export function getSourceKindLabel(t, kind) {
  const cfg = SOURCE_KIND_CONFIG[kind] || SOURCE_KIND_CONFIG[SOURCE_KIND_FALLBACK];
  if (cfg.labelKey) {
    return t(cfg.labelKey);
  }
  return cfg.fallbackLabel;
}

export function getSourceDisplayText(t, sourceType, sourceId, source = '') {
  const kind = getSourceKind(sourceType, source);
  if (kind === 'salary') {
    return getSourceKindLabel(t, kind);
  }
  return `${getSourceKindLabel(t, kind)} #${sourceId}`;
}

/**
 * @param {string} sourceType
 * @param {number|string|null|undefined} sourceId
 * @param {string} [source]
 * @returns {string}
 */
export function getSourceIconClass(sourceType, sourceId, source = '') {
  const kind = getSourceKind(sourceType, source);
  if (sourceType && sourceId) {
    return SOURCE_ICON_CLASS_MAP[kind] || 'fas fa-link text-[var(--color-info)]';
  }
  const meta = SOURCE_BADGE_META_MAP[kind] || SOURCE_BADGE_META_MAP.transaction;
  return `fas ${meta.icon} ${meta.color}`;
}

/**
 * @param {string} sourceType
 * @param {number|string|null|undefined} sourceId
 * @param {string} [source]
 * @returns {string}
 */
export function getSourceAccentColor(sourceType, sourceId, source = '') {
  const kind = getSourceKind(sourceType, source);
  return SOURCE_ACCENT_COLOR_MAP[kind] || 'var(--color-info)';
}

/**
 * @param {(key: string) => string} t
 * @param {string} sourceType
 * @param {number|string|null|undefined} sourceId
 * @param {string} [source]
 * @param {string} [labelHtml]
 * @returns {string}
 */
export function buildTransactionSourceChipHtml(t, sourceType, sourceId, source = '', labelHtml = '') {
  if (!sourceType) {
    return '';
  }
  const kind = getSourceKind(sourceType, source);
  const label = labelHtml || escapeHtmlText(
    sourceId
      ? getSourceDisplayText(t, sourceType, sourceId, source)
      : getSourceKindLabel(t, kind),
  );
  if (!label) {
    return '';
  }
  const accent = getSourceAccentColor(sourceType, sourceId, source);
  const iconClass = getSourceIconClass(sourceType, sourceId, source);
  return buildEntityAccentPillHtml(accent, iconClass, label, 'entity-card__source-pill');
}

function hasValue(value) {
  return value != null && value !== '';
}

function normalizeBooleanLike(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }
  return false;
}

export function isReadonlyTransactionSource(sourceType, isDebt = false) {
  if (!normalizeBooleanLike(isDebt)) {
    return false;
  }
  const kind = getSourceKind(sourceType, '');
  return DOCUMENT_SOURCE_KINDS.includes(kind);
}

export function resolveAmountRoundingScopeByTransactionSource({
  sourceType = '',
  source = '',
  orderId = null,
  contractId = null,
  warehouseReceiptId = null,
  warehousePurchaseId = null,
} = {}) {
  if (hasValue(contractId)) {
    return 'contract';
  }
  if (hasValue(orderId)) {
    return 'order';
  }
  if (hasValue(warehouseReceiptId) || hasValue(warehousePurchaseId)) {
    return 'warehouse';
  }

  const kind = getSourceKind(sourceType, source);
  if (kind === 'contract' || kind === 'order') {
    return kind;
  }
  if (WAREHOUSE_SOURCE_KINDS.includes(kind)) {
    return 'warehouse';
  }

  return 'transaction';
}
