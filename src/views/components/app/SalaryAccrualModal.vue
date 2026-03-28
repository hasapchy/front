<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-col overflow-auto flex-1 p-4">
      <h2 class="text-lg font-bold mb-4">
        {{ getModalTitle() }}
      </h2>

      <div class="space-y-4 flex-1">
        <div v-if="operationType === 'salaryAccrual' || salaryPaymentUsesMonthOnly">
          <label class="required">{{ $t('salaryAccrualMonth') }}</label>
          <input
            v-model="form.accrualMonth"
            type="month"
            required
          >
        </div>

        <div v-if="isSalaryFlow">
          <label class="required">{{ $t('salaryPaymentType') }}</label>
          <select
            v-model.number="form.paymentType"
            required
          >
            <option :value="0">
              {{ $t('salaryPaymentTypeNonCash') }}
            </option>
            <option :value="1">
              {{ $t('salaryPaymentTypeCash') }}
            </option>
          </select>
        </div>

        <div>
          <label class="required">{{ $t('cashRegister') }}</label>
          <select
            v-model="form.cashId"
            required
            :disabled="!form.companyId || loading || !cashRegistersForForm.length"
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

        <div v-if="operationType === 'salaryPayment' && !salaryPaymentUsesMonthOnly">
          <label class="required">{{ $t('date') }}</label>
          <input
            v-model="form.date"
            type="datetime-local"
            step="60"
            required
            :disabled="loading"
          >
        </div>

        <div v-if="operationType && !isSalaryFlow">
          <label class="required">{{ $t('amount') }}</label>
          <input
            v-model="form.amount"
            type="number"
            step="0.01"
            min="0"
            required
            :disabled="loading"
          >
        </div>

        <div v-if="operationType && !isSalaryFlow">
          <label>{{ $t('note') }}</label>
          <textarea
            v-model="form.note"
            :placeholder="$t('salaryAccrualNotePlaceholder')"
            rows="3"
            class="w-full"
            maxlength="255"
          />
        </div>

        <div v-if="isSalaryFlow">
          <div class="font-semibold mb-2">
            {{ $t('salaryAccrualPreview') }}
          </div>
          <div
            v-if="previewLoading"
            class="px-3 py-3 text-center text-gray-500 border rounded"
          >
            {{ $t('loading') }}
          </div>
          <DraggableTable
            v-else
            table-key="salary.accrual.preview"
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
        v-if="adjustmentBreakdown.open"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
        @click.self="closeAdjustmentBreakdown"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="px-4 py-3 border-b border-gray-200 font-semibold text-sm shrink-0">
            {{ adjustmentBreakdownTitle }}
          </div>
          <div class="overflow-auto p-4 flex-1 min-h-0">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-left font-medium px-2 py-2 border border-gray-200">
                    {{ $t('date') }}
                  </th>
                  <th class="text-left font-medium px-2 py-2 border border-gray-200">
                    {{ $t('id') }}
                  </th>
                  <th class="text-left font-medium px-2 py-2 border border-gray-200">
                    {{ $t('createdAt') }}
                  </th>
                  <th class="text-left font-medium px-2 py-2 border border-gray-200">
                    {{ $t('transactionType') }}
                  </th>
                  <th class="text-right font-medium px-2 py-2 border border-gray-200">
                    {{ $t('amount') }}
                  </th>
                  <th class="text-left font-medium px-2 py-2 border border-gray-200">
                    {{ $t('note') }}
                  </th>
                  <th class="text-center font-medium px-2 py-2 border border-gray-200 w-28" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tx in adjustmentBreakdown.transactions"
                  :key="tx.id"
                >
                  <td class="px-2 py-2 border border-gray-200 whitespace-nowrap">
                    {{ formatBreakdownDate(tx.date) }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 whitespace-nowrap">
                    {{ tx.id }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 whitespace-nowrap">
                    {{ formatBreakdownDate(tx.created_at ?? tx.createdAt, true) }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 whitespace-nowrap">
                    {{ txTypeLabel(tx.type) }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 text-right whitespace-nowrap">
                    {{ formatAmount(tx.orig_amount ?? tx.origAmount, adjustmentBreakdown.currencySymbol) }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 break-words max-w-[200px]">
                    {{ tx.note || '—' }}
                  </td>
                  <td class="px-2 py-2 border border-gray-200 text-center">
                    <router-link
                      class="text-[#337AB7] underline"
                      :to="{ name: 'TransactionView', params: { id: Number(tx.id) } }"
                      @click="closeAdjustmentBreakdown"
                    >
                      {{ $t('salaryPreviewOpenTx') }}
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-2 border-t border-gray-200 shrink-0 text-right">
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              @click="closeAdjustmentBreakdown"
            >
              {{ $t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <div class="mt-4 p-4 flex justify-start bg-[#edf4fb]">
      <PrimaryButton
        :onclick="handleOperation"
        :is-loading="loading"
        :is-success="true"
        :disabled="!isFormValid"
        icon="fas fa-save"
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
            adjustmentBreakdown: {
                open: false,
                employeeName: '',
                kind: 'advance',
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
            cols.push(
                { name: 'salary', label: 'salary' },
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
        adjustmentBreakdownTitle() {
            if (!this.adjustmentBreakdown.open) {
                return '';
            }
            const labels = {
                advance: this.$t('advance'),
                penalty: this.$t('penalty'),
                bonus: this.$t('bonus'),
            };
            const k = this.adjustmentBreakdown.kind;
            return `${this.adjustmentBreakdown.employeeName} — ${labels[k] || ''}`;
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
                    onOpen: () => this.openAdjustmentBreakdown(item, kind),
                }),
            };
        },
        openAdjustmentBreakdown(item, kind) {
            const txs = item[`${kind}Transactions`] || [];
            if (!txs.length) {
                return;
            }
            this.adjustmentBreakdown = {
                open: true,
                employeeName: item.name,
                kind,
                transactions: txs,
                currencySymbol: item.currencySymbol || '',
            };
        },
        closeAdjustmentBreakdown() {
            this.adjustmentBreakdown.open = false;
            this.adjustmentBreakdown.transactions = [];
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
                row.currencySymbol = raw.currency_symbol || '';
                row.total = row.salary + row.bonus - row.penalty - row.advance;
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
            const filtered = cid == null
                ? []
                : (row.balanceOptionsRaw || []).filter((b) => Number(b.currency_id) === Number(cid));
            row.balanceSelectOptions = filtered.map((b) => ({
                value: b.id,
                label: b.label || String(b.id),
            }));
            row.selectedBalanceId = filtered.find((b) => b.is_default)?.id ?? filtered[0]?.id ?? null;
        },
        mapPreviewResponseItem(item) {
            const salarySelectOptions = (item.salary_options || []).map((s) => ({
                value: s.id,
                label: s.label,
            }));
            const row = {
                id: item.creator_id,
                creatorId: item.creator_id,
                name: item.creator?.name || `ID: ${item.creator_id}`,
                salary: Number(item.salary || 0),
                advance: Number(item.advance || 0),
                penalty: Number(item.penalty || 0),
                bonus: Number(item.bonus || 0),
                total: Number(item.total || 0),
                currencySymbol: item.currency_symbol || '',
                salaryOptionsRaw: item.salary_options || [],
                salarySelectOptions,
                balanceOptionsRaw: item.balance_options || [],
                balanceSelectOptions: [],
                selectedSalaryId: item.selected_employee_salary_id ?? salarySelectOptions[0]?.value ?? null,
                selectedBalanceId: null,
            };
            for (const k of PREVIEW_TX_KINDS) {
                row[`${k}Transactions`] = item[`${k}_transactions`] || [];
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
            try {
                const previewDate = `${this.form.accrualMonth}-01`;
                const response = await CompaniesController.getSalaryAccrualPreview(
                    this.form.companyId,
                    previewDate,
                    this.userIds,
                    this.form.paymentType
                );
                const items = response?.items || [];
                this.previewItems = items.map((row) => this.mapPreviewResponseItem(row));
            } catch (error) {
                this.previewItems = [];
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
