import {
    getTransactionBalancesList,
    findBalanceById,
    isClientBalanceSelected,
    isCashSelectDisabled,
    resolveCashRegistersForForm,
    buildBalanceDefaultsPatch,
    applyBalanceDefaultsPatchToVm,
    filterCashRegistersByClientBalance,
} from '@/utils/clientBalanceCashUtils';

const DEFAULT_CLIENT_BALANCE_CASH_FIELDS = {
    editingItemId: 'editingItemId',
    selectedBalanceId: 'selectedBalanceId',
    selectedClient: 'selectedClient',
    clientBalances: 'clientBalances',
    allCashRegisters: 'allCashRegisters',
    cashId: 'cashId',
    currencyId: 'currencyId',
    paymentType: false,
    formConfig: false,
};

function readVmField(vm, fieldKey) {
    if (fieldKey === false || fieldKey == null) {
        return undefined;
    }
    if (!Object.hasOwn(vm, fieldKey) && !(vm.$data != null && Object.hasOwn(vm.$data, fieldKey))) {
        return undefined;
    }
    return vm[fieldKey];
}

export default {
    computed: {
        _clientBalanceCashFields() {
            return {
                ...DEFAULT_CLIENT_BALANCE_CASH_FIELDS,
                ...(this.$options.clientBalanceCashFields || {}),
            };
        },
        transactionBalancesList() {
            const fields = this._clientBalanceCashFields;
            return getTransactionBalancesList(
                readVmField(this, fields.selectedClient),
                readVmField(this, fields.clientBalances) ?? [],
            );
        },
        selectedBalanceRecord() {
            const fields = this._clientBalanceCashFields;
            return findBalanceById(
                this.transactionBalancesList,
                readVmField(this, fields.selectedBalanceId),
            );
        },
        clientBalanceSelected() {
            const fields = this._clientBalanceCashFields;
            return isClientBalanceSelected(
                readVmField(this, fields.editingItemId),
                this.selectedBalanceRecord,
            );
        },
        cashRegistersForForm() {
            const fields = this._clientBalanceCashFields;
            const formConfig = readVmField(this, fields.formConfig);
            const paymentType = readVmField(this, fields.paymentType);
            return resolveCashRegistersForForm({
                clientBalanceSelected: this.clientBalanceSelected,
                selectedBalanceRecord: this.selectedBalanceRecord,
                allCashRegisters: readVmField(this, fields.allCashRegisters) || [],
                paymentTypeFieldVisible: formConfig?.paymentType?.visible === true,
                paymentType,
            });
        },
        cashSelectDisabled() {
            return isCashSelectDisabled(
                this.clientBalanceSelected,
                this.cashRegistersForForm,
            );
        },
    },
    methods: {
        filterCashRegistersStrictForBalance(balance) {
            const fields = this._clientBalanceCashFields;
            return filterCashRegistersByClientBalance(
                balance,
                readVmField(this, fields.allCashRegisters) || [],
            );
        },
        applyBalanceDefaults(balanceId, options = {}) {
            const fields = this._clientBalanceCashFields;
            if (readVmField(this, fields.editingItemId)) {
                return null;
            }
            const patch = buildBalanceDefaultsPatch({
                balanceId,
                balances: this.transactionBalancesList,
                allCashRegisters: readVmField(this, fields.allCashRegisters) || [],
                currentCashId: readVmField(this, fields.cashId),
                includePaymentType: options.includePaymentType !== false
                    && fields.paymentType !== false,
            });
            if (!patch) {
                return null;
            }
            applyBalanceDefaultsPatchToVm(this, patch, fields);
            if (typeof options.afterApply === 'function') {
                options.afterApply(patch, findBalanceById(this.transactionBalancesList, balanceId));
            }
            return patch;
        },
        onBalanceChanged(balanceId) {
            const fields = this._clientBalanceCashFields;
            const resolved = typeof this.resolveBalanceIdOnChange === 'function'
                ? this.resolveBalanceIdOnChange(balanceId)
                : balanceId;
            const value = resolved == null || resolved === '' ? null : resolved;
            this[fields.selectedBalanceId] = value;
            if (!readVmField(this, fields.editingItemId)) {
                this.applyBalanceDefaults(value);
            }
        },
        syncCashIdFromBalanceFilter() {
            const fields = this._clientBalanceCashFields;
            if (!this.clientBalanceSelected || !this.selectedBalanceRecord) {
                return;
            }
            const strict = this.filterCashRegistersStrictForBalance(this.selectedBalanceRecord);
            const cashId = readVmField(this, fields.cashId);
            const selected = (readVmField(this, fields.allCashRegisters) || []).find(
                (c) => c.id == cashId,
            );
            if (!selected || !strict.some((c) => Number(c.id) === Number(selected.id))) {
                this[fields.cashId] = strict.length ? strict[0].id : '';
            }
        },
    },
};
