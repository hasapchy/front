<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="!salaryTransactionsLoading"
        key="content"
      >
        <DraggableTable
          v-if="editingItem"
          table-key="project.employees.salary"
          :columns-config="salaryTransactionsColumnsConfig"
          :table-data="salaryTransactions || []"
          :item-mapper="salaryTransactionMapper"
          :on-item-click="handleSalaryTransactionClick"
        >
          <template #tableSettingsAdditional>
            <PrimaryButton
              v-if="!hideActions"
              icon="fas fa-gift"
              :onclick="handleBonus"
              :is-success="true"
              :disabled="!editingItem || !editingItem.id"
            >
              {{ $t('bonus') }}
            </PrimaryButton>
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog
      :show-form="entityModalOpen"
      :title="projectEmployeesEntityModalTitle"
      :onclose="closeEntityModal"
      :level="2"
    >
      <template v-if="entityLoading">
        <div class="min-h-64">
          <TableSkeleton />
        </div>
      </template>
      <template v-else>
        <TransactionCreatePage
          v-if="selectedEntity && selectedEntity.type === 'transaction'"
          :editing-item="editingTransactionItem"
          :initial-project-id="editingItem?.id"
          :form-config="transactionFormConfig"
          @saved="onEntitySaved"
          @saved-error="onEntitySavedError"
          @deleted="onEntityDeleted"
          @deleted-error="onEntityDeletedError"
        />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog, { transactionSideModalTitle, sideModalFooterPortal } from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import TransactionController from "@/api/TransactionController";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { markRaw } from 'vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import TransactionTypeCell from "@/views/components/app/buttons/TransactionTypeCell.vue";
import TransactionAmountCell from "@/views/components/app/buttons/TransactionAmountCell.vue";
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';

const SALARY_CATEGORY_FORM_PRESETS = {
    7: 'employeeSalaryPayment',
    23: 'employeeAdvance',
    24: 'employeeSalaryAccrual',
    26: 'projectEmployeeBonus',
    27: 'employeePenalty',
};

export default {
    name: 'ProjectEmployeesTab',
    components: {
        PrimaryButton,
        SideModalDialog,
        TableSkeleton,
        DraggableTable,
        TransactionCreatePage,
    },
    mixins: [notificationMixin, getApiErrorMessage, sideModalFooterPortal],
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
            transactionFormMode: null,
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
        projectEmployeesEntityModalTitle() {
            if (!this.entityModalOpen) {
                return '';
            }
            if (this.entityLoading) {
                return this.$t('loading');
            }
            if (this.transactionFormMode === 'bonus' && !this.editingTransactionItem) {
                return this.$t('bonus');
            }
            return transactionSideModalTitle(this.$t.bind(this), {
                headerText: '',
                editingItem: this.editingTransactionItem,
            });
        },
        salaryTransactionsColumnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    size: 120,
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, '', column?.dateDisplayMode),
                },
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
        },
        transactionFormConfig() {
            if (this.transactionFormMode === 'bonus' && !this.editingTransactionItem) {
                return TRANSACTION_FORM_PRESETS.projectEmployeeBonus;
            }
            return this.transactionEditFormConfig;
        },
        transactionEditFormConfig() {
            const categoryId = Number(this.editingTransactionItem?.categoryId);
            const presetKey = SALARY_CATEGORY_FORM_PRESETS[categoryId];
            if (presetKey) {
                return TRANSACTION_FORM_PRESETS[presetKey];
            }
            return TRANSACTION_FORM_PRESETS.full;
        },
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
    async mounted() {
        await this.$store.dispatch('loadClients');
        if (this.editingItem && this.editingItem.id) {
            await this.fetchSalaryTransactions();
        }
    },
    methods: {
        closeEntityModal() {
            this.entityModalOpen = false;
            this.entityLoading = false;
            this.editingTransactionItem = null;
            this.selectedEntity = null;
            this.transactionFormMode = null;
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
            let errorMessage = this.getApiErrorMessage(error);
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
                this.transactionFormMode = null;
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
        handleBonus() {
            if (!this.editingItem?.id) return;
            this.transactionFormMode = 'bonus';
            this.editingTransactionItem = null;
            this.selectedEntity = { type: 'transaction' };
            this.entityModalOpen = true;
            this.entityLoading = false;
        },
    }
};
</script>
