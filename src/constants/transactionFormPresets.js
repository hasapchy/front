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
};

export default TRANSACTION_FORM_PRESETS;

