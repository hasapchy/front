export const TRANSACTION_CATEGORY_BINDING_KEYS = {
  ORDER: "order",
  CONTRACT: "contract",
  WAREHOUSE_PURCHASE: "warehouse.purchase",
  WAREHOUSE_RECEIPT: "warehouse.receipt",
  ADJUSTMENT_INCOME: "adjustment.income",
  ADJUSTMENT_OUTCOME: "adjustment.outcome",
  TRANSACTION_DEFAULT_INCOME: "transaction.default.income",
  TRANSACTION_DEFAULT_OUTCOME: "transaction.default.outcome",
  PRESET_WAREHOUSE_RECEIPT_DELIVERY_EXPENSE: "preset.warehouse.receipt.delivery.expense",
  PRESET_EMPLOYEE_BONUS: "preset.employee.bonus",
  PRESET_EMPLOYEE_PENALTY: "preset.employee.penalty",
  PRESET_EMPLOYEE_SALARY_ACCRUAL: "preset.employee.salary.accrual",
  PRESET_EMPLOYEE_SALARY_PAYMENT: "preset.employee.salary.payment",
  PRESET_EMPLOYEE_ADVANCE: "preset.employee.advance",
  CASH_TRANSFER_OUTCOME: "cash.transfer.outcome",
  CASH_TRANSFER_INCOME: "cash.transfer.income",
  WAREHOUSE_WRITEOFF_SUPPLIER_RETURN: "warehouse.writeoff.supplier.return",
  WAREHOUSE_RETURN_PAYABLE_REDUCTION: "warehouse.return.payable_reduction",
  WAREHOUSE_RETURN_SUPPLIER_CREDIT: "warehouse.return.supplier_credit",
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
    id: "employee_salary_accrual",
    label: "bindingPresetEmployeeSalaryAccrual",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_SALARY_ACCRUAL],
  },
  {
    id: "employee_salary_payment",
    label: "bindingPresetEmployeeSalaryPayment",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_SALARY_PAYMENT],
  },
  {
    id: "employee_advance",
    label: "bindingPresetEmployeeAdvance",
    categoryType: "outcome",
    keys: [K.PRESET_EMPLOYEE_ADVANCE],
  },
  {
    id: "cash_transfer_outcome",
    label: "bindingCashTransferOutcome",
    categoryType: "outcome",
    keys: [K.CASH_TRANSFER_OUTCOME],
  },
  {
    id: "cash_transfer_income",
    label: "bindingCashTransferIncome",
    categoryType: "income",
    keys: [K.CASH_TRANSFER_INCOME],
  },
  {
    id: "warehouse_writeoff_supplier_return",
    label: "bindingWarehouseWriteoffSupplierReturn",
    categoryType: "income",
    keys: [K.WAREHOUSE_WRITEOFF_SUPPLIER_RETURN],
  },
  {
    id: "warehouse_return_payable_reduction",
    label: "bindingWarehouseReturnPayableReduction",
    categoryType: "income",
    keys: [K.WAREHOUSE_RETURN_PAYABLE_REDUCTION],
  },
  {
    id: "warehouse_return_supplier_credit",
    label: "bindingWarehouseReturnSupplierCredit",
    categoryType: "income",
    keys: [K.WAREHOUSE_RETURN_SUPPLIER_CREDIT],
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
  const source = bindings && typeof bindings === "object" ? bindings : {};
  Object.keys(source).forEach((key) => {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) {
      payload[key] = value;
    }
  });
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

  return filtered.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    }),
  );
}

export function resolveBoundCategoryId(company, key) {
  const bindings = company?.transactionCategoryBindings || {};
  const value = bindings[key];
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
