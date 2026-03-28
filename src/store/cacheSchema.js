import CACHE_TTL from "../constants/cacheTTL.js";
import { CACHE_CONFIG } from "../cache/config.js";

const GLOBAL_KEYS = CACHE_CONFIG.globalReferenceKeys;

export const GLOBAL_REFERENCE_CACHE_SCHEMA = {
  units: {
    key: GLOBAL_KEYS.units,
    ttl: CACHE_TTL.units,
    mutation: "SET_UNITS",
    loadingFlag: "units",
    stateKey: "units",
  },
  currencies: {
    key: GLOBAL_KEYS.currencies,
    ttl: CACHE_TTL.currencies,
    mutation: "SET_CURRENCIES",
    loadingFlag: "currencies",
    stateKey: "currencies",
  },
  users: {
    key: GLOBAL_KEYS.users,
    ttl: CACHE_TTL.users,
    mutation: "SET_USERS",
    loadingFlag: "users",
    stateKey: "users",
  },
  orderStatuses: {
    key: GLOBAL_KEYS.orderStatuses,
    ttl: CACHE_TTL.orderStatuses,
    mutation: "SET_ORDER_STATUSES",
    loadingFlag: "orderStatuses",
    stateKey: "orderStatuses",
  },
  projectStatuses: {
    key: GLOBAL_KEYS.projectStatuses,
    ttl: CACHE_TTL.projectStatuses,
    mutation: "SET_PROJECT_STATUSES",
    loadingFlag: "projectStatuses",
    stateKey: "projectStatuses",
  },
  taskStatuses: {
    key: GLOBAL_KEYS.taskStatuses,
    ttl: CACHE_TTL.taskStatuses,
    mutation: "SET_TASK_STATUSES",
    loadingFlag: "taskStatuses",
    stateKey: "taskStatuses",
  },
  transactionCategories: {
    key: GLOBAL_KEYS.transactionCategories,
    ttl: CACHE_TTL.transactionCategories,
    mutation: "SET_TRANSACTION_CATEGORIES",
    loadingFlag: "transactionCategories",
    stateKey: "transactionCategories",
  },
  roles: {
    key: GLOBAL_KEYS.roles,
    ttl: CACHE_TTL.roles,
    mutation: "SET_ROLES",
    loadingFlag: "roles",
    stateKey: "roles",
  },
  leaveTypes: {
    key: GLOBAL_KEYS.leaveTypes,
    ttl: CACHE_TTL.leaveTypes,
    mutation: "SET_LEAVE_TYPES",
    loadingFlag: "leaveTypes",
    stateKey: "leaveTypes",
  },
  orderStatusCategories: {
    key: GLOBAL_KEYS.orderStatusCategories,
    ttl: CACHE_TTL.orderStatusCategories,
    mutation: "SET_ORDER_STATUS_CATEGORIES",
    loadingFlag: "orderStatusCategories",
    stateKey: "orderStatusCategories",
  },
};

export const COMPANY_SCOPED_CACHE_SCHEMA = {
  warehouses: {
    keyPrefix: "warehouses",
    ttl: CACHE_TTL.warehouses,
    loadingFlag: "warehouses",
    stateKey: "warehouses",
    clearMutations: ["SET_WAREHOUSES"],
  },
  cashRegisters: {
    keyPrefix: "cashRegisters",
    ttl: CACHE_TTL.cashRegisters,
    loadingFlag: "cashRegisters",
    stateKey: "cashRegisters",
    clearMutations: ["SET_CASH_REGISTERS"],
  },
  categories: {
    keyPrefix: "categories",
    ttl: CACHE_TTL.categories,
    loadingFlag: "categories",
    stateKey: "categories",
    clearMutations: ["SET_CATEGORIES"],
  },
};
