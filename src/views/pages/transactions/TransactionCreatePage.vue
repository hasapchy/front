<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ titleText }}</h2>
        <TransactionFormFields v-model:selectedClient="selectedClient" v-model:date="date" v-model:type="type"
            v-model:cashId="cashId" v-model:isDebt="isDebt" v-model:origAmount="origAmount"
            v-model:currencyId="currencyId" v-model:categoryId="categoryId" v-model:projectId="projectId"
            v-model:note="note" v-model:selectedBalanceId="selectedBalanceId" v-model:paymentType="paymentType"
            :editingItemId="editingItemId" :orderId="orderId" :initialProjectId="initialProjectId"
            :allCashRegisters="cashRegistersForForm" :currencies="currencies" :filteredCategories="filteredCategories"
            :allProjects="allProjects" :formConfig="formConfig" :isCategoryDisabled="isCategoryDisabled"
            :client-balances="clientBalances"
            @balance-changed="onBalanceChanged"
        />
        <TransactionBalancePreview :showPreview="showAdjustmentBalancePreview"
            :currentClientBalance="currentClientBalance" :type="type" :origAmount="origAmount"
            :defaultCurrencySymbol="defaultCurrencySymbol" />
        <TransactionExchangeRateSection :showExchangeRate="showExchangeRate"
            :showCalculatedAmount="showCalculatedAmount" v-model:exchangeRate="exchangeRate" :origAmount="origAmount"
            :transactionCurrencySymbol="transactionCurrencySymbol" :cashCurrencySymbol="cashCurrencySymbol"
            :calculatedCashAmount="calculatedCashAmount" :isTransferTransaction="isTransferTransaction"
            @exchange-rate-manual="handleExchangeRateChange" />
        <div class="mt-2" v-if="isFieldVisible('source') && !orderId && $store.getters.hasPermission('contracts_create')">
            <ContractSearch v-model:selectedContract="selectedContractForSource" :showLabel="true" />
        </div>
        <TransactionSourceSection :orderId="orderId" :selectedSource="selectedSource" :sourceType="sourceType"
            :formConfig="formConfig" />
    </div>
    <div v-if="readOnlyReason" class="mt-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
        {{ readOnlyReason }}
    </div>
    <TransactionFormActions :editingItemId="editingItemId" :isDeletedTransaction="isDeletedTransaction"
        :isTransferTransaction="isTransferTransaction" :saveLoading="saveLoading" :deleteLoading="deleteLoading"
        @save="save" @delete="showDeleteDialog" @copy="copyTransaction" />
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteTransaction')" :confirm-text="$t('deleteTransaction')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import ClientDto from '@/dto/client/ClientDto';
import TransactionController from '@/api/TransactionController';
import OrderController from '@/api/OrderController';
import SaleController from '@/api/SaleController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import OrderStatusController from '@/api/OrderStatusController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import transactionFormConfigMixin from "@/mixins/transactionFormConfigMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { roundValue } from '@/utils/numberUtils';
import AppController from '@/api/AppController';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import TransactionFormFields from '@/views/components/transactions/TransactionFormFields.vue';
import TransactionExchangeRateSection from '@/views/components/transactions/TransactionExchangeRateSection.vue';
import TransactionBalancePreview from '@/views/components/transactions/TransactionBalancePreview.vue';
import TransactionSourceSection from '@/views/components/transactions/TransactionSourceSection.vue';
import TransactionFormActions from '@/views/components/transactions/TransactionFormActions.vue';
import ContractSearch from '@/views/components/app/search/ContractSearch.vue';
import CompaniesController from '@/api/CompaniesController';
import UsersController from '@/api/UsersController';


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin, transactionFormConfigMixin, dateFormMixin, storeDataLoaderMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request", 'copy-transaction'],
    components: {
        AlertDialog,
        TransactionFormFields,
        TransactionExchangeRateSection,
        TransactionBalancePreview,
        TransactionSourceSection,
        TransactionFormActions,
        ContractSearch
    },
    props: {
        editingItem: { type: TransactionDto, required: false, default: null },
        initialClient: { type: ClientDto, default: null },
        initialProjectId: { type: [String, Number, null], default: null },
        orderId: { type: [String, Number], required: false },
        defaultCashId: { type: Number, default: null, required: false },
        prefillAmount: { type: [Number, String], default: null },
        prefillCurrencyId: { type: [Number, String], default: null },
        isPaymentModal: { type: Boolean, default: false },
        // Конфигурация отображения полей формы
        formConfig: {
            type: Object,
            default: () => ({}),
        },
        headerText: {
            type: String,
            default: '',
        },
        currentClientBalance: {
            type: [Number, String, null],
            default: null,
        },
        clientBalances: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            // Для заказов всегда тип "income" и не долговая
            type: this.orderId ? "income" : (this.editingItem ? this.editingItem.typeName() : "income"),
            cashId: this.editingItem?.cashId || this.defaultCashId || '',
            origAmount: this.editingItem?.origAmount ?? (this.prefillAmount ? parseFloat(this.prefillAmount) || 0 : 0),
            currencyId: this.editingItem?.origCurrencyId || this.prefillCurrencyId || '',
            categoryId: this.editingItem?.categoryId ?? 4, // По умолчанию id = 4 для типа income
            projectId: this.editingItem?.projectId || this.initialProjectId || '',
            date: this.getFormattedDate(this.editingItem?.date),
            note: this.editingItem?.note || '',
            isDebt: this.orderId ? false : (this.editingItem?.isDebt ?? this.fieldConfig('debt').enforcedValue ?? false),
            selectedClient: this.editingItem?.client || this.initialClient,
            selectedBalanceId: null,
            selectedSource: null,
            sourceType: '',
            paymentType: 1,
            currencies: [],
            allCategories: [],
            allCashRegisters: [],
            orderInfo: null,
            exchangeRate: null,
            isExchangeRateManual: false
        }
    },
    computed: {
        titleText() {
            if (this.headerText) {
                return this.headerText;
            }
            return this.editingItem ? this.$t('editTransaction') : this.$t('createTransaction');
        },
        isDeletedTransaction() {
            return Boolean(this.editingItem?.isDeleted || this.editingItem?.is_deleted);
        },
        isTransferTransaction() {
            return this.editingItem?.isTransfer == 1;
        },
        isSourceRestricted() {
            if (!this.editingItem) {
                return false;
            }
            const source = this.editingItem.sourceType || '';
            return Boolean(source && (source.includes('Order') || source.includes('Sale') || source.includes('WhReceipt')));
        },
        readOnlyReason() {
            if (this.isDeletedTransaction) {
                return this.$t('transactionDeletedReadonly');
            }
            if (this.isSourceRestricted) {
                return this.$t('transactionReadonlyDueToSource');
            }
            return '';
        },
        filteredCategories() {
            let filtered = this.allCategories;
            const categoryConfig = this.fieldConfig('category');
            const currentCategoryId = this.categoryId ? parseInt(this.categoryId) : null;

            if (this.type === 'income' || this.type === 'outcome') {
                const wanted = this.type === 'income' ? 1 : 0;
                filtered = filtered.filter(cat => cat.type === wanted);
            }

            if (categoryConfig.allowedIds && Array.isArray(categoryConfig.allowedIds)) {
                filtered = filtered.filter(cat => categoryConfig.allowedIds.includes(cat.id));
            }

            if (categoryConfig.excludedIds && Array.isArray(categoryConfig.excludedIds)) {
                filtered = filtered.filter(cat => {
                    if (currentCategoryId && cat.id === currentCategoryId) {
                        return true;
                    }
                    return !categoryConfig.excludedIds.includes(cat.id);
                });
            }

            return filtered;
        },
        isCategoryDisabled() {
            return (cat) => {
                const categoryConfig = this.fieldConfig('category');
                if (categoryConfig.excludedIds && Array.isArray(categoryConfig.excludedIds)) {
                    if (categoryConfig.excludedIds.includes(cat.id) && cat.id !== this.categoryId) {
                        return true;
                    }
                }
                return false;
            };
        },
        allProjects() {
            // ✅ Берем напрямую из Store - автоматически обновляется при изменениях
            const activeProjects = this.$store.getters.activeProjects || [];

            // Если редактируем транзакцию и у неё есть проект, который завершен (его нет в activeProjects),
            // добавляем его в список опций
            if (this.editingItem && this.editingItem.projectId && this.editingItem.projectName) {
                const hasProject = activeProjects.some(p => p.id === this.editingItem.projectId);
                if (!hasProject) {
                    // Проект завершен, добавляем его вручную
                    return [
                        ...activeProjects,
                        { id: this.editingItem.projectId, name: this.editingItem.projectName }
                    ];
                }
            }

            return activeProjects;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store?.state?.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        },
        showAdjustmentBalancePreview() {
            return !!this.formConfig?.options?.showBalancePreview && this.currentClientBalance != null;
        },
        showExchangeRate() {
            if (!this.cashId || !this.currencyId) return false;
            const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
            if (!selectedCash) return false;
            const cashCurrencyId = selectedCash.currency_id || selectedCash.currencyId;
            const transactionCurrencyId = this.currencyId;
            return cashCurrencyId != transactionCurrencyId;
        },
        cashCurrencySymbol() {
            if (!this.cashId) return '';
            const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
            return selectedCash?.currencySymbol || '';
        },
        transactionCurrencySymbol() {
            if (!this.currencyId) return '';
            const currency = this.currencies.find(c => c.id == this.currencyId);
            return currency?.symbol || '';
        },
        calculatedCashAmount() {
            if (!this.exchangeRate || !this.origAmount) return null;
            const result = parseFloat(this.origAmount) * parseFloat(this.exchangeRate);
            return Math.round(result * 100) / 100;
        },
        showCalculatedAmount() {
            if (!this.cashId || !this.currencyId) return false;
            const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
            if (!selectedCash) return false;
            const cashCurrencyId = selectedCash.currency_id || selectedCash.currencyId;
            const transactionCurrencyId = this.currencyId;
            return !!(this.calculatedCashAmount && cashCurrencyId != transactionCurrencyId);
        },
        cashRegistersForForm() {
            if (!this.formConfig?.paymentType?.visible || this.paymentType === undefined || this.paymentType === null) {
                return this.allCashRegisters;
            }
            const paymentTypeIsCash = this.paymentType === 1;
            return this.allCashRegisters.filter(c => Boolean(c.isCash ?? c.is_cash) === paymentTypeIsCash);
        },
        selectedContractForSource: {
            get() {
                return this.sourceType === 'contract' ? this.selectedSource : null;
            },
            set(value) {
                this.selectedSource = value;
                this.sourceType = value ? 'contract' : '';
            }
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCategories(),
                this.fetchAllCashRegisters(),
                this.loadOrderInfo()
            ]);

            if (!this.$store.getters.projects?.length) {
                await this.$store.dispatch('loadProjects');
            }

            if (!this.editingItem) {
                if (this.prefillAmount) {
                    const amount = parseFloat(this.prefillAmount);
                    if (amount > 0) {
                        this.origAmount = amount;
                    }
                }

                if (this.prefillCurrencyId && !this.currencyId) {
                    this.currencyId = this.prefillCurrencyId;
                }
            }

            if (this.showExchangeRate && !this.editingItemId) {
                await this.calculateExchangeRate();
            }

            if (this.clientBalances && this.clientBalances.length > 0 && !this.selectedBalanceId) {
                const defaultBalance = this.clientBalances.find(b => b.isDefault);
                this.selectedBalanceId = defaultBalance ? defaultBalance.id : (this.clientBalances[0]?.id || null);
            }

            this.applyTypeConstraints();
            this.applyDebtConstraints();
            this.applyCategoryConstraints();
            if (!this.editingItemId && this.formConfig?.paymentType?.visible && this.allCashRegisters?.length) {
                const isCash = this.paymentType === 1;
                const selected = this.allCashRegisters.find(c => c.id == this.cashId);
                if (selected && Boolean(selected.is_cash ?? selected.isCash) !== isCash) {
                    const matching = this.allCashRegisters.filter(c => Boolean(c.is_cash ?? c.isCash) === isCash);
                    this.cashId = matching.length ? matching[0].id : '';
                }
            }
            if (!this.editingItem && this.formConfig?.options?.loadSalaryAmountByPaymentType && this.selectedClient?.employeeId) {
                await this.loadEmployeeSalaryAmount();
            }
            this.saveInitialState();
        });
    },
    methods: {
        onBalanceChanged(balanceId) {
            this.selectedBalanceId = balanceId;
        },
        async loadEmployeeSalaryAmount() {
            if (!this.selectedClient?.employeeId) return;
            try {
                const data = await UsersController.getSalaries(this.selectedClient.employeeId);
                const salaries = data?.salaries || [];
                const salary = salaries.find(s => Number(s.payment_type) === Number(this.paymentType) && !s.end_date);
                if (salary?.amount != null) {
                    this.origAmount = parseFloat(salary.amount);
                    if (salary.currency_id && !this.currencyId) {
                        this.currencyId = salary.currency_id;
                    }
                }
            } catch (e) {
                console.error('Error loading employee salary:', e);
            }
        },
        translateTransactionCategory,
        ensureEditable(eventName = 'saved-error') {
            if (!this.isDeletedTransaction && !this.isSourceRestricted) {
                return true;
            }
            const message = this.readOnlyReason || this.$t('transactionDeletedReadonly');
            this.$emit(eventName, message);
            return false;
        },
        applyCategoryConstraints() {
            const config = this.fieldConfig('category');
            if (config.visible === false) {
                let enforcedValue = config.enforcedByType?.[this.type] ?? config.enforcedValue;
                if (enforcedValue != null) {
                    this.categoryId = enforcedValue;
                }
            }
        },
        applyTypeConstraints() {
            if (!this.editingItemId) {
                const enforcedValue = this.fieldConfig('type').enforcedValue;
                if (enforcedValue != null) {
                    this.type = enforcedValue;
                    if (this.fieldConfig('category').visible !== false) {
                        this.categoryId = enforcedValue === 'outcome' ? 14 : 4;
                    }
                }
            }
        },
        applyDebtConstraints() {
            if (!this.editingItemId) {
                const enforcedValue = this.fieldConfig('debt').enforcedValue;
                if (enforcedValue != null) {
                    this.isDebt = enforcedValue;
                }
            }
        },
        getFormState() {
            return {
                selectedClient: this.selectedClient?.id || null,
                type: this.type,
                origAmount: this.origAmount,
                date: this.date,
                note: this.note,
                categoryId: this.categoryId,
                cashId: this.cashId,
                currencyId: this.currencyId,
                projectId: this.isFieldVisible('project') ? this.projectId : null,
                isDebt: this.isDebt,
                sourceType: this.getSourceTypeForBackend(),
                sourceId: this.selectedSource?.id || null
            };
        },
        getSourceTypeForBackend() {
            if (!this.sourceType || !this.selectedSource) return null;

            const typeMap = {
                'order': 'App\\Models\\Order',
                'sale': 'App\\Models\\Sale',
                'warehouse_receipt': 'App\\Models\\WhReceipt',
                'contract': 'App\\Models\\ProjectContract'
            };

            return typeMap[this.sourceType] || null;
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchAllCategories() {
            await this.loadStoreData({
                getterName: 'transactionCategories',
                dispatchName: 'loadTransactionCategories',
                localProperty: 'allCategories',
                defaultValue: []
            });
        },
        async fetchAllCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'allCashRegisters',
                defaultValue: [],
                onLoaded: (cashRegisters) => {
                    if (cashRegisters?.length && !this.cashId) {
                        this.cashId = this.defaultCashId || cashRegisters[0].id;
                        if (!this.currencyId) {
                            this.updateCurrencyFromCash(this.cashId);
                        }
                    }
                }
            });
        },
        async calculateExchangeRate() {
            if (!this.showExchangeRate || this.isExchangeRateManual || !this.currencyId || !this.cashId) {
                this.exchangeRate = null;
                return;
            }

            const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
            if (!selectedCash) {
                this.exchangeRate = null;
                return;
            }

            const transactionCurrencyId = parseInt(this.currencyId);
            const cashCurrencyId = parseInt(selectedCash.currency_id || selectedCash.currencyId);

            if (transactionCurrencyId == cashCurrencyId) {
                this.exchangeRate = '1.0';
                return;
            }

            try {
                const transactionCurrency = this.currencies.find(c => c.id == transactionCurrencyId);
                const cashCurrency = this.currencies.find(c => c.id == cashCurrencyId);
                const defaultCurrency = this.currencies.find(c => c.isDefault);

                if (!transactionCurrency || !cashCurrency || !defaultCurrency) {
                    this.exchangeRate = '1.0';
                    return;
                }

                const fromRateData = await AppController.getCurrencyExchangeRate(transactionCurrencyId);
                const toRateData = await AppController.getCurrencyExchangeRate(cashCurrencyId);

                const fromRate = parseFloat(fromRateData?.exchange_rate);
                const toRate = parseFloat(toRateData?.exchange_rate);

                if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
                    this.exchangeRate = '1.0';
                    return;
                }

                let calculatedRate;
                if (transactionCurrencyId == defaultCurrency.id) {
                    calculatedRate = (1 / toRate).toFixed(6);
                } else if (cashCurrencyId == defaultCurrency.id) {
                    calculatedRate = fromRate.toFixed(6);
                } else {
                    calculatedRate = (fromRate / toRate).toFixed(6);
                }

                this.exchangeRate = calculatedRate;
            } catch (error) {
                this.exchangeRate = '1.0';
            }
        },
        handleExchangeRateChange() {
            this.isExchangeRateManual = true;
        },
        async save() {
            if (!this.ensureEditable('saved-error')) {
                return;
            }
            return crudFormMixin.methods.save.call(this);
        },
        prepareSave() {
            if (this.initialProjectId && !this.fieldConfig('client').excludeFromRequest) {
                if (!(this.isFieldVisible('client') && this.isFieldRequired('client'))) {
                    const project = this.allProjects.find(p => p.id === this.projectId) || null;
                    if (project && project.client) {
                        this.selectedClient = project.client;
                    }
                }
            }
            if (this.isDebt && !this.selectedClient?.id) {
                throw new Error('При транзакции "в кредит" должен быть выбран клиент');
            }
            if (this.isFieldRequired('note') && (!this.note || String(this.note).trim() === '')) {
                throw new Error('Заполните примечание');
            }

            if (this.formConfig?.options?.useSalaryAccrualApi && this.selectedClient?.employeeId && !this.editingItemId) {
                const companyId = this.$store.getters.currentCompanyId;
                if (!companyId) {
                    throw new Error(this.$t('companyNotSelected') || 'Выберите компанию');
                }
                if (!this.date || !this.cashId) {
                    throw new Error(this.$t('fillRequiredFields') || 'Заполните обязательные поля');
                }
                return {
                    _useSalaryAccrualApi: true,
                    date: this.date,
                    cash_id: this.cashId,
                    note: this.note || null,
                    user_ids: [Number(this.selectedClient.employeeId)],
                    payment_type: Boolean(this.paymentType),
                };
            }

            const projectIdForSubmit = this.projectId || this.initialProjectId || null;

            if (this.editingItemId != null) {
                const updateData = {
                    category_id: this.categoryId,
                    project_id: projectIdForSubmit,
                    date: this.date,
                    orig_amount: this.origAmount,
                    currency_id: this.currencyId,
                    note: this.note,
                    is_debt: this.isDebt,
                };
                if (this.showExchangeRate && this.exchangeRate) {
                    updateData.exchange_rate = parseFloat(this.exchangeRate);
                }
                if (!this.fieldConfig('client').excludeFromRequest) {
                    updateData.client_id = this.selectedClient?.id;
                }

                const sourceType = this.getSourceTypeForBackend();
                if (sourceType) {
                    updateData.source_type = sourceType;
                    updateData.source_id = this.selectedSource?.id || null;
                }

                return updateData;
            } else {
                const roundedAmount = roundValue(this.origAmount);
                const typeValue = this.type == "income" ? 1 : this.type == "outcome" ? 0 : null;
                if (typeValue === null) {
                    throw new Error('Выберите тип транзакции');
                }
                const requestData = {
                    type: typeValue,
                    cash_id: this.cashId,
                    orig_amount: roundedAmount,
                    currency_id: this.currencyId,
                    category_id: this.categoryId,
                    note: this.note,
                    project_id: projectIdForSubmit,
                    date: this.date,
                    order_id: this.orderId,
                    is_debt: this.isDebt,
                };
                if (this.showExchangeRate && this.exchangeRate) {
                    requestData.exchange_rate = parseFloat(this.exchangeRate);
                }
                if (!this.fieldConfig('client').excludeFromRequest) {
                    requestData.client_id = this.selectedClient?.id;
                    if (this.selectedBalanceId) {
                        requestData.client_balance_id = this.selectedBalanceId;
                    }
                }

                const sourceType = this.getSourceTypeForBackend() || (this.orderId ? 'App\\Models\\Order' : null);
                if (sourceType) {
                    requestData.source_type = sourceType;
                    requestData.source_id = this.selectedSource?.id || this.orderId || null;
                }

                return requestData;
            }
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await TransactionController.updateItem(this.editingItemId, data);
            }
            if (data?._useSalaryAccrualApi) {
                const companyId = this.$store.getters.currentCompanyId;
                const payload = {
                    date: data.date,
                    cash_id: data.cash_id,
                    note: data.note,
                    user_ids: data.user_ids,
                    payment_type: data.payment_type,
                };
                return await CompaniesController.accrueSalaries(companyId, payload);
            }
            return await TransactionController.storeItem(data);
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                if (this.isPaymentModal) {
                    this.checkAndCloseOrder();
                }
                this.clearForm();
            }
        },
        async deleteItem() {
            if (!this.ensureEditable('deleted-error')) {
                return;
            }
            return crudFormMixin.methods.deleteItem.call(this);
        },
        async performDelete() {
            const resp = await TransactionController.deleteItem(this.editingItemId);
            if (!resp.message && !resp.success && !resp) {
                throw new Error('Failed to delete transaction');
            }
            return resp;
        },
        clearForm() {
            this.type = "income";
            this.cashId = this.defaultCashId || this.allCashRegisters[0]?.id || '';
            this.origAmount = 0;
            this.note = '';
            this.isDebt = this.fieldConfig('debt').enforcedValue ?? false;
            this.categoryId = 4;
            this.projectId = this.initialProjectId || '';
            this.date = this.getCurrentLocalDateTime();
            this.selectedClient = this.initialClient || null;
            this.selectedBalanceId = null;
            this.selectedSource = null;
            this.sourceType = '';
            this.paymentType = 1;
            this.exchangeRate = null;
            this.isExchangeRateManual = false;
            this.applyTypeConstraints();
            this.applyDebtConstraints();
            this.applyCategoryConstraints();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        showDeleteDialog() {
            if (!this.ensureEditable('deleted-error')) {
                return;
            }
            crudFormMixin.methods.showDeleteDialog.call(this);
        },
        copyTransaction() {
            if (!this.ensureEditable('saved-error') || !this.editingItem) {
                return;
            }
            this.$emit('copy-transaction', this.editingItem.clone());
        },

        // Загружаем информацию о заказе если это модалка доплаты
        async loadOrderInfo() {
            if (this.isPaymentModal && this.orderId) {
                try {
                    this.orderInfo = await OrderController.getItem(this.orderId);
                } catch (error) {
                    // Ошибка загрузки информации о заказе
                }
            }
        },

        // Загружаем источник при редактировании
        handleSourceFromEditingItem(newEditingItem) {
            if (newEditingItem.sourceType && newEditingItem.sourceId) {
                this.loadSourceForEdit(newEditingItem.sourceType, newEditingItem.sourceId);
            } else {
                this.selectedSource = null;
                this.sourceType = '';
            }
        },
        updateCurrencyFromCash(cashId) {
            const cash = this.allCashRegisters.find(c => c.id === cashId);
            const cashCurrencyId = cash?.currencyId ?? cash?.currency_id;
            if (cashCurrencyId) {
                this.currencyId = cashCurrencyId;
                return;
            }
            const defaultCurrency = this.currencies?.find(c => c.isDefault);
            if (defaultCurrency) {
                this.currencyId = defaultCurrency.id;
            }
        },
        async loadSourceForEdit(sourceType, sourceId) {
            try {
                if (sourceType.includes('Order')) {
                    this.sourceType = 'order';
                    const order = await OrderController.getItem(sourceId);
                    this.selectedSource = order;
                } else if (sourceType.includes('Sale')) {
                    this.sourceType = 'sale';
                    const sale = await SaleController.getItem(sourceId);
                    this.selectedSource = sale;
                } else if (sourceType.includes('WhReceipt')) {
                    this.sourceType = 'warehouse_receipt';
                    const receipt = await WarehouseReceiptController.getItem(sourceId);
                    this.selectedSource = receipt;
                } else if (sourceType.includes('ProjectContract')) {
                    this.sourceType = 'contract';
                    const ProjectContractController = (await import('@/api/ProjectContractController')).default;
                    const contract = await ProjectContractController.getItem(sourceId);
                    this.selectedSource = contract;
                }
            } catch (error) {
                this.selectedSource = null;
                this.sourceType = '';
            }
        },
        // Проверяем, нужно ли закрыть заказ после создания транзакции
        async checkAndCloseOrder() {
            if (!this.isPaymentModal || !this.orderId || !this.orderInfo) {
                return;
            }

            try {
                // Получаем общую сумму оплат по заказу через существующий API
                const paidTotalData = await TransactionController.getTotalPaidByOrderId(this.orderId);
                const totalPaid = parseFloat(paidTotalData.total) || 0;
                const orderTotal = parseFloat(this.orderInfo.totalPrice) || 0;

                // Если оплачено достаточно, закрываем заказ
                if (totalPaid >= orderTotal) {
                    // Находим статус "закрытый" (обычно это статус с category_id = 4)
                    const statuses = await OrderStatusController.getListItems();

                    const closedStatus = statuses.find(status => status.categoryId === 4);

                    if (closedStatus) {
                        const result = await OrderController.batchUpdateStatus({
                            ids: [this.orderId],
                            status_id: closedStatus.id
                        });

                        this.$store.dispatch('showNotification', {
                            title: this.$t('success'),
                            subtitle: this.$t('orderClosedAutomatically'),
                            isDanger: false
                        });
                    }
                }
            } catch (error) {
                // Ошибка при проверке закрытия заказа
            }
        },
        handleCurrencyOrCashChange() {
            if (!this.isExchangeRateManual && !this.editingItemId) {
                this.$nextTick(() => {
                    if (this.showExchangeRate) {
                        this.calculateExchangeRate();
                    } else {
                        this.exchangeRate = null;
                    }
                });
            }
        }
    },
    watch: {
        paymentType() {
            if (this.formConfig?.paymentType?.visible && this.allCashRegisters?.length && !this.editingItemId) {
                const isCash = this.paymentType === 1;
                const selected = this.allCashRegisters.find(c => c.id == this.cashId);
                if (selected && Boolean(selected.is_cash ?? selected.isCash) !== isCash) {
                    const matching = this.allCashRegisters.filter(c => Boolean(c.is_cash ?? c.isCash) === isCash);
                    this.cashId = matching.length ? matching[0].id : '';
                }
            }
            if (!this.editingItem && this.formConfig?.options?.loadSalaryAmountByPaymentType && this.selectedClient?.employeeId) {
                this.loadEmployeeSalaryAmount();
            }
        },
        projectId: {
            async handler(newProjectId) {
                if (!this.isFieldVisible('project')) return;
                if (!newProjectId || !this.initialProjectId) return;
                if (this.editingItemId) return;
                if (this.isFieldVisible('client') && this.isFieldRequired('client')) {
                    return;
                }
                // Ищем проект в store (activeProjects может не содержать завершённых — в таком случае подгрузим)
                let project = (this.allProjects || []).find(p => p.id === newProjectId) || null;
                if (!project) {
                    try {
                        project = await ProjectController.getItem(newProjectId);
                    } catch (e) {
                        project = null;
                    }
                }
                if (project && project.client) {
                    this.selectedClient = project.client;
                }
            },
            immediate: true
        },
        defaultCashId: {
            handler(newDefaultCashId) {
                if (newDefaultCashId && !this.editingItemId) {
                    this.cashId = newDefaultCashId;
                }
            },
            immediate: true
        },
        initialProjectId: {
            handler(newProjectId) {
                if (!this.isFieldVisible('project')) return;
                if (newProjectId && !this.projectId) {
                    this.projectId = newProjectId;
                }
            },
            immediate: true
        },
        initialClient: {
            handler(newClient) {
                if (newClient && !this.selectedClient) {
                    this.selectedClient = newClient;
                }
                if (newClient && this.clientBalances && this.clientBalances.length > 0 && !this.selectedBalanceId) {
                    const defaultBalance = this.clientBalances.find(b => b.isDefault);
                    this.selectedBalanceId = defaultBalance ? defaultBalance.id : (this.clientBalances[0]?.id || null);
                }
            },
            immediate: true
        },
        type(newType) {
            if (this.fieldConfig('category').visible === false) {
                this.applyCategoryConstraints();
                return;
            }
            if (this.editingItemId || this.fieldConfig('type').enforcedValue != null) {
                return;
            }

            this.categoryId = newType === "income" ? 4 : newType === "outcome" ? 14 : "";
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.type = newEditingItem.typeName() || "income";
                this.cashId = newEditingItem.cashId || this.defaultCashId || '';
                this.note = newEditingItem.note || '';
                this.origAmount = newEditingItem.origAmount || 0;
                this.currencyId = newEditingItem.origCurrencyId || '';
                this.categoryId = newEditingItem.categoryId || '';
                this.projectId = newEditingItem.projectId || '';
                this.date = newEditingItem.date                     ? this.getFormattedDate(newEditingItem.date)
                    : this.getCurrentLocalDateTime();
                this.selectedClient = newEditingItem.client || this.initialClient || null;
                this.isDebt = newEditingItem.isDebt || false;
                this.exchangeRate = newEditingItem.exchangeRate || null;
                this.isExchangeRateManual = !!newEditingItem.exchangeRate;
                this.handleSourceFromEditingItem(newEditingItem);
                this.applyTypeConstraints();
                this.applyDebtConstraints();
                this.applyCategoryConstraints();
            }
        },
        prefillAmount: {
            handler(newAmount) {
                if (!this.editingItemId && newAmount) {
                    const amount = parseFloat(newAmount);
                    if (amount > 0) {
                        this.origAmount = amount;
                    }
                }
            },
            immediate: true
        },
        // Отслеживаем изменения в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
            if (!this.currencyId && this.cashId) {
                this.updateCurrencyFromCash(this.cashId);
            }
            this.handleCurrencyOrCashChange();
        },
        '$store.state.transactionCategories'(newVal) {
            this.allCategories = newVal;
        },
        '$store.state.clients': {
            handler(newClients) {
                if (this.selectedClient?.id) {
                    const updated = newClients?.find(c => c.id === this.selectedClient.id);
                    if (updated) {
                        this.selectedClient = updated;
                        if (updated.balances && updated.balances.length > 0) {
                            const defaultBalance = updated.balances.find(b => b.isDefault);
                            this.selectedBalanceId = defaultBalance ? defaultBalance.id : (updated.balances[0]?.id || null);
                        } else {
                            this.selectedBalanceId = null;
                        }
                    }
                }
            },
        selectedClient: {
            handler(newClient, oldClient) {
                if (!newClient || (oldClient && newClient.id !== oldClient.id)) {
                    this.selectedBalanceId = null;
                } else if (newClient && newClient.balances && newClient.balances.length > 0) {
                    const defaultBalance = newClient.balances.find(b => b.isDefault);
                    this.selectedBalanceId = defaultBalance ? defaultBalance.id : (newClient.balances[0]?.id || null);
                }
            },
            deep: true
        },
            immediate: true,
            deep: true
        },
        formConfig: {
            handler() {
                this.applyTypeConstraints();
                this.applyDebtConstraints();
                this.applyCategoryConstraints();
            },
            deep: true
        },
        cashId(newCashId) {
            if (!this.editingItemId && newCashId) {
                this.updateCurrencyFromCash(newCashId);
            }
            this.handleCurrencyOrCashChange();
        },
        currencyId() {
            this.handleCurrencyOrCashChange();
        },
        clientBalances: {
            handler(newBalances) {
                if (newBalances && newBalances.length > 0 && !this.selectedBalanceId) {
                    const defaultBalance = newBalances.find(b => b.isDefault);
                    this.selectedBalanceId = defaultBalance ? defaultBalance.id : (newBalances[0]?.id || null);
                }
            },
            immediate: true
        }
    }
}
</script>