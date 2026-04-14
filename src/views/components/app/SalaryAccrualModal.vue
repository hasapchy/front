<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <SalaryAccrualFormFields
        :form="form"
        :show-accrual-month="showAccrualMonthField"
        :show-payment-date-field="showPaymentDateTimeField"
        :loading="loading"
        :cash-registers-for-form="cashRegistersForForm"
        @patch-form="patchSalaryForm"
      />

      <SalaryAccrualPreviewSection
        :preview-loading="previewLoading"
        :loading="loading"
        :columns-config="previewColumnsConfig"
        :table-data="previewTableRows"
        :item-mapper="previewItemMapper"
        :row-class-fn="salaryPreviewRowClass"
        @refresh="loadAccrualPreview"
      />
    </div>

    <SalaryAccrualSubmodal
      :show="operationType === 'salaryAccrual' && normDetailOpen"
      :title="$t('officialWorkingDaysNorm')"
      @close="closeNormDetail"
    >
      <SalaryNormNonWorkingPanel
        :schedule-off-dates="officialNormNonWorking.schedule_off_dates"
        :calendar-off-dates="officialNormNonWorking.calendar_off_dates"
      />
    </SalaryAccrualSubmodal>

    <SalaryAccrualSubmodal
      :show="operationType === 'salaryAccrual' && workedDetailModal.open && workedDetailModal.breakdown"
      :title="workedBreakdownModalTitle"
      @close="closeWorkedBreakdown"
    >
      <SalaryOfficialWorkedBreakdownPanel :breakdown="workedDetailModal.breakdown" />
    </SalaryAccrualSubmodal>

    <SalaryAccrualSubmodal
      :show="operationType === 'salaryPayment' && adjustmentDetailModal.open"
      :title="adjustmentDetailModalTitle"
      @close="closeAdjustmentDetail"
    >
      <SalaryAdjustmentTransactionsList
        :transactions="adjustmentDetailModal.transactions"
        :line-formatter="formatAdjustmentTransactionLine"
      />
    </SalaryAccrualSubmodal>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          :onclick="handleOperation"
          :is-loading="loading"
          :is-success="true"
          :disabled="!isFormValid"
          icon="fas fa-save"
          :aria-label="getModalTitle()"
        />
      </div>
    </teleport>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SalaryAccrualFormFields from '@/views/components/app/salaries/SalaryAccrualFormFields.vue';
import SalaryAccrualPreviewSection from '@/views/components/app/salaries/SalaryAccrualPreviewSection.vue';
import SalaryAccrualSubmodal from '@/views/components/app/salaries/SalaryAccrualSubmodal.vue';
import SalaryNormNonWorkingPanel from '@/views/components/app/salaries/SalaryNormNonWorkingPanel.vue';
import SalaryOfficialWorkedBreakdownPanel from '@/views/components/app/salaries/SalaryOfficialWorkedBreakdownPanel.vue';
import SalaryAdjustmentTransactionsList from '@/views/components/app/salaries/SalaryAdjustmentTransactionsList.vue';
import CompaniesController from '@/api/CompaniesController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import {
    getCurrentLocalDateTime,
    getCurrentServerDateObject,
    formatShortDateOrDash,
} from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { markRaw } from 'vue';
import SalaryPreviewSelectCell from '@/views/components/app/SalaryPreviewSelectCell.vue';
import SalaryPreviewBreakdownCell from '@/views/components/app/SalaryPreviewBreakdownCell.vue';
import SalaryPreviewWorkedDaysCell from '@/views/components/app/SalaryPreviewWorkedDaysCell.vue';
import SalaryPreviewNormCell from '@/views/components/app/SalaryPreviewNormCell.vue';
import { salaryAccrualSideModalTitle, sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

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

function normalizeOfficialWorkedBreakdown(raw) {
    if (raw == null || typeof raw !== 'object') {
        return null;
    }
    const periods = raw.leave_periods;
    return {
        ...raw,
        leave_periods: Array.isArray(periods) ? periods : [],
    };
}

function normalizeSalaryPreviewTransaction(tx) {
    const rawAmount = tx.orig_amount != null ? tx.orig_amount : tx.origAmount;
    return {
        id: tx.id != null ? Number(tx.id) : null,
        date: tx.date != null ? tx.date : null,
        origAmount: Number(rawAmount ?? 0),
        note: String(tx.note ?? '').trim(),
        type: tx.type != null ? Number(tx.type) : 0,
    };
}

function normalizeSalaryPreviewTransactions(rawList) {
    if (!Array.isArray(rawList)) {
        return [];
    }
    return rawList.map(normalizeSalaryPreviewTransaction);
}

export default {
    components: {
        PrimaryButton,
        SalaryAccrualFormFields,
        SalaryAccrualPreviewSection,
        SalaryAccrualSubmodal,
        SalaryNormNonWorkingPanel,
        SalaryOfficialWorkedBreakdownPanel,
        SalaryAdjustmentTransactionsList,
    },
    mixins: [notificationMixin, getApiErrorMessage, sideModalFooterPortal],
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
    emits: ['success', 'cancel', 'dialog-title'],
    data() {
        return {
            form: {
                companyId: null,
                date: getCurrentLocalDateTime(),
                cashId: null,
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
    computed: {
        salaryPaymentUsesMonthOnly() {
            return this.forAllActiveEmployees && this.operationType === 'salaryPayment';
        },
        showAccrualMonthField() {
            return this.operationType === 'salaryAccrual' || this.salaryPaymentUsesMonthOnly;
        },
        showPaymentDateTimeField() {
            return this.operationType === 'salaryPayment' && !this.salaryPaymentUsesMonthOnly;
        },
        canPickClientBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view');
        },
        cashRegistersForForm() {
            const wantCash = Number(this.form.paymentType) === 1;
            return this.cashRegisters.filter((c) => c.isCash === wantCash);
        },
        previewColumnsConfig() {
            const cols = [
                { name: 'name', label: 'firstName' },
            ];
            cols.push(this.previewSelectPickColumn('salary'));
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
            const paymentDateOk = this.operationType !== 'salaryPayment'
                || (this.salaryPaymentUsesMonthOnly
                    ? !!this.form.accrualMonth
                    : !!String(this.form.date || '').trim());
            const salaryPreviewOk = !this.previewLoading && this.creatorIdsForSalaryFlow.length > 0;
            return !!(base && accrualMonthOk && paymentDateOk && salaryPreviewOk);
        },
        normalizedUserIds() {
            return Array.isArray(this.userIds) ? this.userIds : [];
        },
        creatorIdsForSalaryFlow() {
            if (this.previewLoading) {
                return this.normalizedUserIds;
            }
            return this.previewItems.map((r) => r.creatorId);
        },
        modalAffectedCount() {
            if (this.previewLoading) {
                return this.normalizedUserIds.length;
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
        previewTotalsDisplay() {
            const totals = {};
            for (const row of this.previewItems) {
                const sym = row.currencySymbol;
                totals[sym] = (totals[sym] || 0) + Number(row.total || 0);
            }
            const parts = Object.entries(totals).map(([sym, amount]) => this.formatAmount(amount, sym));
            return parts.length ? parts.join(' · ') : '—';
        },
        previewTableRows() {
            const rows = this.previewItems;
            if (this.previewLoading || !rows.length) {
                return rows;
            }
            const sym = rows[0].currencySymbol;
            const sumField = (f) => rows.reduce((s, r) => s + Number(r[f] || 0), 0);
            const totalRow = {
                _isSalaryPreviewTotal: true,
                id: '__salary_preview_total__',
                currencySymbol: sym,
                proratedSalary: sumField('proratedSalary'),
            };
            for (const k of PREVIEW_TX_KINDS) {
                totalRow[k] = sumField(k);
            }
            return [...rows, totalRow];
        },
    },
    watch: {
        modalAffectedCount: {
            handler() {
                this.$emit('dialog-title', this.getModalTitle());
            },
            immediate: true,
        },
        operationType: {
            handler() {
                this.$nextTick(() => this.$emit('dialog-title', this.getModalTitle()));
            },
        },
        forAllActiveEmployees: {
            handler() {
                this.$nextTick(() => this.$emit('dialog-title', this.getModalTitle()));
            },
        },
        'form.accrualMonth'(value) {
            if (!value) {
                return;
            }
            if (this.operationType !== 'salaryAccrual' && !this.salaryPaymentUsesMonthOnly) {
                return;
            }
            this.loadAccrualPreview();
        },
        'form.paymentType'() {
            this.syncCashRegisterToPaymentType();
            this.loadAccrualPreview();
        },
    },
    async mounted() {
        if (!this.normalizedUserIds.length) {
            this.showNotification(
                this.$t('error'),
                this.$t('selectUsersFirst'),
                true
            );
            this.$emit('cancel');
            return;
        }

        window.addEventListener('focus', this.onWindowFocus);
        document.addEventListener('visibilitychange', this.onVisibilityChange);

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
        if (this.operationType === 'salaryPayment' && !this.forAllActiveEmployees) {
            this.syncFormDateNow();
        }
        await this.loadCashRegisters();
        this.syncCashRegisterToPaymentType();

        const serverNow = getCurrentServerDateObject();
        const year = serverNow.getUTCFullYear();
        const month = String(serverNow.getUTCMonth() + 1).padStart(2, '0');
        this.form.accrualMonth = `${year}-${month}`;
        await this.loadAccrualPreview();
    },
    beforeUnmount() {
        window.removeEventListener('focus', this.onWindowFocus);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    },
    methods: {
        patchSalaryForm(partial) {
            Object.assign(this.form, partial);
        },
        onWindowFocus() {
            if (this.previewLoading || this.loading) {
                return;
            }
            this.loadAccrualPreview();
        },
        onVisibilityChange() {
            if (document.visibilityState !== 'visible') {
                return;
            }
            this.onWindowFocus();
        },
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
        salaryPreviewRowClass(item) {
            return item._isSalaryPreviewTotal
                ? 'bg-gray-50 font-semibold dark:bg-[var(--surface-muted)]'
                : '';
        },
        previewItemMapper(item, column) {
            if (item._isSalaryPreviewTotal) {
                if (column === 'name') {
                    return this.$t('total');
                }
                if (column === 'proratedSalary') {
                    return this.formatAmount(item.proratedSalary, item.currencySymbol);
                }
                if (column === 'total') {
                    return this.previewTotalsDisplay;
                }
                return '';
            }
            if (column === 'name') {
                return item.name;
            }
            if (column === 'salaryPick' || column === 'balancePick') {
                return '';
            }
            if (PREVIEW_TX_KINDS.includes(column)) {
                return Number(item[column]);
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
                props: (item) => {
                    if (item._isSalaryPreviewTotal) {
                        const sum = this.previewItems.reduce((s, r) => s + Number(r[kind]), 0);
                        const sym = this.previewItems[0].currencySymbol;
                        return {
                            kind,
                            amount: sum,
                            currencySymbol: sym,
                            transactions: [],
                            detailTitle: '',
                            onOpen: () => {},
                        };
                    }
                    return {
                        kind,
                        amount: Number(item[kind]),
                        currencySymbol: item.currencySymbol,
                        transactions: item[`${kind}Transactions`],
                        detailTitle: this.adjustmentDetailTitle(item, kind),
                        onOpen: () => this.openAdjustmentDetail(item, kind),
                    };
                },
            };
        },
        openAdjustmentDetail(item, kind) {
            const txs = item[`${kind}Transactions`];
            if (!txs.length) {
                return;
            }
            this.adjustmentDetailModal = {
                open: true,
                kind,
                employeeName: item.name,
                transactions: txs,
                currencySymbol: item.currencySymbol,
            };
        },
        closeAdjustmentDetail() {
            this.adjustmentDetailModal.open = false;
            this.adjustmentDetailModal.transactions = [];
        },
        formatSalaryAdjustmentTxLine(tx, currencySymbol) {
            const sym = currencySymbol;
            const id = tx.id != null ? `#${tx.id} ` : '';
            const d = formatShortDateOrDash(tx.date);
            const a = this.formatAmount(tx.origAmount, sym);
            const typ = this.txTypeLabel(tx.type);
            const note = tx.note;
            const base = `${id}${d} · ${a} · ${typ}`;
            return note ? `${base} · ${note}` : base;
        },
        formatAdjustmentTransactionLine(tx) {
            return this.formatSalaryAdjustmentTxLine(tx, this.adjustmentDetailModal.currencySymbol);
        },
        adjustmentDetailTitle(item, kind) {
            const txs = item[`${kind}Transactions`];
            if (!txs.length) {
                return '';
            }
            const sym = item.currencySymbol;
            return txs.map((tx) => this.formatSalaryAdjustmentTxLine(tx, sym)).join('\n');
        },
        buildPreviewNormColumn() {
            return {
                name: 'officialWorkingDaysNorm',
                label: 'officialWorkingDaysNorm',
                component: markRaw(SalaryPreviewNormCell),
                props: (item) => {
                    if (item._isSalaryPreviewTotal) {
                        return {
                            norm: null,
                            onOpen: () => {},
                        };
                    }
                    return {
                        norm: item.officialWorkingDaysNorm,
                        onOpen: () => this.openNormDetail(),
                    };
                },
            };
        },
        openNormDetail() {
            this.normDetailOpen = true;
        },
        closeNormDetail() {
            this.normDetailOpen = false;
        },
        buildPreviewWorkedDaysColumn() {
            return {
                name: 'officialWorkingDaysWorked',
                label: 'officialWorkingDaysWorked',
                component: markRaw(SalaryPreviewWorkedDaysCell),
                props: (item) => {
                    if (item._isSalaryPreviewTotal) {
                        return {
                            worked: null,
                            breakdown: null,
                            onOpen: () => {},
                        };
                    }
                    return {
                        worked: item.officialWorkingDaysWorked,
                        breakdown: item.officialWorkedBreakdown,
                        onOpen: () => this.openWorkedBreakdown(item),
                    };
                },
            };
        },
        openWorkedBreakdown(item) {
            const b = item.officialWorkedBreakdown;
            if (!b) {
                return;
            }
            if (!b.employment_differs_from_month && !b.leave_periods.length) {
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
                    if (item._isSalaryPreviewTotal) {
                        return {
                            selectedValue: null,
                            options: [],
                            disabled: true,
                            plainWhenSingle: true,
                            onSelect: () => {},
                        };
                    }
                    const options = item[cfg.optionsKey];
                    return {
                        selectedValue: item[cfg.selectedKey],
                        options,
                        disabled: !options.length,
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
            const raw = row.salaryOptionsRaw.find((s) => s.id === salaryId);
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
            const salaries = row.salaryOptionsRaw;
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
            const salaryOptionsRaw = Array.isArray(item.salary_options) ? item.salary_options : [];
            const salarySelectOptions = salaryOptionsRaw.map((s) => ({
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
                officialWorkedBreakdown: normalizeOfficialWorkedBreakdown(item.official_worked_breakdown),
                proratedSalary,
                total: this.operationType === 'salaryAccrual'
                    ? proratedSalary
                    : Number(item.total || 0),
                currencySymbol: item.currency_symbol || '',
                salaryOptionsRaw,
                salarySelectOptions,
                balanceOptionsRaw: Array.isArray(item.balance_options) ? item.balance_options : [],
                balanceSelectOptions: [],
                selectedSalaryId: item.selected_employee_salary_id ?? salarySelectOptions[0]?.value ?? null,
                selectedBalanceId: null,
            };
            if (this.operationType === 'salaryPayment') {
                row.advance = Number(item.advance || 0);
                row.penalty = Number(item.penalty || 0);
                row.bonus = Number(item.bonus || 0);
                for (const k of PREVIEW_TX_KINDS) {
                    row[`${k}Transactions`] = normalizeSalaryPreviewTransactions(
                        item[`${k}_transactions`],
                    );
                }
            }
            this.pickBalancesForSalary(row);
            return row;
        },
        async loadAccrualPreview() {
            if (!this.form.companyId || !this.normalizedUserIds.length || !this.form.accrualMonth) {
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
                    this.normalizedUserIds,
                    this.form.paymentType,
                    null,
                    this.operationType === 'salaryPayment',
                );
                this.officialNormNonWorking = response.official_norm_non_working;
                this.previewItems = response.items.map((row) => this.mapPreviewResponseItem(row));
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
            } catch {
                this.showNotification(
                    this.$t('error'),
                    this.$t('errorLoadingCashRegisters'),
                    true
                );
            }
        },
        salaryOperationPayload() {
            let date;
            if (this.operationType === 'salaryAccrual') {
                date = this.form.accrualMonth ? `${this.form.accrualMonth}-01` : this.form.date;
            } else if (this.salaryPaymentUsesMonthOnly && this.form.accrualMonth) {
                date = `${this.form.accrualMonth}-01`;
            } else {
                date = this.form.date;
            }
            return {
                companyId: this.form.companyId,
                date,
                cashId: this.form.cashId,
                note: null,
                creatorIds: this.creatorIdsForSalaryFlow,
                paymentType: this.form.paymentType,
            };
        },
        notifySalaryBatchResult(body, headlineKey, treatErrorsAsFailure) {
            const data = body?.data ?? body;
            const successCount = data.summary?.success || 0;
            const skippedCount = data.summary?.skipped || 0;
            const errorCount = data.summary?.errors || 0;
            let message = `${this.$t(headlineKey)}: ${successCount}`;
            if (skippedCount > 0) {
                message += `, ${this.$t('skipped')}: ${skippedCount}`;
            }
            if (errorCount > 0) {
                message += `, ${this.$t('errors')}: ${errorCount}`;
            }
            const isError = treatErrorsAsFailure && errorCount > 0;
            this.showNotification(
                isError ? this.$t('error') : this.$t('success'),
                message,
                isError
            );
        },
        async handleAccrue() {
            try {
                const payload = this.salaryOperationPayload();
                const checkResult = await CompaniesController.checkExistingSalaries(
                    this.form.companyId,
                    payload.date,
                    payload.creatorIds,
                    payload.paymentType
                );
                if (checkResult.hasExisting && checkResult.affectedUsers.length > 0) {
                    const month = new Intl.DateTimeFormat(this.$i18n?.locale || undefined, {
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                    }).format(new Date(payload.date));
                    const userNames = checkResult.affectedUsers
                        .map((u) => u.name)
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
                this.notifySalaryBatchResult(body, 'accrued', false);
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
                    ...this.salaryOperationPayload(),
                    items: this.buildAccrueItemsPayload(),
                });
                const body = result?.data ?? result;
                this.notifySalaryBatchResult(body, 'completed', true);
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

            if (this.operationType === 'salaryAccrual') {
                await this.handleAccrue();
                return;
            }

            if (this.operationType === 'salaryPayment') {
                await this.performPay();
                return;
            }

            this.showNotification(
                this.$t('error'),
                this.$t('salaryUnknownOperationType'),
                true
            );
        },
        getModalTitle() {
            return salaryAccrualSideModalTitle(this.$t.bind(this), {
                operationType: this.operationType,
                forAllActiveEmployees: this.forAllActiveEmployees,
                count: this.modalAffectedCount,
            });
        },
    }
};
</script>
