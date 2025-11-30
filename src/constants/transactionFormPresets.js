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
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: false },
        source: { visible: true },
    },
    clientPayment: {
        client: { visible: false },
        debt: { visible: false, enforcedValue: false },
        project: { visible: false },
    },
    employeeBonus: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'income', readonly: true },
        category: { visible: false, enforcedValue: 26 },
    },
    employeePenalty: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 27 },
    },
    employeeSalaryAccrual: {
        client: { visible: false },
        project: { visible: false },
        debt: { visible: false, enforcedValue: true },
        type: { visible: false, enforcedValue: 'outcome', readonly: true },
        category: { visible: false, enforcedValue: 24 },
    },
    full: {
        client: { visible: true },
        project: { visible: true },
        debt: { visible: true },
        type: { visible: true },
        category: { visible: true },
        source: { visible: true },
        note: { required: false },
    },
};

export default TRANSACTION_FORM_PRESETS;

