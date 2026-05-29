import { leafTransactionCategories } from "@/utils/transactionCategoryUtils";

export const TRANSACTION_CATEGORY_BINDING_KEYS = {
  ORDER: "order",
  CONTRACT: "contract",
  WAREHOUSE_PURCHASE: "warehouse.purchase",
  WAREHOUSE_RECEIPT: "warehouse.receipt",
  ADJUSTMENT_INCOME: "adjustment.income",
  ADJUSTMENT_OUTCOME: "adjustment.outcome",
  TRANSACTION_DEFAULT_INCOME: "transaction.default.income",
  TRANSACTION_DEFAULT_OUTCOME: "transaction.default.outcome",
  TRANSACTION_CONTRACT_INCOME: "transaction.contract.income",
  PRESET_WAREHOUSE_RECEIPT_DELIVERY_EXPENSE: "preset.warehouse.receipt.delivery.expense",
  PRESET_EMPLOYEE_BONUS: "preset.employee.bonus",
  PRESET_EMPLOYEE_PENALTY: "preset.employee.penalty",
  PRESET_EMPLOYEE_SALARY_ACCRUAL: "preset.employee.salary.accrual",
  PRESET_EMPLOYEE_SALARY_PAYMENT: "preset.employee.salary.payment",
  PRESET_EMPLOYEE_ADVANCE: "preset.employee.advance",
};

export const TRANSACTION_CATEGORY_BINDING_DEFAULTS = {
  [TRANSACTION_CATEGORY_BINDING_KEYS.ORDER]: 1,
  [TRANSACTION_CATEGORY_BINDING_KEYS.CONTRACT]: 30,
  [TRANSACTION_CATEGORY_BINDING_KEYS.WAREHOUSE_PURCHASE]: 6,
  [TRANSACTION_CATEGORY_BINDING_KEYS.WAREHOUSE_RECEIPT]: 6,
  [TRANSACTION_CATEGORY_BINDING_KEYS.ADJUSTMENT_INCOME]: 22,
  [TRANSACTION_CATEGORY_BINDING_KEYS.ADJUSTMENT_OUTCOME]: 21,
  [TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME]: 4,
  [TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_OUTCOME]: 14,
  [TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_CONTRACT_INCOME]: 30,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_WAREHOUSE_RECEIPT_DELIVERY_EXPENSE]: 16,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_BONUS]: 26,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_PENALTY]: 27,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_SALARY_ACCRUAL]: 24,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_SALARY_PAYMENT]: 7,
  [TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_ADVANCE]: 23,
};

const K = TRANSACTION_CATEGORY_BINDING_KEYS;

export const TRANSACTION_CATEGORY_BINDING_UI_GROUPS = [
  {
    id: "order",
    label: "bindingOrder",
    categoryType: "income",
    keys: [K.ORDER],
  },
  {
    id: "contract",
    label: "bindingContract",
    categoryType: "income",
    keys: [K.CONTRACT],
  },
  {
    id: "transaction_contract_income",
    label: "bindingTransactionContractIncome",
    categoryType: "income",
    keys: [K.TRANSACTION_CONTRACT_INCOME],
  },
  {
    id: "adjustment_income",
    label: "bindingAdjustmentIncome",
    categoryType: "income",
    keys: [K.ADJUSTMENT_INCOME],
  },
  {
    id: "transaction_default_income",
    label: "bindingTransactionDefaultIncome",
    categoryType: "income",
    keys: [K.TRANSACTION_DEFAULT_INCOME],
  },
  {
    id: "employee_penalty",
    label: "bindingPresetEmployeePenalty",
    categoryType: "income",
    keys: [K.PRESET_EMPLOYEE_PENALTY],
  },
  {
    id: "warehouse_purchase",
    label: "bindingWarehousePurchase",
    categoryType: "outcome",
    keys: [K.WAREHOUSE_PURCHASE],
  },
  {
    id: "warehouse_receipt",
    label: "bindingWarehouseReceipt",
    categoryType: "outcome",
    keys: [K.WAREHOUSE_RECEIPT],
  },
  {
    id: "adjustment_outcome",
    label: "bindingAdjustmentOutcome",
    categoryType: "outcome",
    keys: [K.ADJUSTMENT_OUTCOME],
  },
  {
    id: "transaction_default_outcome",
    label: "bindingTransactionDefaultOutcome",
    categoryType: "outcome",
    keys: [K.TRANSACTION_DEFAULT_OUTCOME],
  },
  {
    id: "warehouse_receipt_delivery",
    label: "bindingPresetWarehouseReceiptDeliveryExpense",
    categoryType: "outcome",
    keys: [K.PRESET_WAREHOUSE_RECEIPT_DELIVERY_EXPENSE],
  },
  {
    id: "employee_bonus",
    label: "bindingPresetEmployeeBonus",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_BONUS],
  },
  {
    id: "employee_salary",
    label: "bindingEmployeeSalary",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_SALARY_ACCRUAL, K.PRESET_EMPLOYEE_SALARY_PAYMENT],
  },
  {
    id: "employee_advance",
    label: "bindingPresetEmployeeAdvance",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_ADVANCE],
  },
];

export function parseBindingsFromApi(raw) {
  const bindings = {};
  if (raw == null) {
    return bindings;
  }

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const key = entry.binding_key ?? entry.bindingKey;
      const value = Number(entry.transaction_category_id ?? entry.transactionCategoryId);
      if (key && Number.isFinite(value) && value > 0) {
        bindings[key] = value;
      }
    });
    return bindings;
  }

  if (typeof raw !== "object") {
    return bindings;
  }

  Object.keys(raw).forEach((key) => {
    const value = Number(raw[key]);
    if (Number.isFinite(value) && value > 0) {
      bindings[key] = value;
    }
  });
  return bindings;
}

export function resolveBindingGroupCategoryId(bindings, group) {
  const source = bindings && typeof bindings === "object" ? bindings : {};
  for (const key of group.keys) {
    const value = source[key];
    if (value != null && value !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  for (const key of group.keys) {
    const fallback = TRANSACTION_CATEGORY_BINDING_DEFAULTS[key];
    if (fallback != null) {
      return fallback;
    }
  }
  return null;
}

export function applyBindingGroupCategoryId(bindings, group, categoryId) {
  const next = { ...(bindings && typeof bindings === "object" ? bindings : {}) };
  const parsed =
    categoryId != null && categoryId !== "" ? Number(categoryId) : null;
  const normalized =
    parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  for (const key of group.keys) {
    if (normalized == null) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  }

  return next;
}

export function flattenBindingsForPayload(bindings) {
  const payload = {};
  for (const group of TRANSACTION_CATEGORY_BINDING_UI_GROUPS) {
    const categoryId = resolveBindingGroupCategoryId(bindings, group);
    if (categoryId == null) {
      continue;
    }
    for (const key of group.keys) {
      payload[key] = categoryId;
    }
  }
  return payload;
}

export function filterCategoriesForBindingGroup(allCategories, group, currentCategoryId = null) {
  const list = Array.isArray(allCategories) ? allCategories : [];
  const wantedType = group.categoryType === "income" ? 1 : 0;
  let filtered = list.filter((category) => category.type === wantedType);
  const parsedCurrentId =
    currentCategoryId != null && currentCategoryId !== ""
      ? parseInt(currentCategoryId, 10)
      : null;

  if (parsedCurrentId && !filtered.some((category) => Number(category.id) === parsedCurrentId)) {
    const current = list.find((category) => Number(category.id) === parsedCurrentId);
    if (current) {
      filtered = [current, ...filtered];
    }
  }

  filtered = leafTransactionCategories(filtered, parsedCurrentId ? [parsedCurrentId] : []);

  return filtered.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    }),
  );
}

export function resolveBoundCategoryId(company, key, fallback) {
  const explicitFallback =
    fallback != null ? fallback : TRANSACTION_CATEGORY_BINDING_DEFAULTS[key];
  const bindings = company?.transactionCategoryBindings || {};
  const value = bindings[key];
  if (value == null || value === "") {
    return explicitFallback ?? null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : explicitFallback ?? null;
}
