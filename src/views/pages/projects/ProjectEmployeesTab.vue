<template>
    <div class="mt-4">
        <transition name="fade" mode="out-in">
            <div v-if="!salaryTransactionsLoading" key="content">
                <DraggableTable v-if="editingItem" table-key="project.employees.salary"
                    :columns-config="salaryTransactionsColumnsConfig" :table-data="salaryTransactions || []"
                    :item-mapper="salaryTransactionMapper" :onItemClick="handleSalaryTransactionClick">
                    <template #tableSettingsAdditional>
                        <PrimaryButton v-if="!hideActions" icon="fas fa-gift" :onclick="handleBonus" :is-success="true"
                            :disabled="!editingItem || !editingItem.id">
                            {{ $t('bonus') }}
                        </PrimaryButton>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="bonusModalOpen" :onclose="closeBonusModal">
            <div v-if="bonusModalOpen && editingItem && editingItem.id" class="flex flex-col overflow-auto h-full p-4">
                <h2 class="text-lg font-bold mb-4">{{ $t('bonus') }}</h2>
                <EmployeeBonusSearch v-model="selectedEmployees" :cashId="bonusCashId"
                    @update:cashId="bonusCashId = $event" :currencyId="bonusCurrencyId"
                    @update:currencyId="bonusCurrencyId = $event" :disabled="bonusSaving"
                    :employee-balances-map="employeeBalancesMap" />
            </div>
            <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
                <PrimaryButton icon="fas fa-save" :onclick="saveBonuses" :is-loading="bonusSaving"
                    :disabled="bonusSaving || !selectedEmployees.length || !hasValidAmounts || !bonusCashId || !bonusCurrencyId"
                    :aria-label="$t('save')">
                </PrimaryButton>
            </div>
        </SideModalDialog>

        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
            </template>
            <template v-else>
                <TransactionCreatePage v-if="selectedEntity && selectedEntity.type === 'transaction'"
                    :editingItem="editingTransactionItem" :initial-project-id="editingItem?.id" @saved="onEntitySaved"
                    @saved-error="onEntitySavedError" @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>

    </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import EmployeeBonusSearch from "@/views/components/app/search/EmployeeBonusSearch.vue";
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { markRaw } from 'vue';
import dayjs from 'dayjs';
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import TransactionTypeCell from "@/views/components/app/buttons/TransactionTypeCell.vue";
import TransactionAmountCell from "@/views/components/app/buttons/TransactionAmountCell.vue";
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';

export default {
    name: 'ProjectEmployeesTab',
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        PrimaryButton,
        SideModalDialog,
        TableSkeleton,
        DraggableTable,
        SourceButtonCell,
        TransactionCreatePage,
        ClientButtonCell,
        TransactionTypeCell,
        TransactionAmountCell,
        EmployeeBonusSearch,
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
            bonusModalOpen: false,
            selectedEmployees: [],
            employeeBalancesMap: {},
            bonusCashId: '',
            bonusCurrencyId: '',
            bonusSaving: false,
            entityModalOpen: false,
            entityLoading: false,
            editingTransactionItem: null,
            selectedEntity: null,
            salaryTransactions: [],
            salaryTransactionsLoading: false,
            lastFetchedProjectId: null,
            forceRefresh: false,
            SALARY_CATEGORY_IDS: [7, 23, 24, 26, 27],
        };
    },
    computed: {
        hasValidAmounts() {
            return this.selectedEmployees.every(emp => emp.amount && emp.amount > 0);
        },
        salaryTransactionsColumnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'dateUser', label: this.$t('dateUser'), size: 120 },
                {
                    name: 'type',
                    label: this.$t('type'),
                    size: 80,
                    component: markRaw(TransactionTypeCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
                {
                    name: 'source',
                    label: this.$t('source'),
                    size: 120,
                    component: markRaw(SourceButtonCell),
                    props: (item) => ({
                        sourceType: item.sourceType,
                        sourceId: item.sourceId,
                        onUpdated: () => {
                            this.fetchSalaryTransactions();
                        },
                        onDeleted: () => {
                            this.fetchSalaryTransactions();
                        }
                    })
                },
                {
                    name: 'client',
                    label: this.$t('customer'),
                    size: 150,
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client
                    })
                },
                { name: 'categoryName', label: this.$t('category'), size: 150 },
                { name: 'note', label: this.$t('note'), size: 200 },
                {
                    name: 'cashAmount',
                    label: this.$t('amount'),
                    size: 130,
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
            ];
        }
    },
    async mounted() {
        await this.$store.dispatch('loadClients');
        if (this.editingItem && this.editingItem.id) {
            await this.fetchSalaryTransactions();
        }
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchSalaryTransactions();
                } else {
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.salaryTransactions = [];
                    this.lastFetchedProjectId = null;
                }
            },
            immediate: true,
        },
    },
    methods: {
        closeEntityModal() {
            this.entityModalOpen = false;
            this.entityLoading = false;
            this.editingTransactionItem = null;
            this.selectedEntity = null;
        },
        async onEntitySaved() {
            this.closeEntityModal();
            this.forceRefresh = true;
            await Promise.all([
                this.fetchSalaryTransactions(),
                this.$store.dispatch('invalidateCache', { type: 'clients' }),
                this.$store.dispatch('loadClients')
            ]);
        },
        onEntitySavedError(error) {
            let errorMessage = typeof error === 'string' ? error : this.getApiErrorMessage(error);
            if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage.join(', ');
            }
            this.showNotification(this.$t('error'), errorMessage, true);
        },
        async onEntityDeleted() {
            this.closeEntityModal();
            this.forceRefresh = true;
            await Promise.all([
                this.fetchSalaryTransactions(),
                this.$store.dispatch('invalidateCache', { type: 'clients' }),
                this.$store.dispatch('loadClients')
            ]);
        },
        onEntityDeletedError(error) {
            this.onEntitySavedError(error);
        },
        async fetchSalaryTransactions() {
            if (!this.editingItem || !this.editingItem.id) {
                this.salaryTransactions = [];
                return;
            }
            if (this.lastFetchedProjectId === this.editingItem.id && !this.forceRefresh) {
                return;
            }

            this.salaryTransactionsLoading = true;
            try {
                const response = await TransactionController.getItems(
                    1,
                    null,
                    'all_time',
                    null,
                    null,
                    null,
                    null,
                    this.editingItem.id,
                    100,
                    null,
                    null,
                    null,
                    this.SALARY_CATEGORY_IDS
                );

                this.salaryTransactions = response.items || [];
                this.lastFetchedProjectId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (error) {
                console.error('Error fetching salary transactions:', error);
                this.salaryTransactions = [];
            } finally {
                this.salaryTransactionsLoading = false;
            }
        },
        salaryTransactionMapper(item, column) {
            switch (column) {
                case "id":
                    return item.id;
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : (item.formatDate ? item.formatDate() : '');
                case "categoryName":
                    return translateTransactionCategory(item.categoryName, this.$t);
                case "note":
                    return item.note;
                case "cashAmount":
                    return parseFloat(item.cashAmount || item.origAmount || 0);
                default:
                    return item[column];
            }
        },
        async handleSalaryTransactionClick(item) {
            if (!item?.id) return;

            try {
                this.entityLoading = true;
                const data = await TransactionController.getItem(item.id);
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
        async handleBonus() {
            if (!this.editingItem?.id) return;
            this.selectedEmployees = [];
            this.bonusCashId = '';
            this.bonusCurrencyId = '';
            await Promise.all([
                this.$store.dispatch('loadCashRegisters'),
                this.$store.dispatch('loadCurrencies'),
                this.$store.dispatch('loadClients'),
                this.$store.dispatch('loadUsers')
            ]);

            const defaultCashId = this.$store.getters.defaultCashId;
            const currencies = this.$store.getters.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            if (defaultCashId) this.bonusCashId = defaultCashId;
            if (defaultCurrency) this.bonusCurrencyId = defaultCurrency.id;

            try {
                const response = await TransactionController.getItems(
                    1,
                    null,
                    'all_time',
                    null,
                    null,
                    null,
                    null,
                    this.editingItem.id,
                    100,
                    null,
                    null,
                    null,
                    [26]
                );

                const existingBonuses = response.items || [];
                const clients = this.$store.getters.clients || [];
                const allUsers = this.$store.getters.usersForCurrentCompany || [];

                const employeesMap = new Map();

                for (const transaction of existingBonuses) {
                    if (!transaction.clientId) continue;

                    const client = clients.find(c => Number(c.id) === Number(transaction.clientId));
                    if (!client || !client.employeeId) continue;

                    const userId = Number(client.employeeId);
                    let user = allUsers.find(u => Number(u.id) === userId);
                    if (!user) {
                        try {
                            const UsersController = (await import('@/api/UsersController')).default;
                            user = await UsersController.getItem(userId);
                        } catch (error) {
                            console.error(`Error loading user ${userId}:`, error);
                            continue;
                        }
                    }

                    if (!employeesMap.has(userId)) {
                        employeesMap.set(userId, {
                            id: user.id,
                            name: user.name,
                            surname: user.surname,
                            position: user.position,
                            photo: user.photo,
                            amount: parseFloat(transaction.origAmount || transaction.amount || 0),
                            transactionId: transaction.id,
                        });
                    }
                }

                this.selectedEmployees = Array.from(employeesMap.values());

                if (existingBonuses.length > 0) {
                    const firstTransaction = existingBonuses[0];
                    if (firstTransaction.cashId) this.bonusCashId = firstTransaction.cashId;
                    if (firstTransaction.origCurrencyId) this.bonusCurrencyId = firstTransaction.origCurrencyId;
                }
            } catch (error) {
                console.error('Ошибка при загрузке существующих премий:', error);
            }

            this.bonusModalOpen = true;
        },
        closeBonusModal() {
            this.bonusModalOpen = false;
            this.selectedEmployees = [];
            this.employeeBalancesMap = {};
            this.bonusCashId = '';
            this.bonusCurrencyId = '';
        },
        async findEmployeeClient(userId) {
            await this.$store.dispatch('loadClients');
            const clients = this.$store.getters.clients || [];
            return clients.find(c => {
                const clientEmployeeId = c.employeeId ? Number(c.employeeId) : null;
                return clientEmployeeId === Number(userId);
            });
        },
        async saveBonuses() {
            if (!this.hasValidAmounts || !this.editingItem?.id || !this.bonusCashId || !this.bonusCurrencyId) {
                return;
            }

            this.bonusSaving = true;
            const errors = [];

            try {
                for (const employee of this.selectedEmployees) {
                    if (!employee.amount || employee.amount <= 0) continue;

                    const employeeClient = await this.findEmployeeClient(employee.id);
                    if (!employeeClient) {
                        errors.push(`${this.getUserFullName(employee)}: client not found`);
                        continue;
                    }

                    const payload = {
                        type: 0,
                        cash_id: this.bonusCashId,
                        orig_amount: parseFloat(employee.amount),
                        currency_id: this.bonusCurrencyId,
                        category_id: 26,
                        project_id: this.editingItem.id,
                        client_id: employeeClient.id,
                        note: `Премия для ${this.getUserFullName(employee)}`,
                        date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                        is_debt: true,
                    };
                    if (employee.selectedBalanceId) {
                        payload.client_balance_id = employee.selectedBalanceId;
                    }
                    try {
                        if (employee.transactionId) {
                            await TransactionController.updateItem(employee.transactionId, payload);
                        } else {
                            await TransactionController.storeItem(payload);
                        }
                    } catch (error) {
                        const errorMsg = typeof error === 'string' ? error : this.getApiErrorMessage(error);
                        errors.push(`${this.getUserFullName(employee)}: ${errorMsg}`);
                    }
                }

                if (errors.length === 0) {
                    this.showNotification(
                        this.$t('success'),
                        `Премии начислены для ${this.selectedEmployees.length} сотрудников`,
                        false
                    );
                    this.closeBonusModal();
                    await Promise.all([
                        this.fetchSalaryTransactions(),
                        this.$store.dispatch('invalidateCache', { type: 'clients' }),
                        this.$store.dispatch('loadClients')
                    ]);
                } else {
                    this.showNotification(
                        this.$t('error'),
                        `Ошибки при сохранении: ${errors.join('; ')}`,
                        true
                    );
                }
            } catch (error) {
                this.showNotification(
                    this.$t('error'),
                    typeof error === 'string' ? error : (error.message || this.$t('errorSavingTransaction')),
                    true
                );
            } finally {
                this.bonusSaving = false;
            }
        },
        getUserFullName(employee) {
            if (!employee) return '';
            if (typeof employee.fullName === 'function') {
                return employee.fullName();
            }
            const name = employee.name;
            const surname = employee.surname;
            const position = employee.position;
            const fullName = [name, surname].filter(Boolean).join(' ').trim();
            return position ? `${fullName} (${position})` : fullName;
        }
    },
    watch: {
        async selectedEmployees(employees) {
            if (!this.bonusModalOpen || !Array.isArray(employees) || !employees.length) {
                if (!this.bonusModalOpen) this.employeeBalancesMap = {};
                return;
            }
            const map = {};
            for (const emp of employees) {
                const client = await this.findEmployeeClient(emp.id);
                if (client?.id) {
                    try {
                        const balances = await ClientController.getClientBalances(client.id);
                        map[emp.id] = balances || [];
                    } catch (e) {
                        map[emp.id] = [];
                    }
                }
            }
            this.employeeBalancesMap = map;
            const withDefaults = employees.map(emp => {
                if (emp.selectedBalanceId) return emp;
                const balances = map[emp.id] || [];
                const defaultBalance = balances.find(b => b.isDefault);
                const balanceId = defaultBalance ? defaultBalance.id : balances[0]?.id;
                return balanceId ? { ...emp, selectedBalanceId: balanceId } : emp;
            });
            if (withDefaults.some((e, i) => e.selectedBalanceId !== employees[i].selectedBalanceId)) {
                this.selectedEmployees = withDefaults;
            }
        }
    }
};
</script>
