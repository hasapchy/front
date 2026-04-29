<template>
  <div>
    <div class="mb-8">
      <div v-if="reportLoading && !reportRows.length" class="min-h-40">
        <TableSkeleton />
      </div>
      <CardListViewShell v-else-if="!reportLoading && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey" cards-root-class="px-0 pb-4" :display-view-mode="displayViewMode"
        :cards-toolbar="salaryReportCardsToolbar">
        <template #table>
          <DraggableTable table-key="salaries.report.batches" :columns-config="reportColumns" :table-data="reportRows"
            :item-mapper="reportItemMapper" :on-item-click="onReportRowActivate">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar :show-pagination="false" :reset-columns="resetColumns" :columns="columns"
                :toggle-visible="toggleVisible" :log="log">
                <template #left>
                  <PrimaryButton :onclick="() => openSalaryModal('salaryAccrual')" icon="fas fa-money-bill-wave"
                    :is-loading="usersLoading" :is-success="true"
                    :disabled="!currentCompanyId || usersLoading || !userRows.length" :aria-label="$t('accrueSalary')">
                    {{ $t('accrueSalary') }}
                  </PrimaryButton>
                  <PrimaryButton :onclick="() => openSalaryModal('salaryPayment')" icon="fas fa-hand-holding-usd"
                    :is-loading="usersLoading" :is-success="true"
                    :disabled="!currentCompanyId || usersLoading || !userRows.length" :aria-label="$t('paySalary')">
                    {{ $t('paySalary') }}
                  </PrimaryButton>
                  <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
                    @change="changeViewMode" />
                </template>
                <template #gear="{ resetColumns: rc, columns: cols, toggleVisible: tv, log: lg }">
                  <TableFilterButton v-if="cols?.length" :on-reset="rc">
                    <ul>
                      <draggable v-if="cols.length" class="dragArea list-group w-full" :list="cols" @change="lg">
                        <li v-for="(element, index) in cols" v-show="element.name !== 'select'" :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded" @click="tv(index)">
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                              <i class="text-sm mr-2 text-[#337AB7]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']" />
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
        </template>
        <template #card-bar-left>
          <PrimaryButton :onclick="() => openSalaryModal('salaryAccrual')" icon="fas fa-money-bill-wave"
            :is-loading="usersLoading" :is-success="true"
            :disabled="!currentCompanyId || usersLoading || !userRows.length" :aria-label="$t('accrueSalary')">
            {{ $t('accrueSalary') }}
          </PrimaryButton>
          <PrimaryButton :onclick="() => openSalaryModal('salaryPayment')" icon="fas fa-hand-holding-usd"
            :is-loading="usersLoading" :is-success="true"
            :disabled="!currentCompanyId || usersLoading || !userRows.length" :aria-label="$t('paySalary')">
            {{ $t('paySalary') }}
          </PrimaryButton>
          <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
            @change="changeViewMode" />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
        </template>
        <template #cards>
          <MapperCardGrid class="mt-4" :items="reportRows" :card-config="cardConfigMerged"
            :card-mapper="salaryReportCardMapper" title-field="title" :title-prefix="salaryReportCardTitlePrefix"
            :show-checkbox="false" @dblclick="onReportRowActivate" />
        </template>
      </CardListViewShell>
      <div v-if="reportRows.length" class="text-right text-sm font-semibold text-gray-800 pr-2">
        {{ $t('total') }}: {{ reportTotalsDisplay }}
      </div>
    </div>

    <SideModalDialog :show-form="salaryModalOpen" :title="salaryAccrualBarTitle" :onclose="closeSalaryModal">
      <SalaryAccrualModal v-if="salaryModalOpen" for-all-active-employees :user-ids="modalUserIds"
        :operation-type="salaryOperationType" @dialog-title="salaryAccrualHeaderLive = $event"
        @success="onSalaryModalSuccess" @cancel="closeSalaryModal" />
    </SideModalDialog>

    <SideModalDialog :show-form="batchModalOpen" :title="batchSideModalTitle" :onclose="closeBatchModal" :level="2">
      <div v-if="batchModalOpen" class="flex h-full min-h-0 w-full flex-col">
        <div v-if="batchDetailLoading" class="min-h-0 flex-1 overflow-auto p-4">
          <TableSkeleton />
        </div>
        <template v-else-if="batchDetail">
          <div class="min-h-0 flex-1 overflow-auto p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div v-for="row in batchSummaryRows" :key="row.key" :class="row.wide ? 'sm:col-span-2' : ''">
                <span class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  {{ $t(row.labelKey) }}
                </span>
                <div class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900">
                  {{ row.value }}
                </div>
              </div>
            </div>
            <div class="text-sm font-medium text-gray-700 mb-2">
              {{ $t('employees') }}
            </div>
            <DraggableTable class="pb-2" :table-key="batchLinesTableKey" :columns-config="batchLineColumns"
              :table-data="batchDetailLineRows" :item-mapper="batchLineItemMapper" />
            <div class="text-right text-sm font-semibold text-gray-800 pr-2">
              {{ $t('total') }}: {{ batchLinesTotalsDisplay }}
            </div>
          </div>
          <teleport v-bind="sideModalFooterTeleportBind">
            <div v-if="canDeleteSalaryBatch" class="flex w-full flex-wrap items-center gap-2">
              <PrimaryButton icon="fas fa-trash" :is-danger="true" :is-loading="batchDeleting"
                :onclick="() => { batchDeleteDialog = true; }">
                {{ $t('delete') }}
              </PrimaryButton>
            </div>
          </teleport>
        </template>
      </div>
    </SideModalDialog>

    <SideModalDialog :show-form="transactionEditOpen" :title="transactionEditBarTitle" :onclose="closeTransactionEdit"
      :level="3">
      <div v-if="transactionEditOpen" class="h-full flex flex-col min-h-0">
        <div v-if="transactionModalLoading" class="flex-1 p-4 min-h-64">
          <TableSkeleton />
        </div>
        <TransactionCreatePage v-else-if="editingTransactionDto" class="flex-1 min-h-0"
          :editing-item="editingTransactionDto" :form-config="transactionFormPresetFull" @saved="onTransactionSaved"
          @saved-error="onTransactionError" @deleted="onTransactionDeleted" @deleted-error="onTransactionError"
          @close-request="closeTransactionEdit" />
      </div>
    </SideModalDialog>

    <AlertDialog :dialog="batchDeleteDialog" :descr="$t('salaryBatchDeleteConfirm')" :confirm-text="$t('delete')"
      :leave-text="$t('cancel')" @confirm="confirmDeleteBatch" @leave="batchDeleteDialog = false" />
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
import SideModalDialog, { salaryAccrualSideModalTitle, transactionSideModalTitle, sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SalaryAccrualModal from '@/views/components/app/SalaryAccrualModal.vue';
import SalaryBatchLineOpenTxCell from '@/views/components/app/salaries/SalaryBatchLineOpenTxCell.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import CompaniesController from '@/api/CompaniesController';
import UsersController from '@/api/UsersController';
import TransactionController from '@/api/TransactionController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import { toDayjsLocale } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const salariesReportViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'salariesReport',
    modes: ['table', 'cards'],
});

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
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        draggable: VueDraggableNext,
    },
    mixins: [notificationMixin, getApiErrorMessage, sideModalFooterPortal, cardFieldsVisibilityMixin, salariesReportViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'salaries.report.batches.cards',
            titleField: 'title',
            reportLoading: false,
      reportRows: [],
      usersLoading: false,
      userRows: [],
      salaryModalOpen: false,
      salaryAccrualHeaderLive: '',
      salaryOperationType: 'salaryAccrual',
      modalUserIds: [],
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
        { name: 'payment_type', label: 'salaryPaymentType' },
        { name: 'creator', label: 'salaryReportColumnPerformedBy' },
        { name: 'line_count', label: 'salaryReportColumnLines' },
        { name: 'totals_display', label: 'salaryReportColumnTotals' },
      ],
      transactionFormPresetFull: TRANSACTION_FORM_PRESETS.full,
    };
  },
  computed: {
    reportTotalsDisplay() {
      const totals = {};
      for (const row of this.reportRows) {
        const chunks = String(row.totals_display || '').split('·').map((s) => s.trim()).filter(Boolean);
        for (const chunk of chunks) {
          const m = chunk.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
          if (!m) {
            continue;
          }
          const amount = Number(m[1]);
          const symbol = (m[2] || '').trim();
          totals[symbol] = (totals[symbol] || 0) + amount;
        }
      }
      const parts = Object.entries(totals).map(([symbol, amount]) => this.formatCurrency(amount, symbol));
      return parts.length ? parts.join(' · ') : '—';
    },
    currentCompanyId() {
      return this.$store.getters.currentCompanyId;
    },
    salaryAccrualBarTitle() {
      if (!this.salaryModalOpen) {
        return '';
      }
      if (this.salaryAccrualHeaderLive) {
        return this.salaryAccrualHeaderLive;
      }
      return salaryAccrualSideModalTitle(this.$t.bind(this), {
        operationType: this.salaryOperationType,
        forAllActiveEmployees: true,
        count: this.modalUserIds.length,
      });
    },
    batchSideModalTitle() {
      if (!this.batchModalOpen) {
        return '';
      }
      if (this.batchDetailLoading) {
        return this.$t('loading');
      }
      if (this.batchDetail) {
        return this.batchTypeLabel(this.batchDetail.type);
      }
      return '';
    },
    transactionEditBarTitle() {
      if (!this.transactionEditOpen) {
        return '';
      }
      if (this.transactionModalLoading) {
        return this.$t('loading');
      }
      return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransactionDto });
    },
    batchSummaryRows() {
      const b = this.batchDetail;
      if (!b) {
        return [];
      }
      return [
        { key: 'date', labelKey: 'salaryReportColumnDate', value: this.formatBatchMonth(b.date), wide: true },
        { key: 'type', labelKey: 'salaryReportColumnType', value: this.batchTypeLabel(b.type) },
        { key: 'payment_type', labelKey: 'salaryPaymentType', value: this.paymentTypeLabel(b.payment_type) },
      ];
    },
    batchLinesTableKey() {
      if (!this.batchDetail) {
        return 'salaries.report.batch.lines.accrual';
      }
      return this.isSalaryBatchPayment
        ? 'salaries.report.batch.lines.payment'
        : 'salaries.report.batch.lines.accrual';
    },
    isSalaryBatchPayment() {
      const t = this.batchDetail?.type;
      if (t == null || t === '') {
        return false;
      }
      return String(t).toLowerCase() === 'payment';
    },
    batchLineColumns() {
      const openTx = {
        name: 'open_tx',
        label: 'salaryPreviewOpenTx',
        component: markRaw(SalaryBatchLineOpenTxCell),
        props: (item) => ({
          transactionId: item.transaction_id,
          onOpen: this.openBatchLineTransaction,
        }),
      };
      if (this.isSalaryBatchPayment) {
        return [
          { name: 'employee_name', label: 'firstName' },
          { name: 'prorated_salary_amount', label: 'salaryReportAccrued' },
          { name: 'amount', label: 'total' },
          openTx,
        ];
      }
      return [
        { name: 'employee_name', label: 'firstName' },
        { name: 'official_working_days_norm', label: 'officialWorkingDaysNorm' },
        { name: 'official_working_days_worked', label: 'officialWorkingDaysWorked' },
        { name: 'prorated_salary_amount', label: 'proratedSalary' },
        { name: 'amount', label: 'total' },
        openTx,
      ];
    },
    canDeleteSalaryBatch() {
      const g = this.$store.getters;
      return g.hasPermission('employee_salaries_accrue')
        && (g.hasPermission('transactions_delete') || g.hasPermission('transactions_delete_all'));
    },
    salaryReportCardsToolbar() {
      return {
        showPagination: false,
      };
    },
    cardConfigBase() {
      return [
        { name: 'title', label: null },
        { name: 'payment_type', label: 'salaryPaymentType', icon: 'fas fa-credit-card text-[#3571A4]' },
        { name: 'creator', label: 'salaryReportColumnPerformedBy', icon: 'fas fa-user text-[#3571A4]' },
        { name: 'line_count', label: 'salaryReportColumnLines', icon: 'fas fa-list-ol text-[#3571A4]' },
        { name: 'totals_display', label: 'salaryReportColumnTotals', icon: 'fas fa-coins text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
    batchDetailLineRows() {
      return (this.batchDetail?.lines || []).map((l) => ({
        id: l.id,
        employee_name: l.employee_name,
        official_working_days_norm: l.official_working_days_norm,
        official_working_days_worked: l.official_working_days_worked,
        monthly_salary_base: l.monthly_salary_base,
        prorated_salary_amount: l.prorated_salary_amount,
        amount: l.amount,
        currency_symbol: l.currency_symbol || '',
        transaction_id: l.transaction_id ?? null,
      }));
    },
    batchLinesTotalsDisplay() {
      const totalsBySym = {};
      for (const l of this.batchDetailLineRows) {
        const sym = l.currency_symbol || '';
        totalsBySym[sym] = (totalsBySym[sym] ?? 0) + Number(l.amount || 0);
      }
      const parts = Object.entries(totalsBySym)
        .map(([sym, amount]) => this.formatCurrency(amount, sym))
        .filter(Boolean);
      return parts.length ? parts.join(' · ') : '—';
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
    formatBatchMonth(value) {
      if (!value) {
        return '—';
      }
      return dayjs(value).locale(toDayjsLocale(this.$i18n?.locale)).format('MMMM YYYY');
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
    paymentTypeLabel(paymentType) {
      if (paymentType === 1) {
        return this.$t('salaryPaymentTypeCash');
      }
      if (paymentType === 0) {
        return this.$t('salaryPaymentTypeNonCash');
      }
      return '—';
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
        date: () => this.formatBatchMonth(item.date),
        type: () => this.batchTypeLabel(item.type),
        payment_type: () => this.paymentTypeLabel(item.payment_type),
        creator: () => this.salaryReportCreatorCell(item),
        line_count: () => item.line_count ?? '—',
        totals_display: () => item.totals_display || '—',
      };
      return byCol[column]?.() ?? item[column];
    },
    salaryReportCreatorCell(item) {
      if (item.creator_id == null) {
        return '—';
      }
      const name = String(item.creator_name || '').trim();
      return name ? `${name} (#${item.creator_id})` : `#${item.creator_id}`;
    },
    salaryReportCardTitlePrefix() {
      return '<i class="fas fa-file-invoice-dollar text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    salaryReportCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return `${this.batchTypeLabel(item.type)} — ${this.formatBatchMonth(item.date)}`;
      }
      if (fieldName === 'creator') {
        return this.salaryReportCreatorCell(item);
      }
      return this.reportItemMapper(item, fieldName) ?? '';
    },
    batchLineItemMapper(item, column) {
      if (column === 'amount') {
        return this.formatCurrency(item.amount, item.currency_symbol || '');
      }
      if (column === 'monthly_salary_base' || column === 'prorated_salary_amount') {
        const v = item[column];
        return v != null && v !== ''
          ? this.formatCurrency(Number(v), item.currency_symbol || '')
          : '—';
      }
      if (column === 'official_working_days_norm' || column === 'official_working_days_worked') {
        const v = item[column];
        return v != null && v !== '' ? String(v) : '—';
      }
      if (column === 'employee_name') {
        return item.employee_name || '—';
      }
      return item[column];
    },
    async loadReport() {
      const companyId = this.currentCompanyId;
      if (!companyId) {
        this.reportRows = [];
        return;
      }
      this.reportLoading = true;
      try {
        const data = await CompaniesController.getSalaryMonthlyReport(companyId, null, true);
        const items = data?.items || [];
        this.reportRows = items.map((r) => ({
          id: r.id,
          date: r.date,
          type: r.type,
          payment_type: r.payment_type ?? null,
          creator_id: r.creator_id ?? null,
          creator_name: r.creator_name ?? null,
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
      this.salaryOperationType = type;
      this.salaryModalOpen = true;
    },
    closeSalaryModal() {
      this.salaryModalOpen = false;
      this.salaryAccrualHeaderLive = '';
      this.salaryOperationType = 'salaryAccrual';
      this.modalUserIds = [];
    },
    async onSalaryModalSuccess() {
      this.closeSalaryModal();
      await this.loadReport();
      await this.fetchUsers();
    },
  },
};
</script>
