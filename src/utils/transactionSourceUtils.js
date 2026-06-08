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
