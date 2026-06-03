<template>
  <div>
    <div class="mb-4">
      <FiltersContainer
        :has-active-filters="hasActiveFilters"
        :active-filters-count="getActiveFiltersCount()"
        @reset="resetFilters"
        @apply="applyFilters"
      >
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
          <select v-model="dateFilter" class="w-full">
            <option value="this_month">{{ $t('thisMonth') }}</option>
            <option value="this_week">{{ $t('thisWeek') }}</option>
            <option value="today">{{ $t('today') }}</option>
            <option value="custom">{{ $t('selectDates') }}</option>
            <option value="all_time">{{ $t('allTime') }}</option>
          </select>
        </div>
        <div v-if="dateFilter === 'custom'">
          <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
          <input v-model="startDate" type="date" class="w-full">
        </div>
        <div v-if="dateFilter === 'custom'">
          <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
          <input v-model="endDate" type="date" class="w-full">
        </div>
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('groupBy') }}</label>
          <select v-model="groupBy" class="w-full">
            <option value="day">{{ $t('day') }}</option>
            <option value="week">{{ $t('thisWeek') }}</option>
            <option value="month">{{ $t('thisMonth') }}</option>
          </select>
        </div>
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('reportCurrency') }}</label>
          <select v-model="currencyMode" class="w-full">
            <option value="report">{{ $t('currencyReport') }}</option>
            <option value="default">{{ $t('currencyDefault') }}</option>
          </select>
        </div>
      </FiltersContainer>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      <div class="bg-white border rounded p-3">
        <div class="text-xs text-gray-500">{{ $t('openingBalance') }}</div>
        <div class="text-lg font-semibold">{{ formatNumber(report.opening_balance) }}</div>
      </div>
      <div class="bg-white border rounded p-3">
        <div class="text-xs text-gray-500">{{ $t('income') }}</div>
        <div class="text-lg font-semibold text-green-600">{{ formatNumber(report.income_total) }}</div>
      </div>
      <div class="bg-white border rounded p-3">
        <div class="text-xs text-gray-500">{{ $t('expense') }}</div>
        <div class="text-lg font-semibold text-red-600">{{ formatNumber(report.expense_total) }}</div>
      </div>
      <div class="bg-white border rounded p-3">
        <div class="text-xs text-gray-500">{{ $t('closingBalance') }}</div>
        <div class="text-lg font-semibold">{{ formatNumber(report.closing_balance) }}</div>
      </div>
    </div>

    <DraggableTable
      table-key="reports.cashflow"
      :columns-config="columns"
      :table-data="report.periods || []"
      :item-mapper="itemMapper"
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
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
              @click="exportTableToCsv"
            >
              <i class="fas fa-download" />
              {{ $t('reportExportTable') }}
            </button>
          </template>
        </TableControlsBar>
      </template>
    </DraggableTable>
  </div>
</template>

<script>
import ReportsController from '@/api/ReportsController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import notificationMixin from '@/mixins/notificationMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import { formatNumberForDisplay } from '@/utils/numberUtils';

export default {
  components: { DraggableTable, FiltersContainer, TableControlsBar },
  mixins: [notificationMixin, listQueryMixin],
  data() {
    return {
      dateFilter: 'this_month',
      startDate: null,
      endDate: null,
      groupBy: 'month',
      currencyMode: 'report',
      report: { periods: [] },
      columns: [
        { name: 'period', label: 'date' },
        { name: 'income', label: 'income' },
        { name: 'expense', label: 'expense' },
        { name: 'net', label: 'result' },
        { name: 'incoming_transfer', label: 'income' },
        { name: 'outgoing_transfer', label: 'expense' },
        { name: 'closing_balance', label: 'balance' },
      ],
    };
  },
  computed: {
    hasActiveFilters() {
      return this.getActiveFiltersCount() > 0;
    },
  },
  async created() {
    await this.fetchReport();
  },
  methods: {
    formatNumber(value) {
      return formatNumberForDisplay(value || 0, true);
    },
    async fetchReport() {
      try {
        this.report = await ReportsController.getCashflow({
          dateFilterType: this.dateFilter,
          startDate: this.startDate,
          endDate: this.endDate,
          groupBy: this.groupBy,
          currencyMode: this.currencyMode,
        });
      } catch (error) {
        this.showNotification(this.$t('error'), error?.message, true);
      }
    },
    applyFilters() {
      this.fetchReport();
    },
    resetFilters() {
      this.resetFiltersFromConfig({
        dateFilter: 'this_month',
        startDate: null,
        endDate: null,
        groupBy: 'month',
        currencyMode: 'report',
      });
      this.fetchReport();
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.dateFilter, defaultValue: 'this_month' },
        { value: this.startDate, defaultValue: null },
        { value: this.endDate, defaultValue: null },
        { value: this.groupBy, defaultValue: 'month' },
        { value: this.currencyMode, defaultValue: 'report' },
      ]);
    },
    itemMapper(item, column) {
      if (column === 'incoming_transfer') {
        return this.formatNumber(item?.transfers?.incoming || 0);
      }
      if (column === 'outgoing_transfer') {
        return this.formatNumber(item?.transfers?.outgoing || 0);
      }
      if (['income', 'expense', 'net', 'closing_balance'].includes(column)) {
        return this.formatNumber(item[column]);
      }
      return item[column];
    },
    exportTableToCsv() {
      const rows = this.report.periods || [];
      const headers = this.columns.map((col) => this.$t(col.label)).join(';');
      const csvRows = rows.map((row) => {
        const values = [
          row.period,
          row.income,
          row.expense,
          row.net,
          row?.transfers?.incoming || 0,
          row?.transfers?.outgoing || 0,
          row.closing_balance,
        ];
        return values.map((value) => String(value ?? '').replace(/;/g, ',')).join(';');
      });
      const csv = '\uFEFF' + [headers, ...csvRows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cashflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>
