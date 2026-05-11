export const WH_WRITEOFF_REASONS = Object.freeze([
  { value: 'defect', labelKey: 'writeoffReasonDefect' },
  { value: 'shortage', labelKey: 'writeoffReasonShortage' },
  { value: 'consumable', labelKey: 'writeoffReasonConsumable' },
  { value: 'return_supplier', labelKey: 'writeoffReasonReturnSupplier' },
  { value: 'other', labelKey: 'writeoffReasonOther' },
]);

const REASON_LABEL_KEY_BY_VALUE = WH_WRITEOFF_REASONS.reduce((acc, row) => {
    acc[row.value] = row.labelKey;
    return acc;
}, {});

export function getWriteoffReasonLabelKey(code) {
  if (code == null || code === '') {
    return 'writeoffReasonOther';
  }
  return REASON_LABEL_KEY_BY_VALUE[code] || 'writeoffReasonOther';
}

export const WH_WRITEOFF_REASONS_FOR_WRITE_OFFS_TAB_FILTER = Object.freeze(
  WH_WRITEOFF_REASONS.filter((r) => r.value !== 'return_supplier'),
);
