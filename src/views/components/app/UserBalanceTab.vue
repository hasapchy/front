<template>
    <div v-if="canViewBalance" class="mt-4">
        <div v-if="editingItem && editingItem.id && !employeeClient && !clientCheckLoading"
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

        <ClientBalanceStatusPlaque
            v-if="editingItem && employeeClient && balanceDataLoaded"
            :status-text="balanceStatusText"
            :total-balance="totalBalance"
            :currency-symbol="currencySymbol"
            :balances="employeeClient?.balances || []"
            @selectBalance="selectBalance" />

        <ClientBalanceHistoryBase
            v-if="editingItem && employeeClient"
            ref="balanceHistoryBase"
            :editing-item="employeeClient"
            :columns-config="columnsConfig"
            table-key="user.balance"
            :item-mapper="itemMapper"
            :on-item-click="handleBalanceItemClick"
            :with-source-filter="true"
            :with-debt-filter="true"
            :with-pagination="true"
            @selectedBalanceIdChange="selectedBalanceIdFromBase = $event">
            <template #additionalButtons>
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
            <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                    <ul>
                        <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                            @change="log">
                            <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
                                @click="toggleVisible(index)"
                                class="flex items-center hover:bg-gray-100 p-2 rounded">
                                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                    <div>
                                        <i class="text-sm mr-2 text-[#337AB7]"
                                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                        {{ $te(element.label) ? $t(element.label) : element.label }}
                                    </div>
                                    <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
                                </div>
                            </li>
                        </draggable>
                    </ul>
                </TableFilterButton>
            </template>
        </ClientBalanceHistoryBase>

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
import ClientBalanceHistoryBase from "@/views/components/clients/ClientBalanceHistoryBase.vue";
import ClientBalanceStatusPlaque from "@/views/components/clients/ClientBalanceStatusPlaque.vue";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import getApiErrorMessage from "@/mixins/errorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import { markRaw } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next';

export default {
    name: 'UserBalanceTab',
    mixins: [notificationMixin, getApiErrorMessage, filtersMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        ClientBalanceHistoryBase,
        ClientBalanceStatusPlaque,
        TableFilterButton,
        TableSkeleton,
        SourceButtonCell,
        TransactionCreatePage,
        draggable: VueDraggableNext,
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
            balanceDataLoaded: false,
            selectedBalanceIdFromBase: null,
            transactionModalOpen: false,
            transactionModalType: null,
            employeeClient: null,
            clientCheckLoading: false,
            entityModalOpen: false,
            entityLoading: false,
            selectedEntity: null,
            editingTransactionItem: null,
            _defaultCurrencySymbol: '',
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
        totalBalance() {
            if (!this.employeeClient) return 0;
            const sid = this.selectedBalanceIdFromBase;
            const bal = this.employeeClient.balances?.find(b => b.id === sid);
            return bal ? parseFloat(bal.balance || 0) : parseFloat(this.employeeClient.balance || 0);
        },
        currencySymbol() {
            if (!this.employeeClient) return this._defaultCurrencySymbol || '';
            const sid = this.selectedBalanceIdFromBase;
            const bal = this.employeeClient.balances?.find(b => b.id === sid);
            return bal?.currency?.symbol || this.employeeClient.currencySymbol || this._defaultCurrencySymbol || '';
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
                            onUpdated: () => this.refreshBalanceHistory(),
                            onDeleted: () => this.refreshBalanceHistory()
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
        await this.fetchDefaultCurrency();
    },
    watch: {
        'editingItem.id': {
            async handler(newId) {
                if (newId) {
                    if (!this.canViewBalance) {
                        this.balanceDataLoaded = false;
                        this.employeeClient = null;
                        this.selectedEntity = null;
                        this.entityModalOpen = false;
                        this.entityLoading = false;
                        this.selectedBalanceIdFromBase = null;
                        return;
                    }
                    this.balanceDataLoaded = false;
                    this.selectedBalanceIdFromBase = null;
                    await this.findEmployeeClient();
                    if (this.employeeClient) {
                        this.balanceDataLoaded = true;
                    }
                } else {
                    this.balanceDataLoaded = false;
                    this.employeeClient = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.selectedBalanceIdFromBase = null;
                }
            },
            immediate: true,
        },
        employeeClient: {
            handler(client) {
                if (client) {
                    this.balanceDataLoaded = true;
                }
            },
        },
    },
    methods: {
        selectBalance(balance) {
            this.selectedBalanceIdFromBase = balance.id;
            this.$refs.balanceHistoryBase?.setSelectedBalanceId?.(balance.id);
        },
        refreshBalanceHistory() {
            this.$refs.balanceHistoryBase?.fetchBalanceHistory?.();
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
            this.refreshBalanceHistory();
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
            this.refreshBalanceHistory();
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
                const defaultCurrency = currencies?.find(c => c.isDefault);
                this._defaultCurrencySymbol = defaultCurrency ? defaultCurrency.symbol : '';
            } catch {
                this._defaultCurrencySymbol = '';
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
            this.refreshBalanceHistory();
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
