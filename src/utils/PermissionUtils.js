export function permissionIcon(name) {
  const action = name.split("_").at(-1);

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

  // Используем i18n для перевода, если доступен
  if (typeof window !== 'undefined' && window.i18n) {
    const translationKey = prefix;
    const translation = window.i18n.global.t(translationKey);
    if (translation !== translationKey) {
      return translation;
    }
  }

  // Fallback на английские названия
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
    sales: "Sales",
    projects: "Projects",
    order_statuses: "Order Statuses",
    order_statuscategories: "Status Categories",
    order_categories: "Order Categories",
    transaction_categories: "Transaction Categories",
    cash_registers: "Cash Registers",

    settings: "General Settings",
    system_settings: "System Settings",
  };

  return map[prefix] || prefix;
}

export function permissionLabel(name) {
  const action = name.split("_").at(-1);

  // Используем i18n для перевода, если доступен
  if (typeof window !== 'undefined' && window.i18n) {
    const translation = window.i18n.global.t(action);
    if (translation !== action) {
      return translation;
    }
  }

  // Fallback на английские названия
  switch (action) {
    case "view":
      return "View";
    case "create":
      return "Create";
    case "update":
      return "Update";
    case "delete":
      return "Delete";
    case "date":
      return "Date";

    default:
      return action || name;
  }
}

export function permissionColor(name) {
  const action = name.split("_").at(-1);

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
