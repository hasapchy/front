<template>
  <div>
    <div class="mb-8">
      <div
        v-if="reportLoading && !reportRows.length"
        class="min-h-40"
      >
        <TableSkeleton />
      </div>
      <DraggableTable
        v-else
        class="px-0 pb-4"
        table-key="salaries.report.batches"
        :columns-config="reportColumns"
        :table-data="reportRows"
        :item-mapper="reportItemMapper"
        :on-item-click="onReportRowActivate"
        :disable-local-sort="false"
      >
        <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
          <TableControlsBar
            :show-pagination="false"
            :reset-columns="resetColumns"
            :columns="columns"
            :toggle-visible="toggleVisible"
            :log="log"
          >
            <template #left>
              <PrimaryButton
                :onclick="() => openSalaryModal('salaryAccrual')"
                icon="fas fa-money-bill-wave"
                :is-loading="usersLoading"
                :is-success="true"
                :disabled="!currentCompanyId || usersLoading || !userRows.length"
                :aria-label="$t('accrueSalary')"
              >
                {{ $t('accrueSalary') }}
              </PrimaryButton>
              <PrimaryButton
                :onclick="() => openSalaryModal('salaryPayment')"
                icon="fas fa-hand-holding-usd"
                :is-loading="usersLoading"
                :is-success="true"
                :disabled="!currentCompanyId || usersLoading || !userRows.length"
                :aria-label="$t('paySalary')"
              >
                {{ $t('paySalary') }}
              </PrimaryButton>
            </template>
            <template #gear="{ resetColumns: rc, columns: cols, toggleVisible: tv, log: lg }">
              <TableFilterButton
                v-if="cols?.length"
                :on-reset="rc"
              >
                <ul>
                  <draggable
                    v-if="cols.length"
                    class="dragArea list-group w-full"
                    :list="cols"
                    @change="lg"
                  >
                    <li
                      v-for="(element, index) in cols"
                      v-show="element.name !== 'select'"
                      :key="element.name"
                      class="flex items-center hover:bg-gray-100 p-2 rounded"
                      @click="tv(index)"
                    >
                      <div class="space-x-2 flex flex-row justify-between w-full select-none">
                        <div>
                          <i
                            class="text-sm mr-2 text-[#337AB7]"
                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                          />
                          {{ $te(element.label) ? $t(element.label) : element.label }}
                        </div>
                        <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" /></div>
                      </div>
                    </li>
                  </draggable>
                </ul>
              </TableFilterButton>
            </template>
          </TableControlsBar>
        </template>
      </DraggableTable>
    </div>

    <SideModalDialog
      :show-form="salaryModalOpen"
      :onclose="closeSalaryModal"
    >
      <SalaryAccrualModal
        v-if="salaryModalOpen"
        for-all-active-employees
        :user-ids="modalUserIds"
        :users="modalUsers"
        :operation-type="salaryOperationType"
        @success="onSalaryModalSuccess"
        @cancel="closeSalaryModal"
      />
    </SideModalDialog>

    <SideModalDialog
      :show-form="batchModalOpen"
      :onclose="closeBatchModal"
      :level="1"
    >
      <div
        v-if="batchModalOpen"
        class="h-full flex flex-col max-w-4xl"
      >
        <div
          v-if="batchDetailLoading"
          class="flex-1 overflow-auto p-4 min-h-32"
        >
          <TableSkeleton />
        </div>
        <template v-else-if="batchDetail">
          <div class="flex-1 min-h-0 overflow-auto p-4">
            <h2 class="text-lg font-bold text-gray-900 mb-4">
              {{ batchTypeLabel(batchDetail.type) }}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div
                v-for="row in batchSummaryRows"
                :key="row.key"
                :class="row.wide ? 'sm:col-span-2' : ''"
              >
                <span class="block text-sm font-medium text-gray-700 mb-1">{{ $t(row.labelKey) }}</span>
                <div class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">
                  {{ row.value }}
                </div>
              </div>
            </div>
            <div class="text-sm font-medium text-gray-700 mb-2">
              {{ $t('employees') }}
            </div>
            <DraggableTable
              class="pb-2"
              table-key="salaries.report.batch.lines"
              :columns-config="batchLineColumns"
              :table-data="batchDetailLineRows"
              :item-mapper="batchLineItemMapper"
              :disable-local-sort="false"
            />
          </div>
          <div
            v-if="canDeleteSalaryBatch"
            class="shrink-0 p-4 bg-[#edf4fb] border-t border-gray-200"
          >
            <PrimaryButton
              icon="fas fa-trash"
              :is-danger="true"
              :is-loading="batchDeleting"
              :onclick="() => { batchDeleteDialog = true; }"
            >
              {{ $t('delete') }}
            </PrimaryButton>
          </div>
        </template>
      </div>
    </SideModalDialog>

    <SideModalDialog
      :show-form="transactionEditOpen"
      :onclose="closeTransactionEdit"
      :level="2"
    >
      <div
        v-if="transactionEditOpen"
        class="h-full flex flex-col min-h-0"
      >
        <div
          v-if="transactionModalLoading"
          class="flex-1 p-4 min-h-64"
        >
          <TableSkeleton />
        </div>
        <TransactionCreatePage
          v-else-if="editingTransactionDto"
          class="flex-1 min-h-0"
          :editing-item="editingTransactionDto"
          :form-config="transactionFormPresetFull"
          @saved="onTransactionSaved"
          @saved-error="onTransactionError"
          @deleted="onTransactionDeleted"
          @deleted-error="onTransactionError"
          @close-request="closeTransactionEdit"
        />
      </div>
    </SideModalDialog>

    <AlertDialog
      :dialog="batchDeleteDialog"
      :descr="$t('salaryBatchDeleteConfirm')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteBatch"
      @leave="batchDeleteDialog = false"
    />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import dayjs from 'dayjs';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SalaryAccrualModal from '@/views/components/app/SalaryAccrualModal.vue';
import SalaryBatchLineOpenTxCell from '@/views/components/app/salaries/SalaryBatchLineOpenTxCell.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import CompaniesController from '@/api/CompaniesController';
import UsersController from '@/api/UsersController';
import TransactionController from '@/api/TransactionController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import { getCurrentServerDateObject, toDayjsLocale } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';

export default {
    components: {
        PrimaryButton,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        SideModalDialog,
        AlertDialog,
        SalaryAccrualModal,
        TransactionCreatePage,
        draggable: VueDraggableNext,
    },
    mixins: [notificationMixin, getApiErrorMessage],
    data() {
        const d = getCurrentServerDateObject();
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        return {
            currentReportMonth: `${y}-${m}`,
            reportLoading: false,
            reportRows: [],
            usersLoading: false,
            userRows: [],
            salaryModalOpen: false,
            salaryOperationType: 'salaryAccrual',
            modalUserIds: [],
            modalUsers: [],
            batchModalOpen: false,
            batchDetailLoading: false,
            batchDetail: null,
            batchDeleteDialog: false,
            batchDeleting: false,
            transactionEditOpen: false,
            transactionModalLoading: false,
            editingTransactionDto: null,
            reportColumns: [
                { name: 'date', label: 'salaryReportColumnDate' },
                { name: 'type', label: 'salaryReportColumnType' },
                { name: 'line_count', label: 'salaryReportColumnLines' },
                { name: 'totals_display', label: 'salaryReportColumnTotals' },
            ],
            transactionFormPresetFull: TRANSACTION_FORM_PRESETS.full,
        };
    },
    computed: {
        currentCompanyId() {
            return this.$store.getters.currentCompanyId;
        },
        batchSummaryRows() {
            const b = this.batchDetail;
            if (!b) {
                return [];
            }
            return [
                { key: 'date', labelKey: 'salaryReportColumnDate', value: this.formatBatchDate(b.date) },
                { key: 'type', labelKey: 'salaryReportColumnType', value: this.batchTypeLabel(b.type) },
                { key: 'totals', labelKey: 'salaryReportColumnTotals', value: b.totals_display || '—', wide: true },
            ];
        },
        batchLineColumns() {
            return [
                { name: 'employee_name', label: 'employee' },
                { name: 'amount', label: 'amount' },
                {
                    name: 'open_tx',
                    label: 'salaryPreviewOpenTx',
                    component: markRaw(SalaryBatchLineOpenTxCell),
                    props: (item) => ({
                        transactionId: item.transaction_id,
                        onOpen: this.openBatchLineTransaction,
                    }),
                },
            ];
        },
        canDeleteSalaryBatch() {
            const g = this.$store.getters;
            return g.hasPermission('employee_salaries_accrue')
                && (g.hasPermission('transactions_delete') || g.hasPermission('transactions_delete_all'));
        },
        batchDetailLineRows() {
            return (this.batchDetail?.lines || []).map((l) => ({
                id: l.id,
                employee_name: l.employee_name,
                amount: l.amount,
                currency_symbol: l.currency_symbol || '',
                transaction_id: l.transaction_id ?? null,
            }));
        },
    },
    watch: {
        currentCompanyId(val) {
            if (val) {
                this.loadReport();
                this.fetchUsers();
            }
        },
    },
    mounted() {
        this.loadReport();
        this.fetchUsers();
    },
    methods: {
        formatCurrency,
        apiErrorText(error) {
            const msg = this.getApiErrorMessage(error);
            return Array.isArray(msg) ? msg.join('\n') : msg;
        },
        formatBatchDate(value) {
            if (!value) {
                return '—';
            }
            return dayjs(value).locale(toDayjsLocale(this.$i18n?.locale)).format('DD.MM.YYYY');
        },
        batchTypeLabel(type) {
            if (type === 'accrual') {
                return this.$t('accrueSalary');
            }
            if (type === 'payment') {
                return this.$t('paySalary');
            }
            return type || '—';
        },
        userHasActiveSalaryForForm(user) {
            const s = user?.lastSalary;
            if (!s) {
                return false;
            }
            const end = s.end_date ?? s.endDate;
            return !end;
        },
        reportItemMapper(item, column) {
            const byCol = {
                date: () => this.formatBatchDate(item.date),
                type: () => this.batchTypeLabel(item.type),
                line_count: () => item.line_count ?? '—',
                totals_display: () => item.totals_display || '—',
            };
            return byCol[column]?.() ?? item[column];
        },
        batchLineItemMapper(item, column) {
            if (column === 'amount') {
                return this.formatCurrency(item.amount, item.currency_symbol || '');
            }
            if (column === 'employee_name') {
                return item.employee_name || '—';
            }
            return item[column];
        },
        async loadReport() {
            const companyId = this.currentCompanyId;
            if (!companyId || !this.currentReportMonth) {
                this.reportRows = [];
                return;
            }
            this.reportLoading = true;
            try {
                const data = await CompaniesController.getSalaryMonthlyReport(companyId, this.currentReportMonth);
                const items = data?.items || [];
                this.reportRows = items.map((r) => ({
                    id: r.id,
                    date: r.date,
                    type: r.type,
                    line_count: r.line_count,
                    totals_display: r.totals_display,
                }));
            } catch (error) {
                this.reportRows = [];
                this.showNotification(this.$t('error'), this.apiErrorText(error), true);
            } finally {
                this.reportLoading = false;
            }
        },
        onReportRowActivate(row) {
            if (row?.id != null) {
                this.openBatchModal(row.id);
            }
        },
        async openBatchModal(batchId) {
            if (!this.currentCompanyId) {
                return;
            }
            this.batchModalOpen = true;
            this.batchDetailLoading = true;
            this.batchDetail = null;
            try {
                this.batchDetail = await CompaniesController.getSalaryMonthlyReportBatch(
                    this.currentCompanyId,
                    batchId
                );
            } catch (error) {
                this.showNotification(this.$t('error'), this.apiErrorText(error), true);
                this.batchModalOpen = false;
            } finally {
                this.batchDetailLoading = false;
            }
        },
        closeBatchModal() {
            this.closeTransactionEdit();
            this.batchModalOpen = false;
            this.batchDetail = null;
            this.batchDeleteDialog = false;
        },
        async openBatchLineTransaction(transactionId) {
            this.transactionEditOpen = true;
            this.transactionModalLoading = true;
            this.editingTransactionDto = null;
            try {
                this.editingTransactionDto = await TransactionController.getItem(transactionId);
            } catch (error) {
                this.closeTransactionEdit();
                this.showNotification(this.$t('error'), this.apiErrorText(error), true);
            } finally {
                this.transactionModalLoading = false;
            }
        },
        closeTransactionEdit() {
            this.transactionEditOpen = false;
            this.transactionModalLoading = false;
            this.editingTransactionDto = null;
        },
        async refreshBatchDetailOrClose() {
            const id = this.batchDetail?.id;
            if (!this.currentCompanyId || !id) {
                return;
            }
            try {
                this.batchDetail = await CompaniesController.getSalaryMonthlyReportBatch(this.currentCompanyId, id);
            } catch {
                this.closeBatchModal();
            }
        },
        async onTransactionSaved() {
            await this.refreshBatchDetailOrClose();
            this.closeTransactionEdit();
            this.showNotification(this.$t('success'), this.$t('transactionSaved'), false);
            await this.loadReport();
        },
        async onTransactionDeleted() {
            this.closeTransactionEdit();
            await this.refreshBatchDetailOrClose();
            await this.loadReport();
            this.showNotification(this.$t('success'), this.$t('transactionSuccessfullyDeleted'), false);
        },
        onTransactionError(error) {
            this.showNotification(this.$t('error'), this.apiErrorText(error), true);
        },
        async confirmDeleteBatch() {
            this.batchDeleteDialog = false;
            const batchId = this.batchDetail?.id;
            if (!this.currentCompanyId || !batchId) {
                return;
            }
            this.batchDeleting = true;
            try {
                await CompaniesController.deleteSalaryMonthlyReportBatch(this.currentCompanyId, batchId);
                this.showNotification(this.$t('success'), this.$t('salaryBatchDeleteSuccess'), false);
                this.closeBatchModal();
                await this.loadReport();
            } catch (error) {
                this.showNotification(this.$t('error'), this.apiErrorText(error), true);
            } finally {
                this.batchDeleting = false;
            }
        },
        async fetchUsers() {
            if (!this.currentCompanyId) {
                this.userRows = [];
                return;
            }
            this.usersLoading = true;
            try {
                const merged = [];
                let page = 1;
                let lastPage = 1;
                do {
                    const res = await UsersController.getItems(page, 200, { activeOnly: true });
                    merged.push(...res.items);
                    lastPage = res.lastPage;
                    page += 1;
                } while (page <= lastPage);
                this.userRows = merged.filter((u) => this.userHasActiveSalaryForForm(u));
            } catch (error) {
                this.userRows = [];
                this.showNotification(this.$t('error'), this.apiErrorText(error), true);
            } finally {
                this.usersLoading = false;
            }
        },
        openSalaryModal(type) {
            if (!this.currentCompanyId) {
                this.showNotification(this.$t('error'), this.$t('selectOneCompany'), true);
                return;
            }
            if (!this.userRows.length) {
                this.showNotification(this.$t('error'), this.$t('salaryFormNoUsersWithActiveSalary'), true);
                return;
            }
            this.modalUserIds = this.userRows.map((u) => u.id);
            this.modalUsers = [...this.userRows];
            this.salaryOperationType = type;
            this.salaryModalOpen = true;
        },
        closeSalaryModal() {
            this.salaryModalOpen = false;
            this.salaryOperationType = 'salaryAccrual';
            this.modalUserIds = [];
            this.modalUsers = [];
        },
        async onSalaryModalSuccess() {
            this.closeSalaryModal();
            await this.loadReport();
            await this.fetchUsers();
        },
    },
};
</script>
