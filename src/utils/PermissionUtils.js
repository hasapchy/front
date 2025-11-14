export function permissionIcon(name) {
  if (name.startsWith('settings_')) {
    const settingsIconMap = {
      'settings_edit_any_date': 'fas fa-pen',
      'settings_project_budget_view': 'fas fa-eye',
      'settings_currencies_view': 'fas fa-eye',
      'settings_cash_balance_view': 'fas fa-wallet',
      'settings_client_balance_view': 'fas fa-user-circle',
      'settings_view': 'fas fa-cog',
    };
    return settingsIconMap[name] || 'fas fa-cog';
  }

  const parts = name.split("_");
  const action = parts[parts.length - 1] === 'all' || parts[parts.length - 1] === 'own' 
    ? parts[parts.length - 2] 
    : parts[parts.length - 1];

  switch (action) {
    case "view":
      return "fas fa-eye";
    case "create":
      return "fas fa-plus";
    case "update":
      return "fas fa-pen";
    case "delete":
      return "fas fa-trash";
    default:
      return "fas fa-dot-circle";
  }
}

export function permissionGroupLabel(name) {
  const parts = name.split("_");
  const prefix = parts.length > 2 ? `${parts[0]}_${parts[1]}` : parts[0];

  if (name.startsWith('settings_') || prefix.startsWith('settings_') || name === 'settings') {
    return "Settings";
  }

  if (typeof window !== 'undefined' && window.i18n) {
    const translationKey = prefix;
    const translation = window.i18n.global.t(translationKey);
    if (translation !== translationKey) {
      return translation;
    }
  }

  const map = {
    warehouse_movements: "Warehouse — Movements",
    warehouse_receipts: "Warehouse — Receipts",
    warehouse_writeoffs: "Warehouse — Writeoffs",
    warehouse_stocks: "Warehouse — Stocks",
    warehouses: "Warehouses",
    settings_edit: "Settings",
    users: "Users",
    orders: "Orders",
    categories: "Categories",
    clients: "Clients",
    products: "Products",
    transactions: "Transactions",
    transfers: "Cash Transfers",
    mutual_settlements: "Mutual Settlements",
    sales: "Sales",
    projects: "Projects",
    order_statuses: "Order Statuses",
    order_statuscategories: "Status Categories",
    order_categories: "Order Categories",
    transaction_categories: "Transaction Categories",
    cash_registers: "Cash Registers",
    currencies_access: "Currency Access",
    settings: "General Settings",
  };

  return map[prefix] || prefix;
}

export function permissionLabel(name) {
  if (name.startsWith('settings_')) {
    const settingsMap = {
      'settings_edit_any_date': 'Изменение любой даты',
      'settings_project_budget_view': 'Просмотр бюджета проекта',
      'settings_currencies_view': 'Просмотр других валют',
      'settings_cash_balance_view': 'Просмотр баланса касс',
      'settings_client_balance_view': 'Просмотр баланса клиентов',
      'settings_view': 'Просмотр настроек',
    };
    return settingsMap[name] || name;
  }

  if (name === 'mutual_settlements_view') {
    if (typeof window !== 'undefined' && window.i18n && window.i18n.global && window.i18n.global.t) {
      try {
        const translation = window.i18n.global.t('mutual_settlements_view');
        if (translation !== 'mutual_settlements_view') {
          return translation;
        }
      } catch (error) {
        console.warn('i18n translation failed:', error);
      }
    }
    return 'Просмотр взаиморасчетов';
  }

  const action = name.split("_").at(-1);

  if (typeof window !== 'undefined' && window.i18n && window.i18n.global && window.i18n.global.t) {
    try {
      const translation = window.i18n.global.t(action);
      if (translation !== action) {
        return translation;
      }
    } catch (error) {
      console.warn('i18n translation failed:', error);
    }
  }

  switch (action) {
    case "view":
      return "Просмотр";
    case "create":
      return "Создание";
    case "update":
      return "Редактирование";
    case "delete":
      return "Удаление";
    case "date":
      return "Дата";
    default:
      return action || name;
  }
}

export function permissionColor(name) {
  const parts = name.split("_");
  const action = parts[parts.length - 1] === 'all' || parts[parts.length - 1] === 'own' 
    ? parts[parts.length - 2] 
    : parts[parts.length - 1];

  switch (action) {
    case "view":
      return "text-blue-500";
    case "create":
      return "text-green-500";
    case "update":
      return "text-yellow-500";
    case "delete":
      return "text-red-500";
    case "export":
      return "text-purple-500";
    default:
      return "text-gray-600";
  }
}

export function getPermissionPrefix(name) {
  const knownActions = ["view", "create", "update", "delete"];
  const parts = name.split("_");

  const actionIndex = parts.findIndex((p) => knownActions.includes(p));
  if (actionIndex > 0) {
    return parts.slice(0, actionIndex).join("_");
  }

  return "settings";
}
