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

  const map = {
    warehouse_movements: "Склад — Перемещения",
    warehouse_receipts: "Склад — Оприходования",
    warehouse_writeoffs: "Склад — Списания",
    warehouse_stocks: "Склад — Остатки",

    warehouses: "Склады",
    settings_edit: "Настройки",
    users: "Пользователи",
    orders: "Заказы",
    categories: "Категории",
    clients: "Клиенты",
    products: "Товары",
    transactions: "Транзакции",
    transfers: "Трансферы по кассам",
    sales: "Продажи",
    projects: "Проекты",
    order_statuses: "Статусы заказов",
    order_statuscategories: "Категории статусов",
    order_categories: "Категории заказов",
    cash_registers: "Кассы",

    settings: "Общие настройки",
    system_settings: "Настройки системы",
  };

  return map[prefix] || prefix;
}

export function permissionLabel(name) {
  const action = name.split("_").at(-1);

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
