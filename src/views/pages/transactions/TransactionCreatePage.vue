<template>
  <div class="flex flex-col h-full">
    <div
      v-show="!showTemplatesPanel"
      class="flex flex-col flex-1 min-h-0"
    >
      <div class="flex-1 min-h-0 overflow-auto p-4">
        <TransactionFormFields
          v-model:selected-client="selectedClient"
          v-model:date="date"
          v-model:type="type"
          v-model:cash-id="cashId"
          v-model:is-debt="isDebt"
          v-model:orig-amount="origAmount"
          v-model:currency-id="currencyId"
          v-model:category-id="categoryId"
          v-model:project-id="projectId"
          v-model:note="note"
          v-model:selected-balance-id="selectedBalanceId"
          v-model:payment-type="paymentType"
          :editing-item-id="editingItemId"
          :order-id="orderId"
          :contract-id="contractId"
          :initial-project-id="initialProjectId"
          :all-cash-registers="cashRegistersForForm"
          :currencies="currencies"
          :filtered-categories="filteredCategories"
          :all-projects="allProjects"
          :form-config="formConfig"
          :is-category-disabled="isCategoryDisabled"
          :client-balances="clientBalances"
          :currency-locked-by-balance="balanceDrivesCashAndCurrency"
          @balance-changed="onBalanceChanged"
        />
        <TransactionBalancePreview
          :show-preview="showAdjustmentBalancePreview"
          :current-client-balance="currentClientBalance"
          :type="type"
          :orig-amount="origAmount"
          :default-currency-symbol="defaultCurrencySymbol"
        />
        <TransactionExchangeRateSection
          v-model:exchange-rate="exchangeRate"
          :show-exchange-rate="showExchangeRate"
          :show-calculated-amount="showCalculatedAmount"
          :orig-amount="origAmount"
          :transaction-currency-symbol="transactionCurrencySymbol"
          :cash-currency-symbol="cashCurrencySymbol"
          :calculated-cash-amount="calculatedCashAmount"
          :is-transfer-transaction="isTransferTransaction"
          @exchange-rate-manual="handleExchangeRateChange"
        />
        <div
          v-if="isFieldVisible('source') && !orderId && !contractId && $store.getters.hasPermission('contracts_create')"
          class="mt-2"
        >
          <ContractSearch
            v-model:selected-contract="selectedContractForSource"
            :contract-id="contractIdForEdit"
            :show-label="true"
            :project-id="useProjectContractBinding ? projectId : null"
            :active-projects-only="true"
          />
        </div>
        <TransactionSourceSection
          :order-id="orderId"
          :contract-id="contractId"
          :selected-source="selectedSource"
          :source-type="sourceType"
          :form-config="formConfig"
        />
        <div
          v-if="readOnlyReason"
          class="mt-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700"
        >
          {{ readOnlyReason }}
        </div>
      </div>
      <teleport v-bind="transactionFormFooterTeleportBind">
        <div class="w-full">
          <TransactionFormActions
            :editing-item-id="editingItemId"
            :is-deleted-transaction="isDeletedTransaction"
            :is-transfer-transaction="isTransferTransaction"
            :is-source-restricted="isSourceRestricted"
            :save-loading="saveLoading"
            :delete-loading="deleteLoading"
            :show-templates-button="showTemplatesButton"
            @save="save"
            @delete="showDeleteDialog"
            @copy="copyTransaction"
            @open-templates="openTemplatesPanel"
          />
        </div>
      </teleport>
    </div>
    <TransactionTemplatesOverlay
      v-show="showTemplatesPanel"
      :visible="showTemplatesPanel"
      @select="applyTemplate"
    />
    <AlertDialog
      :dialog="deleteDialog"
      :descr="deleteDialogDescr"
      :confirm-text="$t('deleteTransaction')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
  </div>
</template>


<script>
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import ClientDto from '@/dto/client/ClientDto';
import TransactionController from '@/api/TransactionController';
import OrderController from '@/api/OrderController';
import ProjectContractController from '@/api/ProjectContractController';
import SaleController from '@/api/SaleController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import transactionFormConfigMixin from "@/mixins/transactionFormConfigMixin";
import { dateFormMixin } from '@/utils/dateUtils';
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { roundValue } from '@/utils/numberUtils';
import { filterCashRegistersByClientBalance } from '@/utils/clientBalanceCashUtils';
import AppController from '@/api/AppController';
import TransactionFormFields from '@/views/components/transactions/TransactionFormFields.vue';
import TransactionExchangeRateSection from '@/views/components/transactions/TransactionExchangeRateSection.vue';
import TransactionBalancePreview from '@/views/components/transactions/TransactionBalancePreview.vue';
import TransactionSourceSection from '@/views/components/transactions/TransactionSourceSection.vue';
import TransactionFormActions from '@/views/components/transactions/TransactionFormActions.vue';
import TransactionTemplatesOverlay from '@/views/components/transactions/TransactionTemplatesOverlay.vue';
import ContractSearch from '@/views/components/app/search/ContractSearch.vue';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import CompaniesController from '@/api/CompaniesController';
import UsersController from '@/api/UsersController';
import TransactionTemplateController from '@/api/TransactionTemplateController';
import { EXCHANGE_RATE_DECIMAL_PLACES } from '@/constants/exchangeRateDecimals';
export default {
    components: {
        AlertDialog,
        TransactionFormFields,
        TransactionExchangeRateSection,
        TransactionBalancePreview,
        TransactionSourceSection,
        TransactionFormActions,
        TransactionTemplatesOverlay,
        ContractSearch
    },
    mixins: [getApiErrorMessage, crudFormMixin, transactionFormConfigMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: TransactionDto, required: false, default: null },
        initialClient: { type: ClientDto, default: null },
        initialProjectId: { type: [String, Number, null], default: null },
        orderId: { type: [String, Number], required: false },
        contractId: { type: [String, Number], required: false },
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
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request", 'copy-transaction'],
    data() {
        return {
            showTemplatesPanel: false,
            type: (this.orderId || this.contractId) ? "income" : (this.editingItem ? this.editingItem.typeName() : "income"),
            cashId: this.editingItem?.cashId ?? this.defaultCashId ?? '',
            origAmount: this.editingItem?.origAmount ?? (this.prefillAmount ? parseFloat(this.prefillAmount) || 0 : 0),
            currencyId: this.editingItem?.origCurrencyId ?? this.prefillCurrencyId ?? '',
            categoryId: this.editingItem?.categoryId ?? 4, // По умолчанию id = 4 для типа income
            projectId: this.editingItem?.projectId || this.initialProjectId ,
            date: this.getFormattedDate(this.editingItem?.date),
            note: this.editingItem?.note ,
            isDebt: (this.orderId || this.contractId) ? false : Boolean(this.editingItem?.isDebt ?? this.fieldConfig('debt').enforcedValue ?? false),
            selectedClient: this.editingItem?.client || this.initialClient,
            selectedBalanceId: null,
            selectedSource: null,
            sourceType: '',
            paymentType: 1,
            currencies: [],
            allCategories: [],
            allCashRegisters: [],
            exchangeRate: null,
            isExchangeRateManual: false,
        }
    },
    computed: {
        transactionFormFooterTeleportBind() {
            if (this.showTemplatesPanel) {
                return { disabled: true };
            }
            return this.sideModalFooterTeleportBind;
        },
        isDeletedTransaction() {
            return Boolean(this.editingItem?.isDeleted);
        },
        isTransferTransaction() {
            return this.editingItem?.isTransfer == 1;
        },
        isSourceRestricted() {
            if (!this.editingItem) {
                return false;
            }
            const source = this.editingItem.sourceType ;
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
            const cashCurrencyId = selectedCash.currencyId;
            const transactionCurrencyId = this.currencyId;
            return cashCurrencyId != transactionCurrencyId;
        },
        cashCurrencySymbol() {
            if (!this.cashId) return '';
            const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
            return selectedCash?.currencySymbol ;
        },
        transactionCurrencySymbol() {
            if (!this.currencyId) return '';
            const currency = this.currencies.find(c => c.id == this.currencyId);
            return currency?.symbol ;
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
            const cashCurrencyId = selectedCash.currencyId;
            const transactionCurrencyId = this.currencyId;
            return !!(this.calculatedCashAmount && cashCurrencyId != transactionCurrencyId);
        },
        selectedBalanceRecord() {
            if (!this.selectedBalanceId) {
                return null;
            }
            const balances = Array.isArray(this.selectedClient?.balances) && this.selectedClient.balances.length
                ? this.selectedClient.balances
                : (Array.isArray(this.clientBalances) ? this.clientBalances : []);
            return balances.find((b) => Number(b.id) === Number(this.selectedBalanceId)) ?? null;
        },
        balanceDrivesCashAndCurrency() {
            if (this.editingItemId) {
                return false;
            }
            return this.selectedBalanceRecord != null;
        },
        cashRegistersForForm() {
            if (this.balanceDrivesCashAndCurrency) {
                if (!this.selectedBalanceRecord) {
                    return [];
                }
                return this.filterCashRegistersStrictForBalance(this.selectedBalanceRecord);
            }
            if (!this.formConfig?.paymentType?.visible || this.paymentType === undefined || this.paymentType === null) {
                return this.allCashRegisters;
            }
            const paymentTypeIsCash = this.paymentType === 1;
            return this.allCashRegisters.filter(c => c.isCash === paymentTypeIsCash);
        },
        showTemplatesButton() {
            if (this.editingItemId || this.orderId || this.contractId) return false;
            if (this.formConfig?.options?.showTemplatesButton === false) return false;
            return this.$store.getters.hasPermission('transaction_templates_view_own') ||
                this.$store.getters.hasPermission('transaction_templates_view_all');
        },
        useProjectContractBinding() {
            return !this.editingItemId && this.formConfig?.options?.bindProjectAndContract === true;
        },
        contractIdForEdit() {
            if (!this.editingItem?.sourceType?.includes?.('ProjectContract') || !this.editingItem?.sourceId) return null;
            return this.editingItem.sourceId;
        },
        deleteDialogDescr() {
            return this.editingItem?.sourceType?.includes?.('ProjectContract')
                ? this.$t('deleteTransactionLinkedToContract')
                : this.$t('deleteTransaction');
        },
        selectedContractForSource: {
            get() {
                return this.sourceType === 'contract' ? this.selectedSource : null;
            },
            set(value) {
                this.selectedSource = value;
                this.sourceType = value ? 'contract' : '';
                if (this.useProjectContractBinding && value) {
                    this.projectId = value.projectId;
                }
                if (value && !this.editingItemId) {
                    this.applyContractPrefill(value);
                }
            }
        },
    },
    watch: {
        isSourceRestricted: {
            handler(newValue) {
                if (newValue) {
                    this.$store.dispatch('showNotification', {
                        title: this.$t('warning'),
                        subtitle: this.$t('transactionReadonlyDueToSource'),
                        isDanger: false,
                        isInfo: true,
                    });
                }
            },
            immediate: true,
        },
        paymentType() {
            if (this.balanceDrivesCashAndCurrency && this.allCashRegisters?.length && !this.editingItemId) {
                const strict = this.selectedBalanceRecord
                    ? this.filterCashRegistersStrictForBalance(this.selectedBalanceRecord)
                    : [];
                const selected = this.allCashRegisters.find(c => c.id == this.cashId);
                if (!selected || !strict.some((c) => Number(c.id) === Number(selected.id))) {
                    this.cashId = strict.length ? strict[0].id : '';
                }
            } else if (this.formConfig?.paymentType?.visible && this.allCashRegisters?.length && !this.editingItemId) {
                const isCash = this.paymentType === 1;
                const selected = this.allCashRegisters.find(c => c.id == this.cashId);
                if (selected && selected.isCash !== isCash) {
                    const matching = this.allCashRegisters.filter(c => c.isCash === isCash);
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
                if (this.useProjectContractBinding && this.sourceType === 'contract' && this.selectedSource) {
                    const contractProjectId = this.selectedSource.projectId;
                    if (contractProjectId != null && Number(contractProjectId) !== Number(newProjectId)) {
                        this.selectedSource = null;
                        this.sourceType = '';
                    }
                }
                if (!newProjectId || !this.initialProjectId) return;
                if (this.editingItemId) return;
                if (this.isFieldVisible('client') && this.isFieldRequired('client')) {
                    return;
                }
                let project = (this.allProjects || []).find(p => p.id === newProjectId) ?? null;
                if (!project) {
                    try {
                        project = await ProjectController.getItem(newProjectId);
                    } catch {
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
                if (newDefaultCashId && !this.editingItemId && !this.balanceDrivesCashAndCurrency) {
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
                    const balanceId = defaultBalance ? defaultBalance.id : (this.clientBalances[0]?.id ?? null);
                    this.selectedBalanceId = balanceId;
                    this.applyBalanceDefaults(balanceId);
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
            if (!this.editingItemId && this.balanceDrivesCashAndCurrency && Array.isArray(newVal) && newVal.length) {
                this.applyBalanceDefaults(this.selectedBalanceId);
            }
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
            this.ensureValidCurrencySelection();
            if (!this.balanceDrivesCashAndCurrency && !this.currencyId && this.cashId) {
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
                            const balanceId = defaultBalance ? defaultBalance.id : (updated.balances[0]?.id ?? null);
                            this.selectedBalanceId = balanceId;
                            this.applyBalanceDefaults(balanceId);
                        } else {
                            this.selectedBalanceId = null;
                        }
                    }
                }
            },
            immediate: true,
            deep: true
        },
        selectedClient: {
            handler(newClient, oldClient) {
                if (!newClient || (oldClient && newClient.id !== oldClient.id)) {
                    this.selectedBalanceId = null;
                } else if (newClient && newClient.balances && newClient.balances.length > 0) {
                    const defaultBalance = newClient.balances.find(b => b.isDefault);
                    const balanceId = defaultBalance ? defaultBalance.id : (newClient.balances[0]?.id ?? null);
                    this.selectedBalanceId = balanceId;
                    if (!this.editingItemId && balanceId) {
                        this.applyBalanceDefaults(balanceId);
                    }
                }
            },
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
            if (!this.editingItemId && !this.balanceDrivesCashAndCurrency && newCashId) {
                this.updateCurrencyFromCash(newCashId);
            }
            this.handleCurrencyOrCashChange();
        },
        balanceDrivesCashAndCurrency: {
            handler(isLocked) {
                if (isLocked && !this.editingItemId && this.selectedBalanceId) {
                    this.applyBalanceDefaults(this.selectedBalanceId);
                }
            },
        },
        currencyId() {
            this.handleCurrencyOrCashChange();
        },
        clientBalances: {
            handler(newBalances) {
                if (newBalances && newBalances.length > 0 && !this.selectedBalanceId) {
                    const defaultBalance = newBalances.find(b => b.isDefault);
                    const balanceId = defaultBalance ? defaultBalance.id : (newBalances[0]?.id ?? null);
                    this.selectedBalanceId = balanceId;
                    this.applyBalanceDefaults(balanceId);
                }
            },
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCategories(),
                this.fetchAllCashRegisters(),
            ]);
            this.ensureValidCurrencySelection();

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
                this.selectedBalanceId = defaultBalance ? defaultBalance.id : (this.clientBalances[0]?.id ?? null);
            }

            this.applyTypeConstraints();
            this.applyDebtConstraints();
            this.applyCategoryConstraints();
            if (!this.editingItemId && this.balanceDrivesCashAndCurrency && this.allCashRegisters?.length) {
                this.applyBalanceDefaults(this.selectedBalanceId);
            } else if (!this.editingItemId && this.formConfig?.paymentType?.visible && this.allCashRegisters?.length) {
                const isCash = this.paymentType === 1;
                const selected = this.allCashRegisters.find(c => c.id == this.cashId);
                if (selected && selected.isCash !== isCash) {
                    const matching = this.allCashRegisters.filter(c => c.isCash === isCash);
                    this.cashId = matching.length ? matching[0].id : '';
                }
            }
            if (!this.editingItem && this.formConfig?.options?.loadSalaryAmountByPaymentType && this.selectedClient?.employeeId) {
                await this.loadEmployeeSalaryAmount();
            }
            if (!this.editingItem && this.contractId) {
                await this.loadContractForSource();
            }
            this.saveInitialState();
        });
    },
    methods: {
        ensureValidCurrencySelection() {
            if (!Array.isArray(this.currencies) || this.currencies.length === 0) {
                return;
            }
            const currentCurrencyId = this.currencyId == null || this.currencyId === '' ? null : Number(this.currencyId);
            if (currentCurrencyId != null && this.currencies.some(c => Number(c.id) === currentCurrencyId)) {
                return;
            }
            this.currencyId = '';
        },
        onBalanceChanged(balanceId) {
            this.selectedBalanceId = balanceId;
            if (!this.editingItemId) {
                this.applyBalanceDefaults(balanceId);
            }
        },
        filterCashRegistersStrictForBalance(balance) {
            return filterCashRegistersByClientBalance(balance, this.allCashRegisters);
        },
        applyBalanceDefaults(balanceId) {
            if (this.editingItemId) {
                return;
            }
            const balances = Array.isArray(this.selectedClient?.balances) && this.selectedClient.balances.length
                ? this.selectedClient.balances
                : (Array.isArray(this.clientBalances) ? this.clientBalances : []);
            if (!balanceId || !balances.length) {
                return;
            }
            const balance = balances.find((b) => Number(b.id) === Number(balanceId));
            if (!balance) {
                return;
            }

            const nextPaymentType = Number(balance.type) === 0 ? 0 : 1;
            const nextCurrencyId = balance.currencyId ?? balance.currency_id ?? balance.currency?.id ?? null;

            this.paymentType = nextPaymentType;
            if (nextCurrencyId != null) {
                this.currencyId = Number(nextCurrencyId);
            }

            if (!Array.isArray(this.allCashRegisters) || !this.allCashRegisters.length) {
                return;
            }

            const strictList = this.filterCashRegistersStrictForBalance(balance);
            const nextCash = strictList[0] ?? null;

            if (nextCash) {
                this.cashId = nextCash.id;
            } else {
                this.cashId = '';
            }
        },
        async loadEmployeeSalaryAmount() {
            if (!this.selectedClient?.employeeId) return;
            try {
                const data = await UsersController.getSalaries(this.selectedClient.employeeId);
                const salaries = data?.salaries || [];
                const salary = salaries.find(s => Number(s.paymentType) === Number(this.paymentType) && !s.endDate);
                if (salary?.currencyId && !this.currencyId) {
                    this.currencyId = salary.currencyId;
                }
            } catch (e) {
                console.error('Error loading employee salary:', e);
            }
        },
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
                selectedClient: this.selectedClient?.id ?? null,
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
                sourceId: this.selectedSource?.id ?? null
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

            return typeMap[this.sourceType] ?? null;
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
            const cashCurrencyId = parseInt(selectedCash.currencyId);

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

                const fromRate = parseFloat(fromRateData?.exchangeRate);
                const toRate = parseFloat(toRateData?.exchangeRate);

                if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
                    this.exchangeRate = '1.0';
                    return;
                }

                let calculatedRate;
                if (transactionCurrencyId == defaultCurrency.id) {
                    calculatedRate = (1 / toRate).toFixed(EXCHANGE_RATE_DECIMAL_PLACES);
                } else if (cashCurrencyId == defaultCurrency.id) {
                    calculatedRate = fromRate.toFixed(EXCHANGE_RATE_DECIMAL_PLACES);
                } else {
                    calculatedRate = (fromRate / toRate).toFixed(EXCHANGE_RATE_DECIMAL_PLACES);
                }

                this.exchangeRate = calculatedRate;
            } catch {
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
                    const project = this.allProjects.find(p => p.id === this.projectId) ?? null;
                    if (project && project.client) {
                        this.selectedClient = project.client;
                    }
                }
            }
            if (this.isDebt && !this.selectedClient?.id) {
                throw new Error('При транзакции "в кредит" должен быть выбран клиент');
            }
            if (this.isFieldRequired('note') && (!this.note || String(this.note).trim() === '')) {
                throw new Error(this.$t('fillRequiredFields'));
            }
            if (this.isFieldVisible('client') && this.isFieldRequired('client') && !this.selectedClient?.id) {
                throw new Error(this.$t('selectClient'));
            }

            if (this.formConfig?.options?.useSalaryAccrualApi && this.selectedClient?.employeeId && !this.editingItemId) {
                const companyId = this.$store.getters.currentCompanyId;
                if (!companyId) {
                    throw new Error(this.$t('companyNotSelected'));
                }
                if (!this.date || !this.cashId) {
                    throw new Error(this.$t('fillRequiredFields'));
                }
                return {
                    _useSalaryAccrualApi: true,
                    date: this.date,
                    cashId: this.cashId,
                    note: this.note || null,
                    creatorIds: [Number(this.selectedClient.employeeId)],
                    paymentType: Number(this.paymentType) === 1,
                };
            }

            const projectIdForSubmit = this.projectId || this.initialProjectId || null;

            if (this.editingItemId != null) {
                const updateData = {
                    categoryId: this.categoryId,
                    projectId: projectIdForSubmit,
                    date: this.date,
                    origAmount: this.origAmount,
                    currencyId: this.currencyId,
                    note: this.note,
                    isDebt: this.isDebt,
                };
                if (this.showExchangeRate && this.exchangeRate) {
                    updateData.exchangeRate = parseFloat(this.exchangeRate);
                }
                if (!this.fieldConfig('client').excludeFromRequest) {
                    updateData.clientId = this.selectedClient?.id;
                }

                const sourceType = this.getSourceTypeForBackend();
                if (sourceType) {
                    updateData.sourceType = sourceType;
                    updateData.sourceId = this.selectedSource?.id || null;
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
                    cashId: this.cashId,
                    origAmount: roundedAmount,
                    currencyId: this.currencyId,
                    categoryId: this.categoryId,
                    note: this.note,
                    projectId: projectIdForSubmit,
                    date: this.date,
                    orderId: this.orderId,
                    isDebt: this.isDebt,
                };
                if (this.showExchangeRate && this.exchangeRate) {
                    requestData.exchangeRate = parseFloat(this.exchangeRate);
                }
                if (!this.fieldConfig('client').excludeFromRequest) {
                    requestData.clientId = this.selectedClient?.id;
                    if (this.selectedBalanceId) {
                        requestData.clientBalanceId = this.selectedBalanceId;
                    }
                }

                const sourceType = this.getSourceTypeForBackend() || (this.orderId ? 'App\\Models\\Order' : this.contractId ? 'App\\Models\\ProjectContract' : null);
                if (sourceType) {
                    requestData.sourceType = sourceType;
                    requestData.sourceId = this.selectedSource?.id || this.orderId || this.contractId || null;
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
                    cashId: data.cashId,
                    note: data.note,
                    creatorIds: data.creatorIds,
                    paymentType: data.paymentType,
                };
                return await CompaniesController.accrueSalaries(companyId, payload);
            }
            return await TransactionController.storeItem(data);
        },
        onSaveSuccess(response) {
            if (response && response.message) {
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
            this.cashId = this.defaultCashId || this.allCashRegisters[0]?.id ;
            this.origAmount = 0;
            this.note = '';
            this.isDebt = this.fieldConfig('debt').enforcedValue ?? false;
            this.categoryId = 4;
            this.projectId = this.initialProjectId ;
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
        openTemplatesPanel() {
            this.showTemplatesPanel = true;
        },
        closeTemplatesPanel() {
            this.showTemplatesPanel = false;
        },
        handleCloseRequest() {
            if (this.showTemplatesPanel) {
                this.closeTemplatesPanel();
                return;
            }
            crudFormMixin.methods.handleCloseRequest.call(this);
        },
        async applyTemplate(templateId) {
            if (templateId == null) return;
            try {
                const dto = await TransactionTemplateController.getApplyData(templateId);
                if (!dto) return;
                this.type = dto.type === 1 ? 'income' : 'outcome';
                this.cashId = dto.cashId ?? this.cashId;
                this.origAmount = dto.amount ?? this.origAmount;
                this.currencyId = dto.currencyId ?? this.currencyId;
                this.categoryId = dto.categoryId ?? (this.type === 'income' ? 4 : 14);
                this.projectId = dto.projectId ?? '';
                this.note = dto.note ?? this.note;
                this.date = this.getCurrentLocalDateTime();
                if (dto.client) {
                    this.selectedClient = dto.client;
                    this.selectedBalanceId = null;
                }
                this.showTemplatesPanel = false;
            } catch (e) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
                    subtitle: e?.message || String(e),
                    isDanger: true
                });
            }
        },

        // Загружаем информацию о заказе если это модалка доплаты
        async loadContractForSource() {
            if (!this.contractId) return;
            try {
                const contract = await ProjectContractController.getItem(this.contractId);
                if (contract) {
                    this.selectedSource = contract;
                    this.sourceType = 'contract';
                    this.projectId = contract.projectId ?? '';
                    if (contract.cashId && !this.cashId) {
                        this.cashId = contract.cashId;
                        this.updateCurrencyFromCash(contract.cashId);
                    }
                    if (contract.currencyId && !this.currencyId) {
                        this.currencyId = contract.currencyId;
                    }
                    if (!this.editingItemId) {
                        this.applyContractPrefill(contract);
                    }
                }
            } catch {
                this.selectedSource = null;
                this.sourceType = '';
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.type = newEditingItem.typeName() || "income";
                this.cashId = newEditingItem.cashId ?? this.defaultCashId ?? '';
                this.note = newEditingItem.note;
                this.origAmount = newEditingItem.origAmount ?? 0;
                this.currencyId = newEditingItem.origCurrencyId ?? '';
                this.categoryId = newEditingItem.categoryId;
                this.projectId = newEditingItem.projectId;
                this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date)
                    : this.getCurrentLocalDateTime();
                this.selectedClient = newEditingItem.client || this.initialClient || null;
                this.isDebt = Boolean(newEditingItem.isDebt ?? false);
                this.exchangeRate = newEditingItem.exchangeRate ?? null;
                this.isExchangeRateManual = !!newEditingItem.exchangeRate;
                this.handleSourceFromEditingItem(newEditingItem);
                this.applyTypeConstraints();
                this.applyDebtConstraints();
                this.applyCategoryConstraints();
            }
        },
        handleSourceFromEditingItem(newEditingItem) {
            if (newEditingItem?.sourceType && newEditingItem?.sourceId) {
                this.loadSourceForEdit(newEditingItem.sourceType, newEditingItem.sourceId);
            } else {
                this.selectedSource = null;
                this.sourceType = '';
            }
        },
        updateCurrencyFromCash(cashId) {
            const normalizedCashId = Number(cashId);
            const cash = this.allCashRegisters.find(c => Number(c.id) === normalizedCashId);
            const cashCurrencyId = cash?.currencyId == null ? null : Number(cash.currencyId);
            if (cashCurrencyId != null && this.currencies.some(c => Number(c.id) === cashCurrencyId)) {
                this.currencyId = cashCurrencyId;
                return;
            }
            this.currencyId = '';
        },
        applyContractPrefill(contract) {
            if (this.editingItemId || !contract) return;
            const amount = parseFloat(contract.amount) || 0;
            const paid = parseFloat(contract.paidAmount) || 0;
            this.origAmount = Math.max(0, roundValue(amount - paid));
            const cid = contract.currencyId;
            if (cid) this.currencyId = cid;
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
                    const contract = await ProjectContractController.getItem(sourceId);
                    this.selectedSource = contract;
                }
            } catch {
                this.selectedSource = null;
                this.sourceType = '';
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
    }
}
</script>