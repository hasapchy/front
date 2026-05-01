export const ALL_MENU_DEFINITIONS = [
  {
    id: "orders",
    to: "/orders",
    icon: "fas fa-cart-arrow-down mr-2",
    label: "orders",
    permission: "orders_view",
  },
  {
    id: "simple-orders",
    to: "/simple-orders",
    icon: "fas fa-cart-arrow-down mr-2",
    label: "orders_simple",
    permission: "orders_simple_view",
  },
  {
    id: "sales",
    to: "/sales",
    icon: "fas fa-shopping-cart mr-2",
    label: "sales",
    permission: "sales_view",
  },
  {
    id: "tasks",
    to: "/tasks",
    icon: "fas fa-tasks mr-2",
    label: "tasks",
    permission: "tasks_view",
  },
  {
    id: "messenger",
    to: "/messenger",
    icon: "fas fa-comments mr-2",
    label: "messenger",
    permission: "chats_view_all",
  },
  {
    id: "transactions",
    to: "/transactions",
    icon: "fas fa-coins mr-2",
    label: "finance",
    permission: "transactions_view",
  },
  {
    id: "clients",
    to: "/clients",
    icon: "fa-solid fa-user-friends mr-2",
    label: "clients",
    permission: "clients_view",
  },
  {
    id: "projects",
    to: "/projects",
    icon: "fa-solid fa-briefcase mr-2",
    label: "projects",
    permission: "projects_view",
  },
  {
    id: "warehouses",
    to: "/warehouses",
    icon: "fa-solid fa-warehouse mr-2",
    label: "warehouses",
    permission: "warehouses_view",
  },
  {
    id: "users",
    to: "/users",
    icon: "fa-solid fa-user mr-2",
    label: "users",
    permission: "users_view",
  },
  {
    id: "org-structure",
    to: "/org-structure",
    icon: "fa-solid fa-sitemap mr-2",
    label: "orgStructure",
    permission: "departments_view_all",
  },
  {
    id: "roles",
    to: "/roles",
    icon: "fa-solid fa-user-shield mr-2",
    label: "roles",
    permission: "roles_view",
  },
  {
    id: "companies",
    to: "/companies",
    icon: "fa-solid fa-building mr-2",
    label: "companies",
    permission: "companies_view",
  },
  {
    id: "cash-registers",
    to: "/cash-registers",
    icon: "fa-solid fa-cash-register mr-2",
    label: "cashRegisters",
    permission: "cash_registers_view",
  },
  {
    id: "mutual-settlements",
    to: "/mutual-settlements",
    icon: "fa-solid fa-handshake mr-2",
    label: "mutualSettlements",
    permission: "mutual_settlements_view",
  },
  {
    id: "products",
    to: "/products",
    icon: "fa-solid fa-box mr-2",
    label: "products",
    permission: "products_view",
  },
  {
    id: "services",
    to: "/services",
    icon: "fa-solid fa-paint-roller mr-2",
    label: "services",
    permission: "products_view",
  },
  {
    id: "currencies",
    to: "/settings/currencies",
    icon: "fa-solid fa-coins mr-2",
    label: "currencies",
    permissions: [
      "currency_history_view",
      "currency_history_view_all",
      "currency_history_view_own",
      "settings_currencies_view",
    ],
  },
  {
    id: "leaves",
    to: "/leaves",
    icon: "fa-solid fa-calendar-days mr-2",
    label: "leaves",
    permission: "leaves_view_all",
  },
  {
    id: "message-templates",
    to: "/message-templates",
    icon: "fa-solid fa-file-alt mr-2",
    label: "messageTemplates",
    permission: "templates_view",
  },
  {
    id: "reports",
    to: "/reports",
    icon: "fa-solid fa-chart-pie mr-2",
    label: "reports",
    permission: "reports_view",
  },
];

export const DEFAULT_MAIN_MENU_IDS = [
  "orders",
  "simple-orders",
  "sales",
  "tasks",
  "messenger",
  "transactions",
  "clients",
  "projects",
  "warehouses",
];

export const DEFAULT_AVAILABLE_MENU_IDS = [
  "users",
  "org-structure",
  "roles",
  "companies",
  "cash-registers",
  "mutual-settlements",
  "products",
  "services",
  "currencies",
  "leaves",
  "message-templates",
  "reports",
];

const MENU_BY_ID = new Map(
  ALL_MENU_DEFINITIONS.map((item) => [item.id, item])
);

export function defaultMenuFromCatalog() {
  return {
    main: DEFAULT_MAIN_MENU_IDS.map((id) => MENU_BY_ID.get(id)).filter(Boolean),
    available: DEFAULT_AVAILABLE_MENU_IDS.map((id) => MENU_BY_ID.get(id)).filter(
      Boolean
    ),
  };
}
