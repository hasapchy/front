const full = {
    client: { visible: true },
    project: { visible: true },
    debt: { visible: true },
    type: { visible: true },
    category: {
        visible: true,
        excludedIds: [7, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27],
    },
    paymentType: { visible: false },
    source: { visible: true },
    note: { required: false },
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
            enforcedByType: {
                income: 22,
                outcome: 21,
            },
        },
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
            enforcedValue: 25,
        },
    },
    projectBalance: {
        client: { visible: false, excludeFromRequest: true },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        paymentType: { visible: false },
        source: { visible: true },
    },
    projectBalanceIncome: {
        client: { visible: false, excludeFromRequest: true },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        paymentType: { visible: false },
        source: { visible: true },
        type: { visible: false, enforcedValue: 'income', readonly: true },
    },
    projectBalanceOutcome: {
        client: { visible: false, excludeFromRequest: true },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        paymentType: { visible: false },
        source: { visible: true },
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
        category: { visible: false, enforcedValue: 26 },
    },
    employeePenalty: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'income', readonly: true },
        category: { visible: false, enforcedValue: 27 },
    },
    employeeSalaryAccrual: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 24 },
        paymentType: { visible: true },
        options: { useSalaryAccrualApi: true },
    },
    employeeSalaryPayment: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 7 },
        paymentType: { visible: true },
        options: { loadSalaryAmountByPaymentType: true },
    },
    employeeAdvance: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 23 },
    },
    projectEmployeeBonus: {
        client: { visible: true, clientTypeFilter: ['employee'], required: true },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 26 },
    },
    full,
    fullIncome: {
        ...full,
        type: { ...full.type, visible: false, enforcedValue: 'income', readonly: true },
        paymentType: { visible: false },
        options: { bindProjectAndContract: true },
    },
    fullOutcome: {
        ...full,
        type: { ...full.type, visible: false, enforcedValue: 'outcome', readonly: true },
        paymentType: { visible: false },
        options: { bindProjectAndContract: true },
    },
};

export default TRANSACTION_FORM_PRESETS;

