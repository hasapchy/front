export const TRANSACTION_FILTERS_PRESETS = {
    full: {
        cashRegister: {
            visible: true,
            label: 'allCashRegisters',
            options: []
        },
        transactionType: {
            visible: true,
            label: 'allTransactionTypes',
            options: [
                { value: 'income', label: 'income' },
                { value: 'outcome', label: 'outcome' },
                { value: 'transfer', label: 'transfer' }
            ]
        },
        source: {
            visible: true,
            label: 'allSources',
            options: [
                { value: 'sale', label: 'sale' },
                { value: 'order', label: 'order' },
                { value: 'other', label: 'other' }
            ]
        },
        project: {
            visible: true,
            label: 'allProjects',
            options: []
        },
        debt: {
            visible: true,
            label: 'allTransactions',
            options: [
                { value: 'all', label: 'allTransactions' },
                { value: 'false', label: 'nonDebtTransactions' },
                { value: 'true', label: 'debtsOnly' }
            ]
        },
        date: {
            visible: true,
            label: 'allTime',
            options: [
                { value: 'all_time', label: 'allTime' },
                { value: 'today', label: 'today' },
                { value: 'yesterday', label: 'yesterday' },
                { value: 'this_week', label: 'thisWeek' },
                { value: 'this_month', label: 'thisMonth' },
                { value: 'last_week', label: 'lastWeek' },
                { value: 'last_month', label: 'lastMonth' },
                { value: 'custom', label: 'selectDates' }
            ],
            showCustomDates: true
        }
    }
};

export default TRANSACTION_FILTERS_PRESETS;

