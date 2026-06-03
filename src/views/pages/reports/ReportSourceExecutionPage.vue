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
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('reportCurrency') }}</label>
          <select v-model="currencyMode" class="w-full">
            <option value="report">{{ $t('currencyReport') }}</option>
            <option value="default">{{ $t('currencyDefault') }}</option>
          </select>
        </div>
      </FiltersContainer>
    </div>
    <DraggableTable
      :table-key="tableKey"
      :columns-config="columns"
      :table-data="items"
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
      currencyMode: 'report',
      items: [],
      columns: [
        { name: 'source_id', label: 'id' },
        { name: 'client_name', label: 'counterparty' },
        { name: 'contracted_amount', label: 'amount' },
        { name: 'income', label: 'income' },
        { name: 'expense', label: 'expense' },
        { name: 'paid_fact', label: 'paid' },
        { name: 'debt_closing', label: 'closingBalance' },
      ],
    };
  },
  computed: {
    hasActiveFilters() {
      return this.getActiveFiltersCount() > 0;
    },
    reportType() {
      return this.$route.meta?.sourceReportType === 'contracts' ? 'contracts' : 'orders';
    },
    tableKey() {
      return `reports.${this.reportType}`;
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
        const method = this.reportType === 'contracts'
          ? ReportsController.getContracts
          : ReportsController.getOrders;
        const data = await method({
          dateFilterType: this.dateFilter,
          currencyMode: this.currencyMode,
        });
        this.items = data?.items || [];
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
        currencyMode: 'report',
      });
      this.fetchReport();
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.dateFilter, defaultValue: 'this_month' },
        { value: this.currencyMode, defaultValue: 'report' },
      ]);
    },
    itemMapper(item, column) {
      if (['contracted_amount', 'income', 'expense', 'paid_fact', 'debt_closing'].includes(column)) {
        return this.formatNumber(item[column]);
      }
      return item[column];
    },
    exportTableToCsv() {
      const headers = this.columns.map((col) => this.$t(col.label)).join(';');
      const csvRows = (this.items || []).map((row) => {
        const values = this.columns.map((col) => row[col.name] ?? '');
        return values.map((value) => String(value).replace(/;/g, ',')).join(';');
      });
      const csv = '\uFEFF' + [headers, ...csvRows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>
