<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <h2 class="mb-6 text-lg font-bold text-gray-900">
        {{ getModalTitle() }}
      </h2>

      <div class="max-w-2xl mb-4">
        <div
          v-if="operationType === 'salaryAccrual' || salaryPaymentUsesMonthOnly"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('salaryAccrualMonth') }}</label>
          <input
            v-model="form.accrualMonth"
            type="month"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <div
          v-if="isSalaryFlow"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('salaryPaymentType') }}</label>
          <select
            v-model.number="form.paymentType"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option :value="0">
              {{ $t('salaryPaymentTypeNonCash') }}
            </option>
            <option :value="1">
              {{ $t('salaryPaymentTypeCash') }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('cashRegister') }}</label>
          <select
            v-model="form.cashId"
            required
            :disabled="!form.companyId || loading || !cashRegistersForForm.length"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option
              :value="null"
              disabled
            >
              {{ cashRegistersForForm.length ? $t('selectCashRegister') : $t('noCashRegistersForPaymentType') }}
            </option>
            <option
              v-for="cash in cashRegistersForForm"
              :key="cash.id"
              :value="cash.id"
            >
              {{ cash.displayName || cash.name }} {{ cash.currencySymbol ? `(${cash.currencySymbol})` : '' }}
            </option>
          </select>
        </div>

        <div
          v-if="operationType === 'salaryPayment' && !salaryPaymentUsesMonthOnly"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('date') }}</label>
          <input
            v-model="form.date"
            type="datetime-local"
            step="60"
            required
            :disabled="loading"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
        </div>

        <div
          v-if="operationType && !isSalaryFlow"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('amount') }}</label>
          <input
            v-model="form.amount"
            type="number"
            step="0.01"
            min="0"
            required
            :disabled="loading"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
        </div>

        <div
          v-if="operationType && !isSalaryFlow"
          class="mb-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('note') }}</label>
          <textarea
            v-model="form.note"
            :placeholder="$t('salaryAccrualNotePlaceholder')"
            rows="3"
            maxlength="255"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[5rem]"
          />
        </div>
      </div>

      <div
        v-if="isSalaryFlow"
        class="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
      >
        <div class="px-3 py-2.5 border-b border-gray-200 bg-gray-50">
          <span class="text-sm font-semibold text-gray-800">{{ $t('salaryAccrualPreview') }}</span>
        </div>
        <div
          v-if="previewLoading"
          class="px-4 py-8 text-center text-sm text-gray-500"
        >
          {{ $t('loading') }}
        </div>
        <div
          v-else
          class="p-2 sm:p-3 overflow-x-auto"
        >
          <DraggableTable
            :table-key="previewTableKey"
            :columns-config="previewColumnsConfig"
            :table-data="previewItems"
            :item-mapper="previewItemMapper"
            :disable-local-sort="false"
          />
        </div>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="operationType === 'salaryAccrual' && normDetailOpen"
        class="salary-accrual-submodal fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
        @click.self="closeNormDetail"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="px-4 py-3 border-b border-gray-200 font-semibold text-sm shrink-0">
            {{ $t('officialWorkingDaysNorm') }}
          </div>
          <div class="overflow-auto p-4 flex-1 min-h-0 text-sm space-y-4">
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">
                {{ $t('salaryOfficialNormScheduleOff') }}
              </div>
              <div class="text-gray-800 whitespace-pre-line">
                {{ formatNormDateList(officialNormNonWorking.schedule_off_dates) }}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">
                {{ $t('salaryOfficialNormCalendarOff') }}
              </div>
              <div class="text-gray-800 whitespace-pre-line">
                {{ formatNormDateList(officialNormNonWorking.calendar_off_dates) }}
              </div>
            </div>
          </div>
          <div class="px-4 py-2 border-t border-gray-200 shrink-0 text-right">
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              @click="closeNormDetail"
            >
              {{ $t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="operationType === 'salaryAccrual' && workedDetailModal.open && workedDetailModal.breakdown"
        class="salary-accrual-submodal fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
        @click.self="closeWorkedBreakdown"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="px-4 py-3 border-b border-gray-200 font-semibold text-sm shrink-0">
            {{ workedBreakdownModalTitle }}
          </div>
          <div class="overflow-auto p-4 flex-1 min-h-0 text-sm space-y-4">
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">
                {{ $t('salaryOfficialWorkedCalcMonth') }}
              </div>
              <div>
                {{ formatOfficialDateRange(workedDetailModal.breakdown.month_from, workedDetailModal.breakdown.month_to) }}
              </div>
            </div>
            <div v-if="workedDetailModal.breakdown.employment_differs_from_month">
              <div class="text-xs font-medium text-gray-500 mb-1">
                {{ $t('salaryOfficialWorkedFactPeriod') }}
              </div>
              <div>
                {{ formatOfficialDateRange(workedDetailModal.breakdown.employment_from, workedDetailModal.breakdown.employment_to) }}
              </div>
            </div>
            <div v-if="(workedDetailModal.breakdown.leave_periods || []).length">
              <div class="text-xs font-medium text-gray-500 mb-2">
                {{ $t('salaryOfficialWorkedLeaveHeading') }}
              </div>
              <ul class="space-y-2 list-none pl-0">
                <li
                  v-for="(p, idx) in workedDetailModal.breakdown.leave_periods"
                  :key="idx"
                  class="border border-gray-100 rounded px-3 py-2"
                >
                  <div class="font-medium">
                    {{ leaveTypeLabel(p.leave_type_name) }}
                  </div>
                  <div class="text-gray-700 text-xs mt-1">
                    {{ formatOfficialDateRange(p.date_from, p.date_to) }}
                  </div>
                  <div class="text-gray-600 text-xs mt-0.5">
                    {{ $t('salaryOfficialWorkedLeaveOfficialDays', { n: p.official_days }) }}
                  </div>
                </li>
              </ul>
              <div
                v-if="Number(workedDetailModal.breakdown.leave_official_days_total) > 0"
                class="text-xs text-gray-600 mt-2"
              >
                {{ $t('salaryOfficialWorkedDeductedUniqueDays', { n: workedDetailModal.breakdown.leave_official_days_total }) }}
              </div>
            </div>
          </div>
          <div class="px-4 py-2 border-t border-gray-200 shrink-0 text-right">
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              @click="closeWorkedBreakdown"
            >
              {{ $t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="operationType === 'salaryPayment' && adjustmentDetailModal.open"
        class="salary-accrual-submodal fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
        @click.self="closeAdjustmentDetail"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="px-4 py-3 border-b border-gray-200 font-semibold text-sm shrink-0">
            {{ adjustmentDetailModalTitle }}
          </div>
          <div class="overflow-auto p-4 flex-1 min-h-0 text-sm space-y-2">
            <div
              v-for="(tx, idx) in adjustmentDetailModal.transactions"
              :key="tx.id != null ? tx.id : `tx-${idx}`"
              class="border border-gray-100 rounded px-3 py-2 text-gray-800"
            >
              {{ formatAdjustmentTransactionLine(tx) }}
            </div>
          </div>
          <div class="px-4 py-2 border-t border-gray-200 shrink-0 text-right">
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              @click="closeAdjustmentDetail"
            >
              {{ $t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <div class="flex-shrink-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200/80">
      <PrimaryButton
        :onclick="handleOperation"
        :is-loading="loading"
        :is-success="true"
        :disabled="!isFormValid"
        icon="fas fa-save"
        :aria-label="getModalTitle()"
      />
    </div>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import CompaniesController from '@/api/CompaniesController';
import TransactionController from '@/api/TransactionController';
import UsersController from '@/api/UsersController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import { getCurrentLocalDateTime, getCurrentServerDateObject } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { markRaw } from 'vue';
import dayjs from 'dayjs';
import SalaryPreviewSelectCell from '@/views/components/app/SalaryPreviewSelectCell.vue';
import SalaryPreviewBreakdownCell from '@/views/components/app/SalaryPreviewBreakdownCell.vue';
import SalaryPreviewWorkedDaysCell from '@/views/components/app/SalaryPreviewWorkedDaysCell.vue';
import SalaryPreviewNormCell from '@/views/components/app/SalaryPreviewNormCell.vue';
import { translateLeaveType } from '@/utils/translationUtils';

const PREVIEW_TX_KINDS = ['advance', 'penalty', 'bonus'];

const PREVIEW_SELECT_PICK = {
    salary: {
        name: 'salaryPick',
        label: 'salaries',
        optionsKey: 'salarySelectOptions',
        selectedKey: 'selectedSalaryId',
    },
    balance: {
        name: 'balancePick',
        label: 'selectBalance',
        optionsKey: 'balanceSelectOptions',
        selectedKey: 'selectedBalanceId',
    },
};

const BATCH_TX_META = {
    salaryPayment: { categoryId: 7, isDebt: false, type: 0 },
    bonus: { categoryId: 26, isDebt: true, type: 0 },
    penalty: { categoryId: 27, isDebt: true, type: 1 },
    advance: { categoryId: 23, isDebt: false, type: 0 },
};

export default {
    components: {
        PrimaryButton,
        DraggableTable
    },
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        companyId: {
            type: Number,
            required: false,
            default: null
        },
        userIds: {
            type: Array,
            required: false,
            default: () => []
        },
        users: {
            type: Array,
            required: false,
            default: () => []
        },
        operationType: {
            type: String,
            required: false,
            default: 'salaryAccrual'
        },
        forAllActiveEmployees: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['success', 'cancel'],
    data() {
        return {
            form: {
                companyId: null,
                date: getCurrentLocalDateTime(),
                cashId: null,
                note: null,
                amount: null,
                paymentType: 1,
                accrualMonth: '',
            },
            loading: false,
            cashRegisters: [],
            previewLoading: false,
            previewItems: [],
            officialNormNonWorking: {
                schedule_off_dates: [],
                calendar_off_dates: [],
            },
            normDetailOpen: false,
            workedDetailModal: {
                open: false,
                employeeName: '',
                breakdown: null,
            },
            adjustmentDetailModal: {
                open: false,
                kind: 'advance',
                employeeName: '',
                transactions: [],
                currencySymbol: '',
            },
        };
    },
    watch: {
        'form.accrualMonth'(value) {
            if (!this.isSalaryFlow || !value) {
                return;
            }
            if (this.operationType !== 'salaryAccrual' && !this.salaryPaymentUsesMonthOnly) {
                return;
            }
            this.loadAccrualPreview();
        },
        'form.paymentType'() {
            if (!this.isSalaryFlow) {
                return;
            }
            this.syncCashRegisterToPaymentType();
            this.loadAccrualPreview();
        },
    },
    computed: {
        isSalaryFlow() {
            return this.operationType === 'salaryAccrual' || this.operationType === 'salaryPayment';
        },
        salaryPaymentUsesMonthOnly() {
            return this.forAllActiveEmployees && this.operationType === 'salaryPayment';
        },
        previewTableKey() {
            return this.operationType === 'salaryAccrual' ? 'salary.accrual.preview' : 'salary.payment.preview';
        },
        canPickClientBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view');
        },
        cashRegistersForForm() {
            if (!this.isSalaryFlow) {
                return this.cashRegisters;
            }
            const wantCash = Number(this.form.paymentType) === 1;
            return this.cashRegisters.filter((c) => c.isCash === wantCash);
        },
        previewColumnsConfig() {
            const cols = [
                { name: 'name', label: 'firstName' },
            ];
            if (this.isSalaryFlow) {
                cols.push(this.previewSelectPickColumn('salary'));
            }
            if (this.canPickClientBalance) {
                cols.push(this.previewSelectPickColumn('balance'));
            }
            const adjustmentColumns = this.operationType === 'salaryPayment'
                ? PREVIEW_TX_KINDS.map((k) => this.previewBreakdownColumn(k))
                : [];
            if (this.operationType === 'salaryAccrual') {
                cols.push(
                    this.buildPreviewNormColumn(),
                    this.buildPreviewWorkedDaysColumn(),
                    { name: 'proratedSalary', label: 'proratedSalary' },
                );
            }
            if (this.operationType === 'salaryPayment') {
                cols.push({ name: 'proratedSalary', label: 'salaryReportAccrued' });
            }
            cols.push(
                ...adjustmentColumns,
                { name: 'total', label: 'total' }
            );
            return cols;
        },
        isFormValid() {
            const base = this.form.cashId && this.form.companyId;
            const accrualMonthOk = this.operationType !== 'salaryAccrual' || !!this.form.accrualMonth;
            const amountOk = this.isSalaryFlow || (this.form.amount && parseFloat(this.form.amount) > 0);
            const paymentDateOk = this.operationType !== 'salaryPayment'
                || (this.salaryPaymentUsesMonthOnly
                    ? !!this.form.accrualMonth
                    : !!String(this.form.date || '').trim());
            const salaryPreviewOk = !this.isSalaryFlow
                || (!this.previewLoading && this.creatorIdsForSalaryFlow.length > 0);
            return !!(base && accrualMonthOk && amountOk && paymentDateOk && salaryPreviewOk);
        },
        creatorIdsForSalaryFlow() {
            if (!this.isSalaryFlow) {
                return this.userIds || [];
            }
            if (this.previewLoading) {
                return this.userIds || [];
            }
            return this.previewItems.map((r) => r.creatorId);
        },
        modalAffectedCount() {
            if (!this.isSalaryFlow) {
                return this.userIds?.length || 0;
            }
            if (this.previewLoading) {
                return this.userIds?.length || 0;
            }
            return this.previewItems.length;
        },
        workedBreakdownModalTitle() {
            if (!this.workedDetailModal.open) {
                return '';
            }
            return `${this.workedDetailModal.employeeName} — ${this.$t('officialWorkingDaysWorked')}`;
        },
        adjustmentDetailModalTitle() {
            if (!this.adjustmentDetailModal.open) {
                return '';
            }
            const k = this.adjustmentDetailModal.kind;
            const label = this.$te(k) ? this.$t(k) : k;
            return `${this.adjustmentDetailModal.employeeName} — ${label}`;
        },
    },
    async mounted() {
        if (!this.userIds || this.userIds.length === 0) {
            this.showNotification(
                this.$t('error'),
                this.$t('selectUsersFirst'),
                true
            );
            this.$emit('cancel');
            return;
        }

        const companyId = this.companyId || this.$store.getters.currentCompanyId;

        if (!companyId) {
            this.showNotification(
                this.$t('error'),
                this.$t('companyNotSelected'),
                true
            );
            return;
        }

        this.form.companyId = companyId;
        if (!this.isSalaryFlow || (this.operationType === 'salaryPayment' && !this.forAllActiveEmployees)) {
            this.syncFormDateNow();
        }
        await this.loadCashRegisters();
        this.syncCashRegisterToPaymentType();

        if (this.operationType === 'salaryPayment') {
            await this.loadUserSalaries();
        }

        if (this.isSalaryFlow) {
            const serverNow = getCurrentServerDateObject();
            const year = serverNow.getUTCFullYear();
            const month = String(serverNow.getUTCMonth() + 1).padStart(2, '0');
            this.form.accrualMonth = `${year}-${month}`;
            await this.loadAccrualPreview();
        } else {
            this.form.note = this.getDefaultNote();
        }
    },
    methods: {
        syncFormDateNow() {
            this.form.date = getCurrentLocalDateTime();
        },
        syncCashRegisterToPaymentType() {
            const list = this.cashRegistersForForm;
            if (list.some((c) => c.id === this.form.cashId)) {
                return;
            }
            this.form.cashId = list[0]?.id ?? null;
        },
        formatAmount(value, currencySymbol = '') {
            return formatCurrency(value ?? 0, currencySymbol);
        },
        previewItemMapper(item, column) {
            if (column === 'name') {
                return item.name;
            }
            if (column === 'salaryPick' || column === 'balancePick') {
                return '';
            }
            if (PREVIEW_TX_KINDS.includes(column)) {
                return Number(item[column] ?? 0);
            }
            if (column === 'officialWorkingDaysNorm' || column === 'officialWorkingDaysWorked') {
                const v = item[column];
                return v != null && v !== '' ? String(v) : '—';
            }
            return this.formatAmount(item[column], item.currencySymbol);
        },
        previewBreakdownColumn(kind) {
            return {
                name: kind,
                label: kind,
                component: markRaw(SalaryPreviewBreakdownCell),
                props: (item) => ({
                    kind,
                    amount: Number(item[kind] ?? 0),
                    currencySymbol: item.currencySymbol || '',
                    transactions: item[`${kind}Transactions`] || [],
                    detailTitle: this.adjustmentDetailTitle(item, kind),
                    onOpen: () => this.openAdjustmentDetail(item, kind),
                }),
            };
        },
        openAdjustmentDetail(item, kind) {
            const txs = item[`${kind}Transactions`] || [];
            if (!txs.length) {
                return;
            }
            this.adjustmentDetailModal = {
                open: true,
                kind,
                employeeName: item.name || '',
                transactions: txs,
                currencySymbol: item.currencySymbol || '',
            };
        },
        closeAdjustmentDetail() {
            this.adjustmentDetailModal.open = false;
            this.adjustmentDetailModal.transactions = [];
        },
        formatAdjustmentTransactionLine(tx) {
            const sym = this.adjustmentDetailModal.currencySymbol || '';
            const id = tx.id != null ? `#${tx.id} ` : '';
            const d = this.formatBreakdownDate(tx.date);
            const a = this.formatAmount(tx.orig_amount ?? tx.origAmount, sym);
            const typ = this.txTypeLabel(tx.type);
            const note = (tx.note || '').trim();
            const base = `${id}${d} · ${a} · ${typ}`;
            return note ? `${base} · ${note}` : base;
        },
        adjustmentDetailTitle(item, kind) {
            const txs = item[`${kind}Transactions`] || [];
            if (!txs.length) {
                return '';
            }
            const sym = item.currencySymbol || '';
            return txs.map((tx) => {
                const id = tx.id != null ? `#${tx.id} ` : '';
                const d = this.formatBreakdownDate(tx.date);
                const a = this.formatAmount(tx.orig_amount ?? tx.origAmount, sym);
                const typ = this.txTypeLabel(tx.type);
                const note = (tx.note || '').trim();
                const base = `${id}${d} · ${a} · ${typ}`;
                return note ? `${base} · ${note}` : base;
            }).join('\n');
        },
        buildPreviewNormColumn() {
            return {
                name: 'officialWorkingDaysNorm',
                label: 'officialWorkingDaysNorm',
                component: markRaw(SalaryPreviewNormCell),
                props: (item) => ({
                    norm: item.officialWorkingDaysNorm,
                    onOpen: () => this.openNormDetail(),
                }),
            };
        },
        openNormDetail() {
            if (this.operationType !== 'salaryAccrual') {
                return;
            }
            this.normDetailOpen = true;
        },
        closeNormDetail() {
            this.normDetailOpen = false;
        },
        formatNormDateList(dates) {
            if (!dates?.length) {
                return this.$t('salaryOfficialNormNoDates');
            }
            return dates
                .slice()
                .sort()
                .map((d) => (dayjs(d).isValid() ? dayjs(d).format('DD.MM.YYYY') : d))
                .join(', ');
        },
        buildPreviewWorkedDaysColumn() {
            return {
                name: 'officialWorkingDaysWorked',
                label: 'officialWorkingDaysWorked',
                component: markRaw(SalaryPreviewWorkedDaysCell),
                props: (item) => ({
                    worked: item.officialWorkingDaysWorked,
                    breakdown: item.officialWorkedBreakdown,
                    onOpen: () => this.openWorkedBreakdown(item),
                }),
            };
        },
        openWorkedBreakdown(item) {
            const b = item?.officialWorkedBreakdown;
            if (!b) {
                return;
            }
            if (!b.employment_differs_from_month && !(b.leave_periods || []).length) {
                return;
            }
            this.workedDetailModal = {
                open: true,
                employeeName: item.name,
                breakdown: b,
            };
        },
        closeWorkedBreakdown() {
            this.workedDetailModal.open = false;
            this.workedDetailModal.breakdown = null;
        },
        formatOfficialDateRange(from, to) {
            if (from == null || to == null) {
                return '—';
            }
            const a = dayjs(from);
            const b = dayjs(to);
            if (!a.isValid() || !b.isValid()) {
                return '—';
            }
            return `${a.format('DD.MM.YYYY')} — ${b.format('DD.MM.YYYY')}`;
        },
        leaveTypeLabel(name) {
            return name ? translateLeaveType(name, this.$t) : '—';
        },
        formatBreakdownDate(value, withTime = false) {
            if (value == null || value === '') {
                return '—';
            }
            const d = dayjs(value);
            return d.isValid() ? d.format(withTime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY') : '—';
        },
        txTypeLabel(type) {
            const n = type != null ? Number(type) : null;
            if (n === 1) {
                return this.$t('income');
            }
            if (n === 0) {
                return this.$t('expense');
            }
            return '—';
        },
        previewSelectPickColumn(kind) {
            const cfg = PREVIEW_SELECT_PICK[kind];
            return {
                name: cfg.name,
                label: cfg.label,
                component: markRaw(SalaryPreviewSelectCell),
                props: (item) => {
                    const options = item[cfg.optionsKey];
                    return {
                        selectedValue: item[cfg.selectedKey],
                        options,
                        disabled: !options?.length,
                        plainWhenSingle: true,
                        onSelect: (v) => {
                            if (kind === 'salary') {
                                this.onPreviewSalaryChange(item.id, v);
                            } else {
                                this.onPreviewBalanceChange(item.id, v);
                            }
                        },
                    };
                },
            };
        },
        findPreviewRow(creatorId) {
            const n = Number(creatorId);
            return this.previewItems.find((r) => Number(r.id) === n);
        },
        onPreviewSalaryChange(creatorId, salaryId) {
            const row = this.findPreviewRow(creatorId);
            if (!row || salaryId == null) {
                return;
            }
            row.selectedSalaryId = salaryId;
            const raw = (row.salaryOptionsRaw || []).find((s) => s.id === salaryId);
            if (raw) {
                row.salary = Number(raw.amount || 0);
                row.proratedSalary = Number(raw.prorated_amount ?? 0);
                row.currencySymbol = raw.currency_symbol || '';
                row.total = this.operationType === 'salaryAccrual'
                    ? row.proratedSalary
                    : row.proratedSalary + row.bonus - row.penalty - row.advance;
            }
            this.pickBalancesForSalary(row);
        },
        onPreviewBalanceChange(creatorId, balanceId) {
            const row = this.findPreviewRow(creatorId);
            if (!row) {
                return;
            }
            row.selectedBalanceId = balanceId;
        },
        buildAccrueItemsPayload() {
            return this.previewItems.map((r) => {
                const item = { creatorId: r.creatorId };
                if (r.selectedSalaryId != null) {
                    item.employeeSalaryId = r.selectedSalaryId;
                }
                if (this.canPickClientBalance && r.selectedBalanceId != null) {
                    item.clientBalanceId = r.selectedBalanceId;
                }
                return item;
            });
        },
        pickBalancesForSalary(row) {
            const salaries = row.salaryOptionsRaw || [];
            const sal = salaries.find((s) => s.id === row.selectedSalaryId) || salaries[0];
            const cid = sal?.currency_id;
            const payType = Number(this.form.paymentType);
            const raw = row.balanceOptionsRaw || [];
            const filtered = cid == null
                ? []
                : raw.filter((b) => {
                    if (Number(b.currency_id) !== Number(cid)) {
                        return false;
                    }
                    if (b.type != null && Number(b.type) !== payType) {
                        return false;
                    }
                    return true;
                });
            row.balanceSelectOptions = filtered.map((b) => ({
                value: b.id,
                label: b.label || String(b.id),
                isDefault: !!b.is_default,
            }));
            const keep = row.selectedBalanceId != null
                && filtered.some((b) => Number(b.id) === Number(row.selectedBalanceId));
            if (!keep) {
                row.selectedBalanceId = filtered.find((b) => b.is_default)?.id ?? filtered[0]?.id ?? null;
            }
        },
        mapPreviewResponseItem(item) {
            const salarySelectOptions = (item.salary_options || []).map((s) => ({
                value: s.id,
                label: s.label,
            }));
            const proratedSalary = Number(item.prorated_salary ?? 0);
            const row = {
                id: item.creator_id,
                creatorId: item.creator_id,
                name: item.creator?.name || `ID: ${item.creator_id}`,
                salary: Number(item.salary || 0),
                officialWorkingDaysNorm: item.official_working_days_norm,
                officialWorkingDaysWorked: item.official_working_days_worked,
                officialWorkedBreakdown: item.official_worked_breakdown ?? null,
                proratedSalary,
                total: this.operationType === 'salaryAccrual'
                    ? proratedSalary
                    : Number(item.total || 0),
                currencySymbol: item.currency_symbol || '',
                salaryOptionsRaw: item.salary_options || [],
                salarySelectOptions,
                balanceOptionsRaw: item.balance_options || [],
                balanceSelectOptions: [],
                selectedSalaryId: item.selected_employee_salary_id ?? salarySelectOptions[0]?.value ?? null,
                selectedBalanceId: null,
            };
            if (this.operationType === 'salaryPayment') {
                row.advance = Number(item.advance || 0);
                row.penalty = Number(item.penalty || 0);
                row.bonus = Number(item.bonus || 0);
                for (const k of PREVIEW_TX_KINDS) {
                    row[`${k}Transactions`] = item[`${k}_transactions`] || [];
                }
            }
            this.pickBalancesForSalary(row);
            return row;
        },
        async loadAccrualPreview() {
            if (!this.isSalaryFlow || !this.form.companyId || !this.userIds?.length || !this.form.accrualMonth) {
                return;
            }
            this.previewLoading = true;
            this.previewItems = [];
            this.normDetailOpen = false;
            this.closeWorkedBreakdown();
            this.closeAdjustmentDetail();
            try {
                const previewDate = `${this.form.accrualMonth}-01`;
                const response = await CompaniesController.getSalaryAccrualPreview(
                    this.form.companyId,
                    previewDate,
                    this.userIds,
                    this.form.paymentType,
                    null,
                    this.operationType === 'salaryPayment',
                );
                const rawNorm = response?.official_norm_non_working;
                this.officialNormNonWorking = {
                    schedule_off_dates: rawNorm?.schedule_off_dates ?? [],
                    calendar_off_dates: rawNorm?.calendar_off_dates ?? [],
                };
                const items = response?.items || [];
                this.previewItems = items.map((row) => this.mapPreviewResponseItem(row));
            } catch (error) {
                this.previewItems = [];
                this.officialNormNonWorking = { schedule_off_dates: [], calendar_off_dates: [] };
                this.showNotification(
                    this.$t('error'),
                    this.getApiErrorMessage(error),
                    true
                );
            } finally {
                this.previewLoading = false;
            }
        },
        async loadCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch (error) {
                console.error('Error loading cash registers:', error);
                this.showNotification(
                    this.$t('error'),
                    this.$t('errorLoadingCashRegisters'),
                    true
                );
            }
        },
        async loadUserSalaries() {
            await Promise.all(
                this.users.map(async (user) => {
                    const data = await UsersController.getSalaries(user.id);
                    user.salaries = data.salaries || [];
                })
            );
        },
        accrueOperationPayload() {
            const date = this.operationType === 'salaryAccrual' && this.form.accrualMonth
                ? `${this.form.accrualMonth}-01`
                : this.form.date;
            return {
                companyId: this.form.companyId,
                date,
                cashId: this.form.cashId,
                note: null,
                creatorIds: this.creatorIdsForSalaryFlow,
                paymentType: this.form.paymentType,
            };
        },
        payOperationPayload() {
            const date = this.salaryPaymentUsesMonthOnly && this.form.accrualMonth
                ? `${this.form.accrualMonth}-01`
                : this.form.date;
            return {
                companyId: this.form.companyId,
                date,
                cashId: this.form.cashId,
                note: null,
                creatorIds: this.creatorIdsForSalaryFlow,
                paymentType: this.form.paymentType,
            };
        },
        async handleAccrue() {
            try {
                const payload = this.accrueOperationPayload();
                const checkResult = await CompaniesController.checkExistingSalaries(
                    this.form.companyId,
                    payload.date,
                    payload.creatorIds
                );
                if (checkResult?.hasExisting && checkResult.affectedUsers?.length > 0) {
                    const month = new Intl.DateTimeFormat(this.$i18n?.locale || undefined, {
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                    }).format(new Date(payload.date));
                    const userNames = checkResult.affectedUsers
                        .map((u) => u.creator?.name || `ID: ${u.creatorId}`)
                        .filter(Boolean);
                    const maxNames = 12;
                    let subtitle;
                    if (userNames.length > 0) {
                        const shown = userNames.slice(0, maxNames);
                        const namesText = shown.join(', ')
                            + (userNames.length > maxNames ? ` (+${userNames.length - maxNames})` : '');
                        subtitle = this.$t('salaryAccrualBlockedInMonth', { month, names: namesText });
                    } else {
                        subtitle = this.$t('salaryAccrualBlockedInMonthCount', {
                            month,
                            count: checkResult.affectedUsers.length,
                        });
                    }
                    this.showNotification(this.$t('warning'), subtitle, true);
                    return;
                }

                await this.performAccrue(payload);
            } catch (error) {
                console.error('Error checking existing accruals:', error);
                this.showNotification(
                    this.$t('error'),
                    this.getApiErrorMessage(error) || this.$t('errorCheckingExistingAccruals'),
                    true
                );
            }
        },
        async performAccrue(payload) {
            this.loading = true;
            try {
                const result = await CompaniesController.accrueSalaries(this.form.companyId, {
                    ...payload,
                    items: this.buildAccrueItemsPayload(),
                });

                const body = result?.data ?? result;
                const successCount = body.summary?.success || 0;
                const skippedCount = body.summary?.skipped || 0;
                const errorCount = body.summary?.errors || 0;

                let message = `${this.$t('accrued')}: ${successCount}`;
                if (skippedCount > 0) {
                    message += `, ${this.$t('skipped')}: ${skippedCount}`;
                }
                if (errorCount > 0) {
                    message += `, ${this.$t('errors')}: ${errorCount}`;
                }

                this.showNotification(
                    this.$t('success'),
                    message,
                    false
                );

                this.$emit('success', body);
                this.$emit('cancel');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'),
                    errorMessage,
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        async performPay() {
            this.loading = true;
            try {
                const result = await CompaniesController.paySalaries(this.form.companyId, {
                    ...this.payOperationPayload(),
                    items: this.buildAccrueItemsPayload(),
                });

                const body = result?.data ?? result;
                const successCount = body.summary?.success || 0;
                const skippedCount = body.summary?.skipped || 0;
                const errorCount = body.summary?.errors || 0;

                let message = `${this.$t('completed')}: ${successCount}`;
                if (skippedCount > 0) {
                    message += `, ${this.$t('skipped')}: ${skippedCount}`;
                }
                if (errorCount > 0) {
                    message += `, ${this.$t('errors')}: ${errorCount}`;
                }

                this.showNotification(
                    errorCount > 0 ? this.$t('error') : this.$t('success'),
                    message,
                    errorCount > 0
                );

                this.$emit('success', body);
                this.$emit('cancel');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'),
                    errorMessage,
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        async handleOperation() {
            if (!this.isFormValid) {
                return;
            }

            if (!this.isSalaryFlow) {
                this.syncFormDateNow();
            }

            if (this.operationType === 'salaryAccrual') {
                await this.handleAccrue();
                return;
            }

            if (this.operationType === 'salaryPayment' && this.isSalaryFlow) {
                await this.performPay();
                return;
            }

            await this.performBatchTransaction();
        },
        async performBatchTransaction() {
            this.loading = true;
            try {
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                const cashRegister = this.cashRegisters.find(c => c.id === this.form.cashId);

                if (!cashRegister) {
                    throw new Error(this.$t('cashRegisterNotFound'));
                }

                const results = {
                    success: 0,
                    errors: 0,
                    errorMessages: []
                };

                const processBatch = async (batch) => {
                    return Promise.all(batch.map(async (userId) => {
                        try {
                            const client = clients.find(c => {
                                const clientEmployeeId = c.employeeId ? Number(c.employeeId) : null;
                                return clientEmployeeId === Number(userId);
                            });

                            if (!client) {
                                return {
                                    success: false,
                                    error: this.$t('employeeClientNotFoundForId', { id: userId })
                                };
                            }

                            const transactionData = this.buildTransactionData(client, cashRegister, userId);
                            await TransactionController.storeItem(transactionData);
                            return { success: true };
                        } catch (error) {
                            console.error(`Ошибка при создании транзакции для сотрудника ${userId}:`, error);
                            const errorMsg = this.getApiErrorMessage(error);
                            return {
                                success: false,
                                error: this.$t('employeeErrorForId', { id: userId, error: errorMsg })
                            };
                        }
                    }));
                };

                const batchSize = 5;
                const transactionResults = [];

                const targetIds = this.creatorIdsForSalaryFlow;
                for (let i = 0; i < targetIds.length; i += batchSize) {
                    const batch = targetIds.slice(i, i + batchSize);
                    const batchResults = await processBatch(batch);
                    transactionResults.push(...batchResults);
                }

                transactionResults.forEach(result => {
                    if (result.success) {
                        results.success++;
                    } else {
                        results.errors++;
                        results.errorMessages.push(result.error);
                    }
                });

                let message = `${this.$t('completed')}: ${results.success}`;
                if (results.errors > 0) {
                    message += `, ${this.$t('errors')}: ${results.errors}`;
                    if (results.errorMessages.length > 0) {
                        const errorDetails = results.errorMessages.slice(0, 5).join('; ');
                        const moreErrors = results.errorMessages.length > 5 ? ` ${this.$t('andMoreErrors', { count: results.errorMessages.length - 5 })}` : '';
                        message += `\n\n${errorDetails}${moreErrors}`;
                    }
                }

                this.showNotification(
                    results.errors > 0 ? this.$t('error') : this.$t('success'),
                    message,
                    results.errors > 0
                );

                if (results.errors > 0 && results.errorMessages.length > 0) {
                    console.error('Errors during operation:', results.errorMessages);
                }

                this.$emit('success', results);
                this.$emit('cancel');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'),
                    errorMessage,
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        buildTransactionData(client, cashRegister, userId = null) {
            const meta = BATCH_TX_META[this.operationType];
            const previewRow = userId != null ? this.findPreviewRow(Number(userId)) : null;

            let amount = parseFloat(this.form.amount);

            if (this.operationType === 'salaryPayment' && userId) {
                if (previewRow && Number(previewRow.salary) > 0) {
                    amount = Number(previewRow.salary);
                } else {
                    const user = this.users.find((u) => u.id === userId);
                    const salary = user?.salaries?.find(
                        (s) => Number(s.paymentType) === Number(this.form.paymentType) && !s.endDate
                    );
                    if (salary?.amount) {
                        amount = parseFloat(salary.amount);
                    }
                }
            }

            const transactionData = {
                type: meta.type,
                clientId: client.id,
                cashId: this.form.cashId,
                categoryId: meta.categoryId,
                date: this.salaryPaymentUsesMonthOnly && this.form.accrualMonth
                    ? `${this.form.accrualMonth}-01`
                    : this.form.date,
                origAmount: amount,
                currencyId: cashRegister.currencyId,
                note: this.form.note || this.getDefaultNote(),
                isDebt: meta.isDebt,
                projectId: null,
            };

            if (previewRow && this.canPickClientBalance && previewRow.selectedBalanceId) {
                transactionData.clientBalanceId = previewRow.selectedBalanceId;
            }

            return transactionData;
        },
        getDefaultNote() {
            const notes = {
                'salaryPayment': this.$t('paySalary'),
                'bonus': this.$t('bonus'),
                'penalty': this.$t('penalty'),
                'advance': this.$t('advance')
            };
            return notes[this.operationType];
        },
        getModalTitle() {
            const count = this.modalAffectedCount;
            const companyTitles = {
                salaryAccrual: this.$t('accrueSalariesForCompany'),
                salaryPayment: this.$t('paySalariesForCompany'),
            };
            if (this.forAllActiveEmployees && companyTitles[this.operationType]) {
                return `${companyTitles[this.operationType]} (${count})`;
            }
            const selectedTitles = {
                salaryAccrual: this.$t('accrueSalariesForSelected'),
                salaryPayment: this.$t('paySalariesForSelected'),
                bonus: this.$t('accrueBonusesForSelected'),
                penalty: this.$t('issuePenaltiesForSelected'),
                advance: this.$t('issueAdvancesForSelected'),
            };
            return `${selectedTitles[this.operationType] || selectedTitles.salaryAccrual} (${count})`;
        },
    }
};
</script>
