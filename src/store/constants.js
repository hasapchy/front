// DRY: единый маппинг для очистки state по типу данных
export const CLEAR_MUTATIONS_MAPPING = {
  currencies: "SET_CURRENCIES",
  units: "SET_UNITS",
  users: "SET_USERS",
  orderStatuses: "SET_ORDER_STATUSES",
  projectStatuses: "SET_PROJECT_STATUSES",
  transactionCategories: "SET_TRANSACTION_CATEGORIES",
  productStatuses: "SET_PRODUCT_STATUSES",
  warehouses: "SET_WAREHOUSES",
  cashRegisters: "SET_CASH_REGISTERS",
  clients: "SET_CLIENTS",
  products: "SET_PRODUCTS",
  services: "SET_SERVICES",
  categories: "SET_CATEGORIES",
  projects: "SET_PROJECTS",
};

// DRY: глобальные справочники (не зависят от компании)
export const GLOBAL_REFERENCE_FIELDS = [
  "units",
  "currencies",
  "users",
  "orderStatuses",
  "projectStatuses",
  "transactionCategories",
  "productStatuses",
];

// DRY: поля данных компании, которые нужно очищать при смене компании/очистке кэша
export const COMPANY_DATA_FIELDS = [
  "warehouses",
  "cashRegisters",
  "clients",
  "clientsData",
  "products",
  "services",
  "lastProducts",
  "allProducts",
  "lastProductsData",
  "allProductsData",
  "categories",
  "projects",
  "projectsData",
];

// DRY: поля с timestamp для persistedState (включает глобальные и данные компании)
export const FIELDS_WITH_TIMESTAMP = [
  ...GLOBAL_REFERENCE_FIELDS,
  "warehouses",
  "cashRegisters",
  "clientsData",
  "categories",
  "projectsData",
  "lastProductsData",
  "allProductsData",
];

