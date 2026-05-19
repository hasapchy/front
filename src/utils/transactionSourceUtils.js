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

export function getSourceKind(sourceType = '', source = '') {
  const typeValue = String(sourceType || '');
  const sourceValue = String(source || '').toLowerCase();

  if (sourceValue) {
    for (const kind of SOURCE_KIND_ORDER) {
      const shortAliases = SOURCE_KIND_CONFIG[kind].shortAliases || [];
      if (shortAliases.includes(sourceValue)) {
        return kind;
      }
    }
  }

  if (typeValue) {
    for (const kind of SOURCE_KIND_ORDER) {
      const aliases = SOURCE_KIND_CONFIG[kind].aliases || [];
      if (aliases.some((alias) => typeValue.includes(alias))) {
        return kind;
      }
    }
  }

  return 'transaction';
}

export function getSourceKindLabel(t, kind) {
  const cfg = SOURCE_KIND_CONFIG[kind] || SOURCE_KIND_CONFIG.transaction;
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

export function isReadonlyTransactionSource(sourceType) {
  const kind = getSourceKind(sourceType, '');
  return kind === 'order' || kind === 'sale' || kind === 'receipt' || kind === 'purchase';
}
