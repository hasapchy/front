export const STORE_CONFIG = {
  clearMutationsMapping: {
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
  },

  globalReferenceFields: [
    "units",
    "currencies",
    "users",
    "orderStatuses",
    "projectStatuses",
    "transactionCategories",
    "productStatuses",
  ],

  companyDataFields: [
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
  ],

  fieldsWithTimestamp: [
    "units",
    "currencies",
    "users",
    "orderStatuses",
    "projectStatuses",
    "transactionCategories",
    "productStatuses",
    "warehouses",
    "cashRegisters",
    "clientsData",
    "categories",
    "projectsData",
    "lastProductsData",
    "allProductsData",
  ],

  clientTypeFilterValues: [
    "individual",
    "company",
    "employee",
    "investor",
  ],

  localStorageKeys: {
    persistKey: "hasap_vuex_cache",
    referencesCache: "hasap_references_cache",
    userSettings: "hasap_user_settings",
    preservePrefixes: ["tableColumns_", "tableSort_"],
    removePatterns: ["transaction", "balance"],
  },

  cacheVersion: "1.0",

  storageTestKey: "__vuex_test__",

  referencesCacheFields: [
    "warehouses",
    "cashRegisters",
    "clientsData",
    "categories",
    "projectsData",
    "projectsDataCompanyId",
    "lastProductsData",
    "allProductsData",
  ],

  userSettingsFields: [
    "currentCompany",
    "lastCompanyId",
    "userCompanies",
    "soundEnabled",
    "orderStatusesCustomOrder",
    "clientTypeFilter",
    "cashRegisterFilter",
    "menuItems",
    "kanbanCardFields",
  ],

  loadingFlagsToReset: [
    "warehouses",
    "cashRegisters",
    "clients",
    "categories",
    "projects",
  ],

  cacheTTL: {
    lastProductsData: 5 * 60 * 1000,
  },

  fieldTTLMapping: {
    warehouses: "warehouses",
    cashRegisters: "cashRegisters",
    clientsData: "clients",
    categories: "categories",
    projectsData: "projects",
    allProductsData: "products",
  },
};

