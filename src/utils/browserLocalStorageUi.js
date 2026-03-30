const SEGMENT = {
  TABLE_COLUMNS: 'tableColumns',
  TABLE_SORT: 'tableSort',
  CARD_FIELDS: 'cardFields',
};

const OTHER_PRESERVED_PREFIXES = [
  'cashRegisters_',
  'ui_transactions_balance_cards_layout_',
  'menuItems_',
  'messenger_selectedChatId_',
  'simple_services_order_',
];

export const LS_KEYS = {
  kanbanColumnOrder: {
    orders: 'kanban_column_order_orders',
    projects: 'kanban_column_order_projects',
    tasks: 'kanban_column_order_tasks',
  },
  perPage: 'perPage',
  reportByCategoriesFilters: 'reportByCategoriesFilters',
  soundEnabled: 'soundEnabled',
};

export function storageCompanySegment(companyId) {
  return companyId != null && companyId !== '' ? String(companyId) : 'default';
}

export function tableColumnsStorageKey(tableKey, companyId) {
  return `${SEGMENT.TABLE_COLUMNS}_${tableKey}_${storageCompanySegment(companyId)}`;
}

export function tableSortStorageKey(tableKey, companyId) {
  return `${SEGMENT.TABLE_SORT}_${tableKey}_${storageCompanySegment(companyId)}`;
}

export function cardFieldsStorageKey(cardFieldsKeyName, companyId) {
  return `${SEGMENT.CARD_FIELDS}_${cardFieldsKeyName}_${storageCompanySegment(companyId)}`;
}

export function transactionsBalanceCardsLayoutKey(companyId) {
  return `ui_transactions_balance_cards_layout_${storageCompanySegment(companyId)}`;
}

export function messengerSelectedChatStorageKey(companyId) {
  if (companyId != null && companyId !== '') {
    return `messenger_selectedChatId_${String(companyId)}`;
  }
  return 'messenger_selectedChatId_0';
}

export function simpleServicesOrderStorageKey(userId) {
  return `simple_services_order_${userId}`;
}

export function kanbanColumnOrderStorageKey({ isTaskMode, isProjectMode }) {
  if (isTaskMode) {
    return LS_KEYS.kanbanColumnOrder.tasks;
  }
  if (isProjectMode) {
    return LS_KEYS.kanbanColumnOrder.projects;
  }
  return LS_KEYS.kanbanColumnOrder.orders;
}

export const PRESERVED_LOCAL_STORAGE_PREFIXES = [
  `${SEGMENT.TABLE_COLUMNS}_`,
  `${SEGMENT.TABLE_SORT}_`,
  `${SEGMENT.CARD_FIELDS}_`,
  ...OTHER_PRESERVED_PREFIXES,
];

export const PRESERVED_LOCAL_STORAGE_EXACT_KEYS = [
  ...Object.values(LS_KEYS.kanbanColumnOrder),
  LS_KEYS.perPage,
  LS_KEYS.reportByCategoriesFilters,
  LS_KEYS.soundEnabled,
];
