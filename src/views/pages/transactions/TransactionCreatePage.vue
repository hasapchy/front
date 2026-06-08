<template>
    <div class="flex flex-col h-full">
        <div v-show="!showTemplatesPanel" class="flex flex-col flex-1 min-h-0">
            <div class="flex-1 min-h-0 overflow-auto p-4">
                <TransactionFormFields :selected-client="selectedClient"
                    @update:selectedClient="selectedClient = $event" :date="date" @update:date="date = $event"
                    :type="type" @update:type="type = $event" :cash-id="cashId" @update:cashId="cashId = $event"
                    :is-debt="isDebt" @update:isDebt="isDebt = $event" :orig-amount="origAmount"
                    @update:origAmount="origAmount = $event" :currency-id="currencyId"
                    @update:currencyId="currencyId = $event" :category-id="categoryId"
                    @update:categoryId="categoryId = $event" :project-id="projectId" :selected-project="selectedProject"
                    @update:selectedProject="onSelectedProjectUpdate" :note="note" @update:note="note = $event"
                    :selected-balance-id="selectedBalanceId" @update:selectedBalanceId="selectedBalanceId = $event"
                    :payment-type="paymentType" @update:paymentType="paymentType = $event"
                    :editing-item-id="editingItemId" :order-id="orderId" :contract-id="contractId"
                    :warehouse-receipt-id="warehouseReceiptId" :warehouse-purchase-id="warehousePurchaseId"
                    :amount-rounding-scope="amountRoundingScope"
                    :initial-project-id="initialProjectId" :all-cash-registers="cashRegistersForForm"
                    :currencies="currencies" :filtered-categories="filteredCategories" :form-config="formConfig"
                    :is-category-disabled="isCategoryDisabled" :client-balances="clientBalances"
                    :client-balance-selected="clientBalanceSelected"
                    :balance-select-disabled="isDocumentClientBalanceLocked" @balance-changed="onBalanceChanged" />
                <TransactionBalancePreview :show-preview="showAdjustmentBalancePreview"
                    :current-client-balance="currentClientBalance" :type="type" :orig-amount="origAmount"
                    :default-currency-code="defaultCurrencyCode" />
                <TransactionExchangeRateSection :exchange-rate="exchangeRate"
                    @update:exchangeRate="exchangeRate = $event" :show-exchange-rate="showExchangeRate"
                    :show-calculated-amount="showCalculatedAmount" :orig-amount="origAmount"
                    :transaction-currency-code="transactionCurrencyCode" :cash-currency-code="cashCurrencyCode"
                    :calculated-cash-amount="calculatedCashAmount" :is-transfer-transaction="isTransferTransaction"
                    @exchange-rate-manual="handleExchangeRateChange" />
                <div v-if="isFieldVisible('contract') && isFieldVisible('source') && !orderId && !contractId && !warehouseReceiptId && !warehousePurchaseId && $store.getters.hasPermission('contracts_create')"
                    class="mt-2">
                    <ContractSearch :selected-contract="selectedContractForSource"
                        @update:selectedContract="selectedContractForSource = $event" :contract-id="contractIdForEdit"
                        :show-label="true" :project-id="useProjectContractBinding ? projectId : null"
                        :active-projects-only="true" />
                </div>
                <TransactionSourceSection :order-id="orderId" :contract-id="contractId"
                    :warehouse-receipt-id="warehouseReceiptId" :warehouse-purchase-id="warehousePurchaseId"
                    :selected-source="selectedSource" :source-type="sourceType" :form-config="formConfig" />
                <div v-if="documentPaymentErrorMessage"
                    class="mt-4 p-3 rounded border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_15%,var(--surface-muted))] text-sm text-[var(--color-warning)]">
                    {{ documentPaymentErrorMessage }}
                </div>
                <div v-if="readOnlyReason"
                    class="mt-4 p-3 rounded border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))] text-sm text-[var(--color-danger)]">
                    {{ readOnlyReason }}
                </div>
            </div>
            <teleport v-bind="transactionFormFooterTeleportBind">
                <div class="w-full">
                    <TransactionFormActions :editing-item-id="editingItemId"
                        :is-deleted-transaction="isDeletedTransaction" :is-transfer-transaction="isTransferTransaction"
                        :is-source-restricted="isSourceRestricted" :save-loading="saveLoading"
                        :delete-loading="deleteLoading" :show-templates-button="showTemplatesButton" @save="save"
                        @delete="showDeleteDialog" @copy="copyTransaction" @open-templates="openTemplatesPanel" />
                </div>
            </teleport>
        </div>
        <TransactionTemplatesOverlay v-show="showTemplatesPanel" :visible="showTemplatesPanel"
            @select="applyTemplate" />
        <AlertDialog :dialog="deleteDialog" :descr="deleteDialogDescr" :confirm-text="$t('deleteTransaction')"
            :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
        <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
            :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
    </div>
</template>


<script>
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TransactionDto from '@/dto/transaction/TransactionDto';
import ClientDto from '@/dto/client/ClientDto';
import TransactionController from '@/api/TransactionController';
import OrderController from '@/api/OrderController';
import ProjectController from '@/api/ProjectController';
import ProjectContractController from '@/api/ProjectContractController';
import ClientController from '@/api/ClientController';
import SaleController from '@/api/SaleController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import transactionFormConfigMixin from "@/mixins/transactionFormConfigMixin";
import { dateFormMixin } from '@/utils/dateUtils';
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { normalizeExchangeRateValue, roundDocumentTotalForScope } from '@/utils/numberUtils';
import { applyProjectSelection } from '@/utils/projectSearchUtils';
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
import {
    getSourceKind,
    isReadonlyTransactionSource,
    resolveAmountRoundingScopeByTransactionSource,
} from '@/utils/transactionSourceUtils';
import { DEFAULT_TRANSACTION_FORM_PRESET } from '@/constants/transactionFormPresets';
import clientBalanceCashMixin from '@/mixins/clientBalanceCashMixin';
import {
    resolveBoundCategoryId,
    TRANSACTION_CATEGORY_BINDING_KEYS,
} from '@/constants/transactionCategoryBindings';
import {
    attachDocumentBalancesToClient,
    getTransactionBalancesList,
    loadClientBalancesForForm,
} from '@/utils/clientBalanceCashUtils';
import {
    isDocumentPaymentBalanceLocked,
    normalizeBalanceId,
    resolveTransactionPrefillBalanceId,
    shouldSubmitClientBalanceIdForTransaction,
    validateDocumentPaymentBeforeSave,
} from '@/utils/documentPaymentBalanceUtils';
import { logWhReceiptGoodsPayment } from '@/utils/warehouseReceiptGoodsPaymentDebug';

const SOURCE_TYPE_TO_BACKEND_MODEL = {
    order: 'App\\Models\\Order',
    sale: 'App\\Models\\Sale',
    warehouse_receipt: 'App\\Models\\WhReceipt',
    purchase: 'App\\Models\\WhPurchase',
    contract: 'App\\Models\\ProjectContract'
};

const SOURCE_KIND_TO_UI_SOURCE_TYPE = {
    order: 'order',
    sale: 'sale',
    receipt: 'warehouse_receipt',
    purchase: 'purchase',
    contract: 'contract'
};

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
    mixins: [getApiErrorMessage, crudFormMixin, transactionFormConfigMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal, clientBalanceCashMixin],
    props: {
        editingItem: { type: TransactionDto, required: false, default: null },
        initialClient: { type: ClientDto, default: null },
        initialProjectId: { type: [String, Number, null], default: null },
        orderId: { type: [String, Number], required: false },
        documentBalanceId: { type: [String, Number, null], default: null },
        contractId: { type: [String, Number], required: false },
        warehouseReceiptId: { type: [String, Number], required: false },
        warehousePurchaseId: { type: [String, Number], required: false },
        defaultCashId: { type: [Number, String], default: null, required: false },
        prefillAmount: { type: [Number, String], default: null },
        warehouseReceiptGoodsPaymentMaxDefault: { type: Number, default: null },
        warehousePurchaseGoodsPaymentMaxDefault: { type: Number, default: null },
        prefillCurrencyId: { type: [Number, String], default: null },
        formConfig: {
            type: Object,
            default: () => DEFAULT_TRANSACTION_FORM_PRESET,
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
            type: (this.orderId || this.contractId)
                ? "income"
                : ((this.warehouseReceiptId || this.warehousePurchaseId) && this.formConfig?.type?.enforcedValue != null)
                    ? this.formConfig.type.enforcedValue
                    : (this.editingItem ? this.editingItem.typeName() : "income"),
            cashId: this.editingItem?.cashId ?? this.defaultCashId ?? '',
            origAmount: this.editingItem?.origAmount ?? (this.prefillAmount ? parseFloat(this.prefillAmount) || 0 : 0),
            currencyId: this.editingItem?.origCurrencyId ?? this.prefillCurrencyId ?? '',
            categoryId: this.editingItem?.categoryId
                ?? ((this.warehouseReceiptId || this.warehousePurchaseId) && this.formConfig?.options?.defaultCategoryId != null
                    ? this.formConfig.options.defaultCategoryId
                    : resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME)),
            projectId: this.editingItem?.projectId || this.initialProjectId,
            selectedProject: null,
            date: this.getFormattedDate(this.editingItem?.date),
            note: this.editingItem?.note,
            isDebt: (this.orderId || this.contractId || ((this.warehouseReceiptId || this.warehousePurchaseId) && !this.fieldConfig('debt').visibleWhenClient)) ? false : Boolean(this.editingItem?.isDebt ?? this.fieldConfig('debt').enforcedValue ?? false),
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
            contractPrefillBalanceId: null,
        }
    },
    computed: {
        transactionFormFooterTeleportBind() {
            if (this.showTemplatesPanel) {
                return { disabled: true };
            }
            return this.sideModalFooterTeleportBind;
        },
        amountRoundingScope() {
            return resolveAmountRoundingScopeByTransactionSource({
                sourceType: this.editingItem?.sourceType,
                source: this.sourceType,
                orderId: this.orderId,
                contractId: this.contractId,
                warehouseReceiptId: this.warehouseReceiptId,
                warehousePurchaseId: this.warehousePurchaseId,
            });
        },
        isDeletedTransaction() {
            return Boolean(this.editingItem?.isDeleted);
        },
        isTransferTransaction() {
            return this.editingItem?.isTransfer == 1;
        },
        isDocumentPaymentContext() {
            return Boolean(
                this.orderId || this.contractId || this.warehouseReceiptId || this.warehousePurchaseId,
            );
        },
        isDocumentClientBalanceLocked() {
            if (!this.isDocumentPaymentContext) {
                return false;
            }
            return isDocumentPaymentBalanceLocked(this.documentBalanceId, this.clientBalances);
        },
        documentPaymentValidationKey() {
            if (this.editingItemId) {
                return null;
            }
            return validateDocumentPaymentBeforeSave({
                isDocumentPayment: this.isDocumentPaymentContext,
                documentBalanceId: this.documentBalanceId,
                paymentBalances: this.transactionBalancesList,
                selectedBalanceId: this.selectedBalanceId,
                formOptions: {
                    warehouseReceiptId: Boolean(this.warehouseReceiptId),
                    warehouseReceiptGoodsPayment: this.formConfig?.options?.warehouseReceiptGoodsPayment === true,
                },
            });
        },
        documentPaymentErrorMessage() {
            const key = this.documentPaymentValidationKey;
            return key ? this.$t(key) : '';
        },
        isWhReceiptGoodsPaymentPreset() {
            return Boolean(
                this.warehouseReceiptId && this.formConfig?.options?.warehouseReceiptGoodsPayment === true,
            );
        },
        isWhPurchaseGoodsPaymentPreset() {
            return Boolean(
                this.warehousePurchaseId && this.formConfig?.options?.warehousePurchaseGoodsPayment === true,
            );
        },
        warehouseGoodsPaymentMaxForValidation() {
            if (this.isWhReceiptGoodsPaymentPreset) {
                return this.warehouseReceiptGoodsPaymentMaxDefault;
            }
            if (this.isWhPurchaseGoodsPaymentPreset) {
                return this.warehousePurchaseGoodsPaymentMaxDefault;
            }
            return null;
        },
        warehouseGoodsPaymentExceedsKey() {
            if (this.isWhPurchaseGoodsPaymentPreset) {
                return 'purchaseGoodsPaymentExceedsRemaining';
            }
            return 'receiptGoodsPaymentExceedsRemaining';
        },
        transactionBalancesList() {
            if (
                this.isDocumentPaymentContext
                && Array.isArray(this.clientBalances)
                && this.clientBalances.length > 0
            ) {
                return this.clientBalances;
            }
            return getTransactionBalancesList(this.selectedClient, this.clientBalances);
        },
        isSourceRestricted() {
            if (!this.editingItem) {
                return false;
            }
            return isReadonlyTransactionSource(this.editingItem.sourceType, this.editingItem.isDebt);
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
            const currentCategoryId = this.categoryId ? parseInt(this.categoryId, 10) : null;

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
        defaultCurrencyCode() {
            const currencies = this.$store?.state?.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.code : '';
        },
        showAdjustmentBalancePreview() {
            return !!this.formConfig?.options?.showBalancePreview && this.currentClientBalance != null;
        },
        selectedCashRegister() {
            if (!this.cashId) return null;
            return this.allCashRegisters.find((cash) => Number(cash.id) === Number(this.cashId)) || null;
        },
        hasCurrencyMismatch() {
            if (!this.selectedCashRegister || !this.currencyId) return false;
            return Number(this.selectedCashRegister.currencyId) !== Number(this.currencyId);
        },
        showExchangeRate() {
            return this.hasCurrencyMismatch;
        },
        cashCurrencyCode() {
            return this.selectedCashRegister?.currencyCode || '';
        },
        transactionCurrencyCode() {
            if (!this.currencyId) return '';
            const currency = this.currencies.find((c) => Number(c.id) === Number(this.currencyId));
            return currency?.code;
        },
        calculatedCashAmount() {
            if (!this.exchangeRate || !this.origAmount) return null;
            const result = parseFloat(this.origAmount) * parseFloat(this.exchangeRate);
            return Math.round(result * 100) / 100;
        },
        showCalculatedAmount() {
            return Boolean(this.calculatedCashAmount && this.hasCurrencyMismatch);
        },
        showTemplatesButton() {
            if (this.editingItemId || this.orderId || this.contractId || this.warehouseReceiptId || this.warehousePurchaseId) return false;
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
                if (value) {
                    this.setSourceState('contract', value);
                } else {
                    this.resetSourceState();
                }
                if (this.useProjectContractBinding && value) {
                    this.projectId = value.projectId;
                }
                if (value && !this.editingItemId) {
                    void this.applyContractSelection(value);
                }
            }
        },
    },
    watch: {
        documentBalanceId: {
            handler() {
                this.syncDocumentBalancePrefill();
            },
            immediate: true,
        },
        clientBalances: {
            handler() {
                if (this.isDocumentPaymentContext) {
                    this.selectedClient = attachDocumentBalancesToClient(
                        this.selectedClient,
                        this.clientBalances,
                    );
                }
                this.syncDocumentBalancePrefill();
                this.logWhReceiptGoodsPaymentState('client-balances-prop-changed');
            },
            deep: true,
            immediate: true,
        },
        documentPaymentValidationKey: {
            handler(key) {
                if (key) {
                    this.logWhReceiptGoodsPaymentState('validation-key', { validationKey: key });
                }
            },
        },
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
            if (this.clientBalanceSelected && this.allCashRegisters?.length && !this.editingItemId) {
                this.syncCashIdFromBalanceFilter();
            } else if (this.formConfig?.paymentType?.visible && this.allCashRegisters?.length && !this.editingItemId) {
                this.syncCashIdWithPaymentType();
            }
            if (!this.editingItem && this.formConfig?.options?.loadSalaryAmountByPaymentType && this.selectedClient?.employeeId) {
                this.loadEmployeeSalaryAmount();
            }
        },
        defaultCashId: {
            handler(newDefaultCashId) {
                if (newDefaultCashId && !this.editingItemId && !this.clientBalanceSelected) {
                    this.cashId = newDefaultCashId;
                }
            },
            immediate: true
        },
        initialProjectId: {
            async handler(newProjectId) {
                if (!this.isFieldVisible('project')) return;
                if (newProjectId && !this.selectedProject) {
                    try {
                        const project = await ProjectController.getItem(newProjectId);
                        this.onSelectedProjectUpdate(project);
                    } catch {
                        this.onSelectedProjectUpdate(null);
                    }
                }
            },
            immediate: true
        },
        initialClient: {
            handler(newClient) {
                if (!this.editingItem?.client && newClient) {
                    this.selectedClient = newClient;
                } else if (newClient && !this.selectedClient) {
                    this.selectedClient = newClient;
                }
                if (this.isDocumentPaymentContext) {
                    this.selectedClient = attachDocumentBalancesToClient(
                        this.selectedClient,
                        this.clientBalances,
                    );
                }
                this.syncDocumentBalancePrefill();
            },
            immediate: true,
        },
        type(newType) {
            if (this.fieldConfig('category').visible === false) {
                this.applyCategoryConstraints();
                return;
            }
            if (this.editingItemId || this.fieldConfig('type').enforcedValue != null) {
                return;
            }

            this.categoryId = newType === "income"
                ? (this.sourceType === "contract"
                    ? resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.CONTRACT)
                    : resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME))
                : newType === "outcome"
                    ? resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_OUTCOME)
                    : "";
            if (newType === 'income' && this.fieldConfig('debt').enforcedValue === undefined) {
                this.isDebt = false;
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
                this.logWhReceiptGoodsPaymentState('prefill-amount-changed', { prefillAmountRaw: newAmount });
            },
            immediate: true
        },
        // Отслеживаем изменения в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
            if (!this.editingItemId && this.clientBalanceSelected && Array.isArray(newVal) && newVal.length) {
                this.applyBalanceDefaults(this.selectedBalanceId);
            }
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
            this.ensureValidCurrencySelection();
            if (!this.clientBalanceSelected && !this.currencyId && this.cashId) {
                this.updateCurrencyFromCash(this.cashId);
            }
            this.handleCurrencyOrCashChange();
        },
        '$store.state.transactionCategories'(newVal) {
            this.allCategories = newVal;
        },
        '$store.state.clients': {
            handler(newClients) {
                if (!this.selectedClient?.id) {
                    return;
                }
                const updated = newClients?.find((c) => c.id === this.selectedClient.id);
                if (!updated) {
                    return;
                }
                if (this.isDocumentPaymentContext) {
                    this.selectedClient = attachDocumentBalancesToClient(updated, this.clientBalances);
                } else {
                    this.selectedClient = updated;
                }
                if (this.isDocumentClientBalanceLocked) {
                    return;
                }
                if (this.isDocumentPaymentContext) {
                    this.syncDocumentBalancePrefill();
                    return;
                }
                if (this.selectedClient.balances?.length) {
                    this.syncDocumentBalancePrefill(this.selectedClient.balances);
                } else {
                    this.selectedBalanceId = null;
                }
            },
            immediate: true,
            deep: true
        },
        selectedClient: {
            handler(newClient, oldClient) {
                if (this.fieldConfig('debt').visibleWhenClient && !newClient?.id) {
                    this.isDebt = false;
                }
                if (!newClient || (oldClient && newClient.id !== oldClient.id)) {
                    if (!this.isDocumentPaymentContext) {
                        this.selectedBalanceId = null;
                    }
                    this.syncDocumentBalancePrefill();
                    return;
                }
                if (!this.isDocumentPaymentContext && newClient.balances?.length) {
                    this.syncDocumentBalancePrefill(newClient.balances);
                } else if (this.isDocumentPaymentContext) {
                    this.selectedClient = attachDocumentBalancesToClient(
                        this.selectedClient,
                        this.clientBalances,
                    );
                    this.syncDocumentBalancePrefill();
                }
            },
            deep: true
        },
        formConfig: {
            handler() {
                this.applyFormConstraints();
            },
            deep: true
        },
        cashId(newCashId) {
            if (!this.editingItemId && !this.clientBalanceSelected && newCashId) {
                this.updateCurrencyFromCash(newCashId);
            }
            this.handleCurrencyOrCashChange();
        },
        clientBalanceSelected: {
            handler(isLocked) {
                if (isLocked && !this.editingItemId && this.selectedBalanceId) {
                    this.applyBalanceDefaults(this.selectedBalanceId);
                }
            },
        },
        currencyId() {
            this.handleCurrencyOrCashChange();
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCategories(),
                this.fetchAllCashRegisters(),
            ]);
            this.ensureValidCurrencySelection();

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

            if (this.isDocumentPaymentContext) {
                await this.ensureDocumentPaymentClientBalances();
                this.selectedClient = attachDocumentBalancesToClient(
                    this.selectedClient,
                    this.clientBalances,
                );
            }
            this.syncDocumentBalancePrefill();

            if (!this.editingItem && this.warehouseReceiptId) {
                await this.loadWarehouseReceiptForSource();
            }
            if (!this.editingItem && this.warehousePurchaseId) {
                await this.loadWarehousePurchaseForSource();
            }

            this.logWhReceiptGoodsPaymentState('mounted-after-init');

            this.applyFormConstraints();
            if (!this.editingItemId && this.orderId && this.defaultCashId && this.allCashRegisters?.length
                && this.fieldConfig('paymentType').visible !== false) {
                const reg = this.allCashRegisters.find((c) => c.id == this.defaultCashId);
                if (reg) {
                    this.paymentType = reg.isCash ? 1 : 0;
                }
            }
            if (!this.editingItemId && this.clientBalanceSelected && this.allCashRegisters?.length) {
                this.applyBalanceDefaults(this.selectedBalanceId);
            } else if (!this.editingItemId && !this.orderId && this.formConfig?.paymentType?.visible && this.allCashRegisters?.length) {
                this.syncCashIdWithPaymentType();
            }
            if (!this.editingItem && this.formConfig?.options?.loadSalaryAmountByPaymentType && this.selectedClient?.employeeId) {
                await this.loadEmployeeSalaryAmount();
            }
            this.saveInitialState();
        });
    },
    methods: {
        logWhReceiptGoodsPaymentState(step, extra = {}) {
            if (!this.isWhReceiptGoodsPaymentPreset) {
                return;
            }
            const defaultCurrency = this.$store.state.currencies?.find((c) => c.isDefault);
            const cashRegister = this.allCashRegisters?.find((c) => Number(c.id) === Number(this.cashId));
            logWhReceiptGoodsPayment(step, {
                receiptId: this.warehouseReceiptId,
                documentBalanceId: this.documentBalanceId,
                selectedBalanceId: this.selectedBalanceId,
                prefillAmount: this.prefillAmount,
                warehouseReceiptGoodsPaymentMaxDefault: this.warehouseReceiptGoodsPaymentMaxDefault,
                origAmount: this.origAmount,
                currencyId: this.currencyId,
                defaultCurrencyId: defaultCurrency?.id ?? null,
                defaultCurrencyCode: defaultCurrency?.code ?? null,
                cashId: this.cashId,
                cashCurrencyId: cashRegister?.currencyId ?? null,
                cashCurrencyCode: cashRegister?.currencyCode ?? null,
                propClientBalancesCount: this.clientBalances?.length ?? 0,
                propClientBalanceIds: (this.clientBalances || []).map((b) => b.id),
                selectedClientId: this.selectedClient?.id ?? null,
                selectedClientBalancesCount: this.selectedClient?.balances?.length ?? 0,
                selectedClientBalanceIds: (this.selectedClient?.balances || []).map((b) => b.id),
                transactionBalancesListCount: this.transactionBalancesList?.length ?? 0,
                transactionBalancesListIds: (this.transactionBalancesList || []).map((b) => b.id),
                documentPaymentValidationKey: this.documentPaymentValidationKey,
                ...extra,
            });
        },
        resolveBalancesForPrefill(balancesOverride = null) {
            if (balancesOverride?.length) {
                return balancesOverride;
            }
            const list = this.transactionBalancesList;
            return list?.length ? list : null;
        },
        resolveBalanceIdOnChange(balanceId) {
            if (this.isDocumentClientBalanceLocked) {
                return this.documentBalanceId;
            }
            return balanceId;
        },
        syncDocumentBalancePrefill(balancesOverride = null) {
            if (this.editingItemId) {
                return;
            }
            const balances = this.resolveBalancesForPrefill(balancesOverride);
            if (!balances?.length) {
                return;
            }
            const balanceId = this.resolvePrefillBalanceIdForClient(balances);
            if (balanceId == null) {
                return;
            }
            const changed = Number(this.selectedBalanceId) !== Number(balanceId);
            this.selectedBalanceId = balanceId;
            if (changed || this.isDocumentClientBalanceLocked) {
                this.applyBalanceDefaults(balanceId, {
                    includePaymentType: !this.isDocumentPaymentContext,
                });
            }
        },
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
        onSelectedProjectUpdate(project) {
            applyProjectSelection(this, project);
            if (!this.isFieldVisible('project')) {
                return;
            }
            if (this.useProjectContractBinding && this.sourceType === 'contract' && this.selectedSource) {
                const contractProjectId = this.selectedSource.projectId;
                if (contractProjectId != null && Number(contractProjectId) !== Number(this.projectId)) {
                    this.resetSourceState();
                }
            }
            if (!this.projectId || !this.initialProjectId) {
                return;
            }
            if (this.editingItemId) {
                return;
            }
            if (this.isFieldVisible('client') && this.isFieldRequired('client')) {
                return;
            }
            if (project?.client) {
                this.selectedClient = project.client;
            }
        },
        shouldSubmitClientBalanceId() {
            return shouldSubmitClientBalanceIdForTransaction(
                this.isDocumentPaymentContext,
                this.documentBalanceId,
                this.selectedBalanceId,
                {
                    clientExcludedFromRequest: this.fieldConfig('client').excludeFromRequest,
                    submitClientBalanceIdOption: this.formConfig?.options?.submitClientBalanceId === true,
                },
            );
        },
        resolveClientBalanceIdForSubmit() {
            const selected = normalizeBalanceId(this.selectedBalanceId);
            if (selected != null) {
                return selected;
            }
            if (!this.isDocumentPaymentContext) {
                return null;
            }
            return resolveTransactionPrefillBalanceId(this.transactionBalancesList, {
                documentBalanceId: this.documentBalanceId,
            });
        },
        async ensureDocumentPaymentClientBalances() {
            if (!this.isDocumentPaymentContext) {
                return;
            }
            const client = this.selectedClient || this.initialClient;
            const clientId = client?.id;
            if (!clientId) {
                return;
            }
            if (Array.isArray(client.balances) && client.balances.length > 0) {
                return;
            }
            const balances = await loadClientBalancesForForm(clientId, client);
            if (balances.length) {
                this.selectedClient = { ...client, balances };
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
                const bindingKeyByType = config.bindingKeyByType?.[this.type];
                const bindingKey = bindingKeyByType ?? config.bindingKey;
                if (!bindingKey) {
                    return;
                }
                const boundCategoryId = resolveBoundCategoryId(this.$store.getters.currentCompany, bindingKey);
                if (boundCategoryId != null) {
                    this.categoryId = boundCategoryId;
                }
            }
        },
        applyTypeConstraints() {
            if (!this.editingItemId) {
                const enforcedValue = this.fieldConfig('type').enforcedValue;
                if (enforcedValue != null) {
                    this.type = enforcedValue;
                    if (this.fieldConfig('category').visible !== false) {
                        const presetDefault = this.formConfig?.options?.defaultCategoryId;
                        if (presetDefault != null) {
                            this.categoryId = presetDefault;
                        } else {
                            this.categoryId = enforcedValue === 'outcome'
                                ? resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_OUTCOME)
                                : resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME);
                        }
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
                sourceId: this.getResolvedSourceId()
            };
        },
        getSourceTypeForBackend() {
            if (!this.sourceType || !this.selectedSource) return null;
            return SOURCE_TYPE_TO_BACKEND_MODEL[this.sourceType] ?? null;
        },
        resolveSourceTypeForSubmit() {
            const sourceTypeFromSelection = this.getSourceTypeForBackend();
            if (sourceTypeFromSelection) return sourceTypeFromSelection;
            if (this.orderId) return 'App\\Models\\Order';
            if (this.contractId) return 'App\\Models\\ProjectContract';
            if (this.warehouseReceiptId) return 'App\\Models\\WhReceipt';
            if (this.warehousePurchaseId) return 'App\\Models\\WhPurchase';
            return null;
        },
        getResolvedSourceId() {
            return this.selectedSource?.id || this.orderId || this.contractId || this.warehouseReceiptId || this.warehousePurchaseId || null;
        },
        syncCashIdWithPaymentType() {
            const isCash = this.paymentType === 1;
            const selected = this.allCashRegisters.find((c) => Number(c.id) === Number(this.cashId));
            if (!selected || selected.isCash === isCash) {
                return;
            }
            const matching = this.allCashRegisters.find((c) => c.isCash === isCash);
            this.cashId = matching ? matching.id : '';
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
                    if (!cashRegisters?.length) {
                        return;
                    }
                    if (!this.cashId) {
                        this.cashId = this.defaultCashId || cashRegisters[0].id;
                    }
                    if (
                        !this.currencyId
                        && this.cashId
                        && !this.clientBalanceSelected
                    ) {
                        this.updateCurrencyFromCash(this.cashId);
                    }
                }
            });
        },
        async calculateExchangeRate() {
            if (!this.showExchangeRate || this.isExchangeRateManual || !this.currencyId || !this.cashId) {
                this.exchangeRate = null;
                return;
            }

            const selectedCash = this.selectedCashRegister;
            if (!selectedCash) {
                this.exchangeRate = null;
                return;
            }

            const transactionCurrencyId = Number(this.currencyId);
            const cashCurrencyId = Number(selectedCash.currencyId);

            if (transactionCurrencyId === cashCurrencyId) {
                this.exchangeRate = normalizeExchangeRateValue(1);
                return;
            }

            try {
                const transactionCurrency = this.currencies.find((c) => Number(c.id) === transactionCurrencyId);
                const cashCurrency = this.currencies.find((c) => Number(c.id) === cashCurrencyId);
                const defaultCurrency = this.currencies.find((c) => c.isDefault);

                if (!transactionCurrency || !cashCurrency || !defaultCurrency) {
                    this.exchangeRate = normalizeExchangeRateValue(1);
                    return;
                }

                const fromRateData = await AppController.getCurrencyExchangeRate(transactionCurrencyId);
                const toRateData = await AppController.getCurrencyExchangeRate(cashCurrencyId);

                const fromRate = parseFloat(fromRateData?.exchangeRate);
                const toRate = parseFloat(toRateData?.exchangeRate);

                if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
                    this.exchangeRate = normalizeExchangeRateValue(1);
                    return;
                }

                let calculatedRate;
                if (transactionCurrencyId === Number(defaultCurrency.id)) {
                    calculatedRate = normalizeExchangeRateValue(1 / toRate);
                } else if (cashCurrencyId === Number(defaultCurrency.id)) {
                    calculatedRate = normalizeExchangeRateValue(fromRate);
                } else {
                    calculatedRate = normalizeExchangeRateValue(fromRate / toRate);
                }

                this.exchangeRate = calculatedRate;
            } catch {
                this.exchangeRate = normalizeExchangeRateValue(1);
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
                if (!this.isFieldVisible('client')) {
                    const project = this.selectedProject;
                    if (project?.client) {
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
            if (!this.editingItemId && this.documentPaymentValidationKey) {
                throw new Error(this.$t(this.documentPaymentValidationKey));
            }

            if (this.warehouseGoodsPaymentMaxForValidation != null) {
                const cap = Number(this.warehouseGoodsPaymentMaxForValidation);
                const amt = parseFloat(this.origAmount);
                if (Number.isFinite(amt) && Number.isFinite(cap) && amt > cap + 0.0001) {
                    throw new Error(this.$t(this.warehouseGoodsPaymentExceedsKey));
                }
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

            const projectIdForSubmit = this.projectId ?? this.initialProjectId ?? null;
            const sourceTypeForSubmit = this.resolveSourceTypeForSubmit();
            const amountRoundingScopeForSave = resolveAmountRoundingScopeByTransactionSource({
                sourceType: sourceTypeForSubmit,
                source: this.sourceType,
                orderId: this.orderId,
                contractId: this.contractId,
                warehouseReceiptId: this.warehouseReceiptId,
                warehousePurchaseId: this.warehousePurchaseId,
            });

            if (this.editingItemId != null) {
                const roundedAmount = roundDocumentTotalForScope(this.origAmount, amountRoundingScopeForSave);
                const updateData = {
                    categoryId: this.categoryId,
                    projectId: projectIdForSubmit,
                    date: this.date,
                    origAmount: roundedAmount,
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

                if (sourceTypeForSubmit) {
                    updateData.sourceType = sourceTypeForSubmit;
                    updateData.sourceId = this.getResolvedSourceId();
                }

                return updateData;
            } else {
                const roundedAmount = roundDocumentTotalForScope(this.origAmount, amountRoundingScopeForSave);
                const typeValue = this.type === 'income' ? 1 : this.type === 'outcome' ? 0 : null;
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
                }
                const balanceIdForSubmit = this.resolveClientBalanceIdForSubmit();
                if (this.isDocumentPaymentContext) {
                    if (balanceIdForSubmit != null) {
                        requestData.clientBalanceId = balanceIdForSubmit;
                    }
                } else if (this.shouldSubmitClientBalanceId()) {
                    requestData.clientBalanceId = this.selectedBalanceId;
                }

                if (sourceTypeForSubmit) {
                    requestData.sourceType = sourceTypeForSubmit;
                    requestData.sourceId = this.getResolvedSourceId();
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
            this.cashId = this.defaultCashId || this.allCashRegisters[0]?.id;
            this.origAmount = 0;
            this.note = '';
            this.isDebt = this.fieldConfig('debt').enforcedValue ?? false;
            this.categoryId = resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME);
            this.projectId = this.initialProjectId;
            this.date = this.getCurrentLocalDateTime();
            this.selectedClient = this.initialClient || null;
            this.selectedBalanceId = null;
            this.resetSourceState();
            this.paymentType = 1;
            this.exchangeRate = null;
            this.isExchangeRateManual = false;
            this.applyFormConstraints();
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
                this.categoryId = dto.categoryId
                    ?? (this.type === 'income'
                        ? resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_INCOME)
                        : resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.TRANSACTION_DEFAULT_OUTCOME));
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
        async applyContractSelection(contract) {
            if (this.editingItemId || !contract?.id) {
                return;
            }
            let full = contract;
            try {
                const loaded = await ProjectContractController.getItem(contract.id);
                if (loaded) {
                    full = loaded;
                }
            } catch {
                /* use list item */
            }
            this.applyContractPrefill(full);
            await this.applyContractContextFromContract(full);
        },
        resolveContractClientId(contract) {
            const direct = contract?.clientId ?? contract?.client?.id ?? null;
            if (direct != null && direct !== '') {
                return Number(direct);
            }
            const fromProject = this.selectedProject?.client?.id ?? null;
            return fromProject != null && fromProject !== '' ? Number(fromProject) : null;
        },
        async applyContractContextFromContract(contract) {
            if (this.editingItemId || !contract) {
                return;
            }
            if (contract.projectId) {
                this.projectId = contract.projectId;
                if (this.isFieldVisible('project')) {
                    try {
                        const project = await ProjectController.getItem(contract.projectId);
                        applyProjectSelection(this, project);
                    } catch {
                        applyProjectSelection(this, null);
                    }
                }
            }
            const clientId = this.resolveContractClientId(contract);
            if (clientId) {
                await this.applyClientFromContract(clientId, contract);
            } else {
                this.applyContractPaymentFields(contract);
            }
        },
        pickBalanceIdFromContract(contract, balances = []) {
            const raw = contract?.clientBalanceId ?? contract?.client_balance_id ?? null;
            if (raw != null && raw !== '') {
                const id = Number(raw);
                if (!Number.isNaN(id) && (!balances.length || balances.some((b) => Number(b.id) === id))) {
                    return id;
                }
            }
            const currencyId = contract?.currencyId ?? contract?.currency_id ?? null;
            if (currencyId != null && balances.length) {
                const byCurrency = balances.find(
                    (b) => Number(b.currencyId ?? b.currency_id) === Number(currencyId)
                );
                if (byCurrency) {
                    return Number(byCurrency.id);
                }
            }
            return null;
        },
        resolvePrefillBalanceIdForClient(balances = []) {
            return resolveTransactionPrefillBalanceId(balances, {
                documentBalanceId: this.documentBalanceId,
                contractBalanceId: this.contractPrefillBalanceId,
                contract: this.sourceType === 'contract' ? this.selectedSource : null,
                pickContractBalance: (contract, list) => this.pickBalanceIdFromContract(contract, list),
            });
        },
        async applyClientFromContract(clientId, contract) {
            let client;
            try {
                client = await ClientController.getItem(clientId);
            } catch {
                return;
            }
            const balances = Array.isArray(client.balances) ? client.balances : [];
            this.contractPrefillBalanceId = this.pickBalanceIdFromContract(contract, balances);
            try {
                this.selectedClient = client;
                this.syncDocumentBalancePrefill(
                    this.isDocumentPaymentContext && this.clientBalances?.length
                        ? this.clientBalances
                        : balances,
                );
                this.applyContractPaymentFields(contract);
            } finally {
                this.$nextTick(() => {
                    this.contractPrefillBalanceId = null;
                });
            }
        },
        applyContractPaymentFields(contract) {
            if (contract?.currencyId != null && contract.currencyId !== '') {
                this.currencyId = Number(contract.currencyId);
            }
            if (contract?.type !== undefined && this.formConfig?.paymentType?.visible) {
                this.paymentType = Number(contract.type) === 1 ? 1 : 0;
            }
            if (contract?.cashId != null && contract.cashId !== '') {
                this.applyContractCashId(contract);
            }
        },
        applyContractCashId(contract) {
            const cashId = Number(contract.cashId);
            if (!Number.isFinite(cashId) || !Array.isArray(this.allCashRegisters) || !this.allCashRegisters.length) {
                return;
            }
            let list = this.allCashRegisters;
            const balances = this.selectedClient?.balances;
            if (this.selectedBalanceId && Array.isArray(balances) && balances.length) {
                const balance = balances.find((b) => Number(b.id) === Number(this.selectedBalanceId));
                if (balance) {
                    list = this.filterCashRegistersStrictForBalance(balance);
                }
            }
            const match = list.find((c) => Number(c.id) === cashId);
            if (match) {
                this.cashId = match.id;
                if (!this.clientBalanceSelected) {
                    this.updateCurrencyFromCash(match.id);
                }
                if (this.formConfig?.paymentType?.visible) {
                    this.paymentType = match.isCash ? 1 : 0;
                }
                return;
            }
            if (this.allCashRegisters.some((c) => Number(c.id) === cashId)) {
                this.cashId = cashId;
                if (!this.clientBalanceSelected) {
                    this.updateCurrencyFromCash(cashId);
                }
            }
        },
        async loadWarehouseReceiptForSource() {
            if (!this.warehouseReceiptId) return;
            try {
                const receipt = await WarehouseReceiptController.getItem(this.warehouseReceiptId);
                if (receipt) {
                    this.setSourceState('warehouse_receipt', receipt);
                    this.projectId = receipt.projectId ?? '';
                    if (receipt.client && this.fieldConfig('client').disabled) {
                        this.selectedClient = receipt.client;
                    }
                    if (receipt.cashId && !this.cashId) {
                        this.cashId = receipt.cashId;
                        this.updateCurrencyFromCash(receipt.cashId);
                    }
                    await this.ensureDocumentPaymentClientBalances();
                    this.selectedClient = attachDocumentBalancesToClient(
                        this.selectedClient,
                        this.clientBalances,
                    );
                    this.syncDocumentBalancePrefill();
                }
            } catch {
                this.resetSourceState();
            }
        },
        async loadWarehousePurchaseForSource() {
            if (!this.warehousePurchaseId) return;
            try {
                const purchase = await WarehousePurchaseController.getItem(this.warehousePurchaseId);
                if (purchase) {
                    this.setSourceState('purchase', purchase);
                    this.projectId = purchase.projectId ?? '';
                    if (purchase.supplier && this.fieldConfig('client').disabled) {
                        this.selectedClient = purchase.supplier;
                    }
                    if (purchase.cashId && !this.cashId) {
                        this.cashId = purchase.cashId;
                        this.updateCurrencyFromCash(purchase.cashId);
                    }
                }
            } catch {
                this.resetSourceState();
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
                this.exchangeRate = normalizeExchangeRateValue(newEditingItem.exchangeRate);
                this.isExchangeRateManual = !!newEditingItem.exchangeRate;
                this.applyEditingBalanceSelection(newEditingItem);
                this.handleSourceFromEditingItem(newEditingItem);
                this.applyFormConstraints();
            }
        },
        applyFormConstraints() {
            this.applyTypeConstraints();
            this.applyDebtConstraints();
            this.applyCategoryConstraints();
        },
        applyEditingBalanceSelection(editingItem) {
            const fromTransaction = editingItem?.clientBalanceId;
            if (fromTransaction != null && fromTransaction !== '') {
                this.selectedBalanceId = fromTransaction;
                return;
            }
            if (!this.isDocumentPaymentContext) {
                return;
            }
            const balanceId = this.resolvePrefillBalanceIdForClient(this.transactionBalancesList);
            if (balanceId != null) {
                this.selectedBalanceId = balanceId;
            }
        },
        handleSourceFromEditingItem(newEditingItem) {
            if (newEditingItem?.sourceType && newEditingItem?.sourceId) {
                this.loadSourceForEdit(newEditingItem.sourceType, newEditingItem.sourceId);
            } else {
                this.resetSourceState();
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
            this.origAmount = this.resolveContractRemainingAmount(contract.amount, contract.paidAmount);
            const cid = contract.currencyId;
            if (cid) this.currencyId = cid;
            if (this.fieldConfig('type').enforcedValue === 'outcome') {
                return;
            }
            if (this.fieldConfig('type').enforcedValue === undefined && this.type !== 'income') {
                this.type = 'income';
            }
            const catCfg = this.fieldConfig('category');
            if (!this.isFieldVisible('category') || catCfg.bindingKey || catCfg.bindingKeyByType) {
                return;
            }
            this.categoryId = resolveBoundCategoryId(this.$store.getters.currentCompany, TRANSACTION_CATEGORY_BINDING_KEYS.CONTRACT);
        },
        normalizeDecimalParts(value) {
            const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
            if (!normalized) {
                return { sign: 1, intPart: '0', fracPart: '' };
            }
            const sign = normalized.startsWith('-') ? -1 : 1;
            const abs = normalized.replace(/^[+-]/, '');
            if (!/^\d*\.?\d*$/.test(abs)) {
                return { sign: 1, intPart: '0', fracPart: '' };
            }
            const [rawInt = '0', rawFrac = ''] = abs.split('.');
            const intPart = rawInt === '' ? '0' : rawInt.replace(/^0+(?=\d)/, '');
            return { sign, intPart, fracPart: rawFrac };
        },
        decimalPartsToScaledBigInt(parts, scale) {
            const fracPadded = (parts.fracPart || '').padEnd(scale, '0');
            const digits = `${parts.intPart}${fracPadded}`;
            if (!/^\d+$/.test(digits)) {
                return 0n;
            }
            const value = BigInt(digits);
            return parts.sign < 0 ? -value : value;
        },
        resolveContractRemainingAmount(amountRaw, paidRaw) {
            const amountParts = this.normalizeDecimalParts(amountRaw);
            const paidParts = this.normalizeDecimalParts(paidRaw);
            const scale = Math.max(amountParts.fracPart.length, paidParts.fracPart.length, 2);
            const amountScaled = this.decimalPartsToScaledBigInt(amountParts, scale);
            const paidScaled = this.decimalPartsToScaledBigInt(paidParts, scale);
            const diffScaled = amountScaled - paidScaled;
            if (diffScaled <= 0n) {
                return 0;
            }
            const divider = 10 ** scale;
            return Number(diffScaled) / divider;
        },
        async loadSourceForEdit(sourceType, sourceId) {
            try {
                const sourceKind = getSourceKind(sourceType, '');
                const uiType = SOURCE_KIND_TO_UI_SOURCE_TYPE[sourceKind];
                if (!uiType) {
                    this.resetSourceState();
                    return;
                }

                const loaders = {
                    order: OrderController.getItem,
                    sale: SaleController.getItem,
                    warehouse_receipt: WarehouseReceiptController.getItem,
                    purchase: WarehousePurchaseController.getItem,
                    contract: ProjectContractController.getItem,
                };

                const loadSource = loaders[uiType];
                const sourceItem = loadSource ? await loadSource(sourceId) : null;
                if (!sourceItem) {
                    this.resetSourceState();
                    return;
                }

                this.setSourceState(uiType, sourceItem);
            } catch {
                this.resetSourceState();
            }
        },
        setSourceState(sourceType, sourceItem) {
            this.sourceType = sourceType;
            this.selectedSource = sourceItem;
        },
        resetSourceState() {
            this.setSourceState('', null);
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