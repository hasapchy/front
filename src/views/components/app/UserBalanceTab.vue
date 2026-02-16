<template>
    <div v-if="canViewBalance" class="mt-4">
        <div v-if="!balanceLoading && editingItem && editingItem.id && !employeeClient && !clientCheckLoading"
            class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center gap-2">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                <div class="flex-1">
                    <p class="text-sm text-yellow-800 font-semibold">
                        {{ $t('employeeClientNotFound') }}
                    </p>
                    <p class="text-xs text-yellow-700 mt-1">
                        {{ $t('employeeClientNotFoundDescription') }}
                    </p>
                </div>
            </div>
        </div>

        <div v-if="!balanceLoading && editingItem && balanceDataLoaded" class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="fas fa-wallet text-blue-500"></i>
                    <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                </div>
                <span v-if="shouldShowBalanceSelect" class="relative inline-block balance-dropdown-wrap">
                    <button type="button"
                        @mousedown.prevent="showBalanceDropdown = !showBalanceDropdown"
                        :class="['text-lg', 'font-bold', 'cursor-pointer', 'flex', 'items-center', 'gap-1', 'pr-1', 'border-0', 'bg-transparent', 'hover:opacity-80', balanceColorClass(totalBalance)]">
                        {{ formatBalanceWithCurrency(totalBalance) }}
                        <i class="fas fa-chevron-down text-[10px] opacity-70"></i>
                    </button>
                    <transition name="appear">
                        <ul v-show="showBalanceDropdown"
                            class="absolute right-0 top-full mt-1 min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-40 overflow-y-auto">
                            <li v-for="balance in employeeClient.balances" :key="balance.id"
                                @mousedown.prevent="selectBalance(balance)"
                                class="px-3 py-2 cursor-pointer text-sm hover:bg-gray-50">
                                <span :class="balanceColorClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
                                {{ balance.currency?.symbol || '' }}
                                <span v-if="balance.isDefault" class="text-amber-500">★</span>
                            </li>
                        </ul>
                    </transition>
                </span>
                <b v-else :class="[
                    'text-lg',
                    balanceColorClass(totalBalance)
                ]">{{ formatBalanceWithCurrency(totalBalance) }}</b>
            </div>
        </div>

        <transition name="fade" mode="out-in">
            <div v-if="editingItem && !balanceLoading" key="table">
                <DraggableTable table-key="user.balance" :columns-config="columnsConfig"
                    :table-data="balanceHistory || []" :item-mapper="itemMapper" :onItemClick="handleBalanceItemClick">
                    <template #tableSettingsAdditional>
                        <FiltersContainer v-if="employeeClient?.balances?.length" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" @reset="resetFilters" @apply="applyFilters">
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                                <input type="date" v-model="dateFrom" class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                                <input type="date" v-model="dateTo" class="w-full" />
                            </div>
                        </FiltersContainer>
                        <template v-if="!hideActions">
                            <PrimaryButton icon="fas fa-money-bill-wave" :onclick="handleSalaryAccrual"
                                :is-success="true" :disabled="buttonsDisabled">
                                {{ $t('accrueSalary') }}
                            </PrimaryButton>
                            <PrimaryButton icon="fas fa-hand-holding-usd" :onclick="handleSalaryPayment"
                                :is-success="true" :disabled="buttonsDisabled">
                                {{ $t('paySalary') }}
                            </PrimaryButton>
                            <PrimaryButton icon="fas fa-gift" :onclick="handleBonus" :is-success="true"
                                :disabled="buttonsDisabled">
                                {{ $t('bonus') }}
                            </PrimaryButton>
                            <PrimaryButton icon="fas fa-exclamation-triangle" :onclick="handlePenalty" :isDanger="true"
                                :disabled="buttonsDisabled">
                                {{ $t('penalty') }}
                            </PrimaryButton>
                            <PrimaryButton icon="fas fa-money-check-alt" :onclick="handleAdvance" :is-success="true"
                                :disabled="buttonsDisabled">
                                {{ $t('advance') }}
                            </PrimaryButton>
                        </template>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="transactionModalOpen" :onclose="closeTransactionModal">
            <TransactionCreatePage
                v-if="transactionModalOpen && editingItem && editingItem.id && employeeClient && transactionModalType"
                ref="transactionForm" :form-config="transactionFormConfig" :initial-client="employeeClient"
                :client-balances="employeeClient?.balances || []"
                :header-text="getTransactionModalHeader()" @saved="handleTransactionSaved"
                @saved-error="handleTransactionError" />
        </SideModalDialog>

        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="min-h-64">
                    <TableSkeleton />
                </div>
            </template>
            <template v-else>
                <TransactionCreatePage v-if="selectedEntity && selectedEntity.type === 'transaction'"
                    :editingItem="editingTransactionItem" :initialClient="employeeClient"
                    :client-balances="employeeClient?.balances || []"
                    @saved="onEntitySaved" @saved-error="onEntitySavedError" @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>

    </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import { markRaw } from 'vue';

export default {
    name: 'UserBalanceTab',
    mixins: [notificationMixin, getApiErrorMessage, filtersMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        FiltersContainer,
        TableSkeleton,
        SourceButtonCell,
        TransactionCreatePage,
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        hideActions: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            currencySymbol: '',
            balanceLoading: false,
            balanceDataLoaded: false,
            balanceHistory: [],
            totalBalance: 0,
            transactionModalOpen: false,
            transactionModalType: null,
            employeeClient: null,
            clientCheckLoading: false,
            entityModalOpen: false,
            entityLoading: false,
            selectedEntity: null,
            editingTransactionItem: null,
            selectedBalanceId: null,
            dateFrom: null,
            dateTo: null,
            showBalanceDropdown: false,
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id),
                },
            },
        };
    },
    computed: {
        canViewBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view') ||
                this.$store.getters.hasPermission('settings_client_balance_view_own');
        },
        balanceStatusText() {
            const employeeName = this.editingItem?.name || this.$t('employee');
            if (this.totalBalance > 0) {
                return this.$t('employeeOwesUs', { name: employeeName });
            } else if (this.totalBalance < 0) {
                return this.$t('weOweEmployee', { name: employeeName });
            } else {
                return this.$t('mutualSettlements');
            }
        },
        transactionFormConfig() {
            if (this.transactionModalType === 'bonus') {
                return TRANSACTION_FORM_PRESETS.employeeBonus;
            } else if (this.transactionModalType === 'penalty') {
                return TRANSACTION_FORM_PRESETS.employeePenalty;
            } else if (this.transactionModalType === 'salaryAccrual') {
                return TRANSACTION_FORM_PRESETS.employeeSalaryAccrual;
            } else if (this.transactionModalType === 'salaryPayment') {
                return TRANSACTION_FORM_PRESETS.employeeSalaryPayment;
            } else if (this.transactionModalType === 'advance') {
                return TRANSACTION_FORM_PRESETS.employeeAdvance;
            }
            return {};
        },
        buttonsDisabled() {
            return !this.editingItem || !this.editingItem.id || !this.employeeClient;
        },
        defaultBalanceId() {
            if (!this.employeeClient?.balances?.length) return null;
            const defaultBalance = this.employeeClient.balances.find(b => b.isDefault);
            return defaultBalance ? defaultBalance.id : (this.employeeClient.balances[0]?.id ?? null);
        },
        shouldShowBalanceSelect() {
            return this.canViewBalance && this.employeeClient?.balances?.length > 1;
        },
        columnsConfig() {
            return [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("dateUser"), size: 120 },
                {
                    name: "sourceType",
                    label: this.$t("source"),
                    size: 120,
                    component: markRaw(SourceButtonCell),
                    props: (item) => {
                        const sourceType = item.sourceType || null;
                        const source = item.source || null;
                        const isTransaction = source === 'transaction' || (sourceType && sourceType.includes('Transaction'));
                        const sourceId = isTransaction ? item.sourceId : (item.sourceSourceId || item.sourceId);

                        return {
                            sourceType: sourceType,
                            sourceId: sourceId,
                            onUpdated: () => {
                                this.fetchBalanceHistory();
                            },
                            onDeleted: () => {
                                this.fetchBalanceHistory();
                            }
                        };
                    }
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "categoryName", label: this.$t("category"), size: 150 },
                { name: "projectName", label: this.$t("project"), size: 150 },
                {
                    name: "debt",
                    label: this.$t("debt"),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.isDebt ?? item.is_debt ?? false,
                        variant: 'text'
                    })
                },
                {
                    name: "clientImpact",
                    label: this.$t("impact"),
                    size: 130,
                    component: markRaw(ClientImpactCell),
                    props: (item) => ({
                        item: item,
                        currencySymbol: this.currencySymbol,
                        formatNumberFn: this.$formatNumber
                    })
                },
            ];
        }
    },
    async mounted() {
        if (!this.canViewBalance) {
            return;
        }
        document.addEventListener('click', this.handleBalanceDropdownClickOutside);
        await this.fetchDefaultCurrency();
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleBalanceDropdownClickOutside);
    },
    watch: {
        'editingItem.id': {
            async handler(newId) {
                if (newId) {
                    if (!this.canViewBalance) {
                        this.balanceHistory = [];
                        this.totalBalance = 0;
                        this.balanceDataLoaded = false;
                        this.employeeClient = null;
                        this.selectedEntity = null;
                        this.entityModalOpen = false;
                        this.entityLoading = false;
                        return;
                    }
                    this.balanceDataLoaded = false;
                    await this.findEmployeeClient();
                    await this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.totalBalance = 0;
                    this.balanceDataLoaded = false;
                    this.employeeClient = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.selectedBalanceId = null;
                }
            },
            immediate: true,
        },
        'employeeClient.balances': {
            handler() {
                if (this.employeeClient) {
                    this.initDefaultBalance();
                    this.$nextTick(() => this.fetchBalanceHistory());
                }
            },
            deep: true,
        },
    },
    methods: {
        formatBalance(balance) {
            return this.$formatNumber(balance, null, true);
        },
        formatBalanceWithCurrency(balance) {
            return `${this.formatBalance(balance)} ${this.currencySymbol}`;
        },
        balanceColorClass(value) {
            const v = value == null ? 0 : Number(value);
            return v === 0 ? 'text-[#337AB7]' : v > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]';
        },
        selectBalance(balance) {
            this.selectedBalanceId = balance.id;
            this.showBalanceDropdown = false;
            this.fetchBalanceHistory();
        },
        handleBalanceDropdownClickOutside(event) {
            if (!event.target.closest('.balance-dropdown-wrap')) {
                this.showBalanceDropdown = false;
            }
        },
        initDefaultBalance() {
            if (this.employeeClient?.balances?.length) {
                const defaultBalance = this.employeeClient.balances.find(b => b.isDefault);
                this.selectedBalanceId = defaultBalance ? defaultBalance.id : (this.employeeClient.balances[0]?.id || null);
            } else {
                this.selectedBalanceId = null;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFrom: null,
                dateTo: null
            }, () => {
                this.initDefaultBalance();
                this.fetchBalanceHistory();
            });
        },
        applyFilters() {
            this.fetchBalanceHistory();
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFrom, defaultValue: null },
                { value: this.dateTo, defaultValue: null }
            ]);
        },
        itemMapper(i, c) {
            switch (c) {
                case "id":
                    return i.sourceId ?? i.id ?? '-';
                case "dateUser":
                    return i.dateUser;
                case "note":
                    return i.note;
                case "categoryName":
                    const categoryName = i.categoryName || i.category_name;
                    return categoryName ? this.$t(`transactionCategory.${categoryName}`, categoryName) : '';
                case "projectName":
                    return i.projectName ?? '-';
                case "clientImpact":
                    return parseFloat(i.amount || 0);
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            if (!item?.sourceId) return;

            try {
                this.entityLoading = true;
                const data = await this.ENTITY_CONFIG.transaction.fetch(item.sourceId);
                this.editingTransactionItem = data;
                this.entityModalOpen = true;
                this.selectedEntity = { type: 'transaction', data };
            } catch (error) {
                console.error('Error loading transaction:', error);
                this.showNotification(this.$t('error'), this.$t('errorLoadingTransaction'), true);
            } finally {
                this.entityLoading = false;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
            this.entityLoading = false;
            this.editingTransactionItem = null;
        },
        async onEntitySaved() {
            this.closeEntityModal();
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
            }
            await this.findEmployeeClient();
            await this.fetchBalanceHistory();
        },
        onEntitySavedError(error) {
            this.handleEntityError(error);
        },
        async onEntityDeleted() {
            this.closeEntityModal();
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
            }
            await this.findEmployeeClient();
            await this.fetchBalanceHistory();
        },
        onEntityDeletedError(error) {
            this.handleEntityError(error);
        },
        handleEntityError(error) {
            let errorMessage;
            if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = this.getApiErrorMessage(error);
                if (Array.isArray(errorMessage)) {
                    errorMessage = errorMessage.join(', ');
                }
            }
            this.showNotification(this.$t('error'), errorMessage, true);
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencySymbol = defaultCurrency ? defaultCurrency.symbol : '';
            } catch (error) {
                this.currencySymbol = '';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem || !this.editingItem.id) return;

            this.balanceLoading = true;
            try {
                if (!this.employeeClient?.id) {
                    this.balanceHistory = [];
                    this.totalBalance = 0;
                    this.balanceDataLoaded = true;
                    return;
                }
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.employeeClient.id,
                    null,
                    null,
                    this.dateFrom,
                    this.dateTo,
                    this.selectedBalanceId
                ) || [];
                const selectedBalance = this.employeeClient.balances?.find(b => b.id === this.selectedBalanceId);
                this.totalBalance = selectedBalance ? parseFloat(selectedBalance.balance || 0) : parseFloat(this.employeeClient.balance || 0);
                this.currencySymbol = selectedBalance?.currency?.symbol || this.employeeClient.currencySymbol || '';
                this.balanceDataLoaded = true;
            } catch (e) {
                console.error('Error fetching balance history:', e);
                this.balanceHistory = [];
                this.totalBalance = 0;
                this.balanceDataLoaded = true;
            } finally {
                this.balanceLoading = false;
            }
        },
        async handleBonus() {
            await this.openTransactionModal('bonus');
        },
        async handlePenalty() {
            await this.openTransactionModal('penalty');
        },
        async handleSalaryAccrual() {
            await this.openTransactionModal('salaryAccrual');
        },
        async handleSalaryPayment() {
            await this.openTransactionModal('salaryPayment');
        },
        async handleAdvance() {
            await this.openTransactionModal('advance');
        },
        getTransactionModalHeader() {
            if (this.transactionModalType === 'bonus') {
                return this.$t('bonus');
            } else if (this.transactionModalType === 'penalty') {
                return this.$t('penalty');
            } else if (this.transactionModalType === 'salaryAccrual') {
                return this.$t('accrueSalary');
            } else if (this.transactionModalType === 'salaryPayment') {
                return this.$t('paySalary');
            } else if (this.transactionModalType === 'advance') {
                return this.$t('advance');
            }
            return '';
        },
        async openTransactionModal(type) {
            if (!this.editingItem || !this.editingItem.id) return;

            this.transactionModalType = type;
            await this.findEmployeeClient();
            if (this.employeeClient) {
                this.transactionModalOpen = true;
            } else {
                this.showNotification(
                    this.$t('error'),
                    this.$t('employeeClientNotFound'),
                    true
                );
            }
        },
        async findEmployeeClient() {
            if (!this.editingItem || !this.editingItem.id) {
                this.employeeClient = null;
                this.clientCheckLoading = false;
                return;
            }

            this.clientCheckLoading = true;
            try {
                const companyId = this.$store.getters.currentCompanyId;
                if (!companyId) {
                    this.employeeClient = null;
                    this.clientCheckLoading = false;
                    return;
                }

                const userId = Number(this.editingItem.id);
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                const client = clients.find(c => {
                    const clientEmployeeId = c.employeeId ? Number(c.employeeId) : null;
                    return clientEmployeeId === userId;
                });
                if (client?.id) {
                    const fullClient = await ClientController.getItem(client.id);
                    this.employeeClient = fullClient || client;
                } else {
                    this.employeeClient = null;
                }
                this.initDefaultBalance();
            } catch (error) {
                console.error('Error finding employee client:', error);
                this.employeeClient = null;
            } finally {
                this.clientCheckLoading = false;
            }
        },
        closeTransactionModal() {
            this.transactionModalOpen = false;
            this.transactionModalType = null;
            // Не сбрасываем employeeClient, так как он может быть нужен для других операций
        },
        async handleTransactionSaved() {
            this.closeTransactionModal();
            this.showNotification(
                this.$t('success'),
                this.$t('transactionSaved'),
                false
            );
            await this.findEmployeeClient();
            await this.fetchBalanceHistory();
        },
        handleTransactionError(error) {
            this.showNotification(
                this.$t('error'),
                typeof error === 'string' ? error : (error.message || this.$t('errorSavingTransaction')),
                true
            );
        }
    }
};
</script>
