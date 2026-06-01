import { TRANSACTION_CATEGORY_BINDING_KEYS } from "@/constants/transactionCategoryBindings";

const full = {
    client: { visible: true },
    project: { visible: true },
    debt: { visible: true },
    type: { visible: true },
    category: {
        visible: true,
    },
    paymentType: { visible: false },
    source: { visible: true },
    note: { required: false },
};

const projectBalanceBase = {
    client: { visible: false, excludeFromRequest: true },
    project: { visible: false },
    debt: { visible: false, enforcedValue: false },
    paymentType: { visible: false },
    source: { visible: true },
    options: { submitClientBalanceId: true },
};

export const TRANSACTION_FORM_PRESETS = {
    balanceAdjustment: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        note: { required: true },
        category: {
            visible: false,
            bindingKeyByType: {
                income: TRANSACTION_CATEGORY_BINDING_KEYS.ADJUSTMENT_INCOME,
                outcome: TRANSACTION_CATEGORY_BINDING_KEYS.ADJUSTMENT_OUTCOME,
            },
            enforcedByType: {
                income: 22,
                outcome: 21,
            },
        },
        source: { visible: false },
        options: {
            showBalancePreview: true,
        },
    },
    orderPayment: {
        type: { visible: false },
        client: { visible: false },
        project: { visible: false },
        source: { visible: false },
        debt: { visible: false },
        category: {
            visible: false,
            bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.ORDER,
            enforcedValue: 25,
        },
    },
    contractPayment: {
        type: { visible: false },
        client: { visible: false },
        project: { visible: false },
        source: { visible: false },
        debt: { visible: false },
        category: {
            visible: false,
            bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.CONTRACT,
            enforcedValue: 30,
        },
    },
    warehouseReceiptGoodsExpense: {
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        client: { visible: true, disabled: true },
        project: { visible: true },
        source: { visible: false },
        debt: { visible: false },
        paymentType: { visible: false },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.WAREHOUSE_RECEIPT, enforcedValue: 6 },
        options: { warehouseReceiptGoodsPayment: true },
    },
    warehousePurchaseGoodsExpense: {
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        client: { visible: true, disabled: true },
        project: { visible: true },
        source: { visible: false },
        debt: { visible: false },
        paymentType: { visible: false },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.WAREHOUSE_PURCHASE, enforcedValue: 6 },
        options: { warehousePurchaseGoodsPayment: true },
    },
    warehouseReceiptDeliveryExpense: {
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        client: { visible: true, disabled: false, required: false },
        project: { visible: true },
        source: { visible: false },
        debt: { visible: true, visibleWhenClient: true },
        paymentType: { visible: false },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_WAREHOUSE_RECEIPT_DELIVERY_EXPENSE, enforcedValue: 16 },
    },
    warehouseReceiptGeneralExpense: {
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        client: { visible: true, disabled: false, required: false },
        project: { visible: true },
        source: { visible: false },
        debt: { visible: true, visibleWhenClient: true },
        paymentType: { visible: false },
        category: {
            visible: true,
        },
    },
    projectBalance: {
        ...projectBalanceBase,
    },
    projectBalanceIncome: {
        ...projectBalanceBase,
        type: { visible: false, enforcedValue: 'income', readonly: true },
    },
    projectBalanceOutcome: {
        ...projectBalanceBase,
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
    },
    clientPayment: {
        client: { visible: false },
        debt: { visible: false, enforcedValue: false },
        project: { visible: false },
        source: { visible: false },
        paymentType: { visible: false },
    },
    employeeBonus: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_BONUS, enforcedValue: 26 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { showClientBalanceSelect: true },
    },
    employeePenalty: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'income', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_PENALTY, enforcedValue: 27 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { showClientBalanceSelect: true },
    },
    employeeSalaryAccrual: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_SALARY_ACCRUAL, enforcedValue: 24 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { showClientBalanceSelect: true },
    },
    employeeSalaryPayment: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_SALARY_PAYMENT, enforcedValue: 7 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { loadSalaryAmountByPaymentType: true, showClientBalanceSelect: true },
    },
    employeeAdvance: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_ADVANCE, enforcedValue: 23 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { showClientBalanceSelect: true },
    },
    projectEmployeeBonus: {
        client: { visible: true, clientTypeFilter: ['employee'], required: true },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, bindingKey: TRANSACTION_CATEGORY_BINDING_KEYS.PRESET_EMPLOYEE_BONUS, enforcedValue: 26 },
        paymentType: { visible: false },
        source: { visible: false },
        options: { showClientBalanceSelect: true },
    },
    full,
    fullIncome: {
        ...full,
        type: { ...full.type, visible: false, enforcedValue: 'income', readonly: true },
        debt: { visible: false, enforcedValue: false },
        paymentType: { visible: false },
        options: { bindProjectAndContract: true },
    },
    fullOutcome: {
        ...full,
        type: { ...full.type, visible: false, enforcedValue: 'outcome', readonly: true },
        paymentType: { visible: false },
        contract: { visible: false },
        options: { bindProjectAndContract: true },
    },
};

export const DEFAULT_TRANSACTION_FORM_PRESET = TRANSACTION_FORM_PRESETS.full;

export default TRANSACTION_FORM_PRESETS;

