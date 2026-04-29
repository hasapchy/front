<template>
  <div>
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <FiltersContainer
        :has-active-filters="hasActiveFilters"
        :active-filters-count="getActiveFiltersCount()"
        @reset="resetFilters"
        @apply="applyFilters"
      >
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
          <select
            v-model="dateFilter"
            class="w-full"
          >
            <option value="all_time">
              {{ $t('allTime') }}
            </option>
            <option value="today">
              {{ $t('today') }}
            </option>
            <option value="yesterday">
              {{ $t('yesterday') }}
            </option>
            <option value="this_week">
              {{ $t('thisWeek') }}
            </option>
            <option value="this_month">
              {{ $t('thisMonth') }}
            </option>
            <option value="last_week">
              {{ $t('lastWeek') }}
            </option>
            <option value="last_month">
              {{ $t('lastMonth') }}
            </option>
            <option value="custom">
              {{ $t('selectDates') }}
            </option>
          </select>
        </div>
        <div
          v-if="dateFilter === 'custom'"
          class="space-y-2"
        >
          <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full"
            >
          </div>
          <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full"
            >
          </div>
        </div>
        <div>
          <label class="block mb-2 text-xs font-semibold">{{ $t('category') }}</label>
          <select
            v-model="categoryId"
            class="w-full"
          >
            <option value="">
              {{ $t('allCategoriesFilter') }}
            </option>
            <option
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ translateTransactionCategory(cat.name, $t) || cat.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="inline-flex items-center text-xs font-semibold mt-4">
            <input
              v-model="compareEnabled"
              type="checkbox"
              class="mr-2"
            >
            {{ $t('compareWithPeriod') }}
          </label>
        </div>
        <template v-if="compareEnabled">
          <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }} ({{ $t('compare') }})</label>
            <select
              v-model="compareDateFilter"
              class="w-full"
            >
              <option value="all_time">
                {{ $t('allTime') }}
              </option>
              <option value="today">
                {{ $t('today') }}
              </option>
              <option value="yesterday">
                {{ $t('yesterday') }}
              </option>
              <option value="this_week">
                {{ $t('thisWeek') }}
              </option>
              <option value="this_month">
                {{ $t('thisMonth') }}
              </option>
              <option value="last_week">
                {{ $t('lastWeek') }}
              </option>
              <option value="last_month">
                {{ $t('lastMonth') }}
              </option>
              <option value="custom">
                {{ $t('selectDates') }}
              </option>
            </select>
          </div>
          <div
            v-if="compareDateFilter === 'custom'"
            class="space-y-2"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
              <input
                v-model="compareStartDate"
                type="date"
                class="w-full"
              >
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
              <input
                v-model="compareEndDate"
                type="date"
                class="w-full"
              >
            </div>
          </div>
        </template>
      </FiltersContainer>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-600">{{ $t('reportCurrency') }}</span>
        <button
          v-for="opt in currencyOptions"
          :key="opt.value"
          type="button"
          class="px-3 py-2 rounded border text-sm transition-colors"
          :class="currencyMode === opt.value ? 'bg-[#337AB7] text-white border-[#337AB7]' : 'bg-white border-gray-400 hover:border-gray-500'"
          @click="currencyMode = opt.value; fetchReport()"
        >
          {{ $t(opt.label) }}
          <span v-if="opt.value === 'report' && reportCurrencySymbol"> ({{ reportCurrencySymbol }})</span>
          <span v-else-if="opt.value === 'default' && defaultCurrencySymbol"> ({{ defaultCurrencySymbol }})</span>
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="min-h-64"
    >
      <ReportByCategoriesSkeleton />
    </div>
    <template v-else-if="reportData">
      <div
        v-if="reportMode === 'income'"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-1">
            {{ $t('incomesByCategory') }}
          </h3>
          <div class="text-xs text-gray-600 mb-2">
            {{ $t('total') }}:
            <span class="font-semibold">
              {{ formatNumber(incomeTotal, 2, true) }}
              {{ currentCurrencySymbol }}
            </span>
          </div>
          <div class="h-80 sm:h-96 flex items-center justify-center">
            <span
              v-if="!incomeChartData.datasets[0].data.length"
              class="text-gray-500"
            >{{ $t('noData') }}</span>
            <Pie
              v-else
              :data="incomeChartData"
              :options="chartOptions"
              class="w-full h-full"
            />
          </div>
        </div>
        <div
          v-if="compareEnabled"
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          <h3 class="text-sm font-semibold text-gray-800 mb-1">
            {{ $t('incomesByCategory') }} ({{ $t('compare') }})
          </h3>
          <div class="text-xs text-gray-600 mb-2">
            {{ $t('total') }}:
            <span class="font-semibold">
              {{ formatNumber(incomeTotalCompare, 2, true) }}
              {{ currentCurrencySymbol }}
            </span>
          </div>
          <div class="h-80 sm:h-96 flex items-center justify-center">
            <span
              v-if="!incomeChartDataCompare.datasets[0].data.length"
              class="text-gray-500"
            >{{ $t('noData') }}</span>
            <Pie
              v-else
              :data="incomeChartDataCompare"
              :options="chartOptions"
              class="w-full h-full"
            />
          </div>
        </div>
      </div>
      <div
        v-else-if="reportMode === 'expense'"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-1">
            {{ $t('expensesByCategory') }}
          </h3>
          <div class="text-xs text-gray-600 mb-2">
            {{ $t('total') }}:
            <span class="font-semibold">
              {{ formatNumber(expenseTotal, 2, true) }}
              {{ currentCurrencySymbol }}
            </span>
          </div>
          <div class="h-80 sm:h-96 flex items-center justify-center">
            <span
              v-if="!expensesChartData.datasets[0].data.length"
              class="text-gray-500"
            >{{ $t('noData') }}</span>
            <Pie
              v-else
              :data="expensesChartData"
              :options="chartOptions"
              class="w-full h-full"
            />
          </div>
        </div>
        <div
          v-if="compareEnabled"
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          <h3 class="text-sm font-semibold text-gray-800 mb-1">
            {{ $t('expensesByCategory') }} ({{ $t('compare') }})
          </h3>
          <div class="text-xs text-gray-600 mb-2">
            {{ $t('total') }}:
            <span class="font-semibold">
              {{ formatNumber(expenseTotalCompare, 2, true) }}
              {{ currentCurrencySymbol }}
            </span>
          </div>
          <div class="h-80 sm:h-96 flex items-center justify-center">
            <span
              v-if="!expensesChartDataCompare.datasets[0].data.length"
              class="text-gray-500"
            >{{ $t('noData') }}</span>
            <Pie
              v-else
              :data="expensesChartDataCompare"
              :options="chartOptions"
              class="w-full h-full"
            />
          </div>
        </div>
      </div>

      <div
        v-if="compareEnabled"
        class="flex flex-wrap items-center gap-4 mb-2 text-xs text-gray-600"
      >
        <span class="inline-flex items-center gap-1.5">
          <i class="fas fa-calendar-alt text-[#337AB7]" />
          {{ $t('reportMainPeriod') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <i class="fas fa-balance-scale text-gray-500" />
          {{ $t('compare') }}
        </span>
      </div>

      <div
        v-if="reportData && tableRows.length > 0"
        class="flex flex-wrap items-center gap-2 mb-2"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
          @click="exportTableToCsv"
        >
          <i class="fas fa-download" />
          {{ $t('reportExportTable') }}
        </button>
      </div>

      <div
        v-if="reportData && tableRows.length === 0"
        class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]"
      >
        <p class="mb-3 text-gray-600 dark:text-[var(--text-secondary)]">
          {{ $t('reportEmptyHint') }}
        </p>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-[#337AB7] rounded hover:opacity-90"
          @click="resetFilters"
        >
          {{ $t('reportResetFilters') }}
        </button>
      </div>

      <DraggableTable
        v-if="reportData && tableRows.length > 0"
        table-key="reports.by_categories"
        :columns-config="tableColumns"
        :table-data="tableRows"
        :item-mapper="itemMapper"
      />
    </template>
  </div>
</template>

<script>
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie } from 'vue-chartjs';
import ReportsController from '@/api/ReportsController';
import TransactionCategoryController from '@/api/TransactionCategoryController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import ReportByCategoriesSkeleton from '@/views/components/reports/ReportByCategoriesSkeleton.vue';
import notificationMixin from '@/mixins/notificationMixin';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { formatNumber } from '@/utils/numberUtils';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const CHART_COLORS = [
    '#337AB7', '#5cb85c', '#f0ad4e', '#d9534f', '#5bc0de',
    '#8e44ad', '#e74c3c', '#1abc9c', '#3498db', '#9b59b6'
];

import listQueryMixin from '@/mixins/listQueryMixin';
export default {
    components: { Pie, DraggableTable, FiltersContainer, ReportByCategoriesSkeleton },
    mixins: [notificationMixin, listQueryMixin],
    data() {
        return {
            loading: false,
            reportData: null,
            reportCompareData: null,
            dateFilter: 'this_month',
            startDate: null,
            endDate: null,
            compareEnabled: false,
            compareDateFilter: 'this_month',
            compareStartDate: null,
            compareEndDate: null,
            currencyMode: 'report',
            currencyOptions: [
                { value: 'report', label: 'currencyReport' },
                { value: 'default', label: 'currencyDefault' }
            ],
            categoryId: '',
            categories: [],
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    datalabels: {
                        color: '#ffffff',
                        font: { size: 10 },
                        formatter: (value, ctx) => {
                            const data = ctx.chart.data.datasets[0].data || [];
                            const total = data.reduce((sum, v) => sum + (v || 0), 0);
                            if (!total) {
                                return '';
                            }
                            const percent = (value / total) * 100;
                            return percent >= 5 ? `${percent.toFixed(1)}%` : '';
                        }
                    }
                }
            }
        };
    },
    computed: {
        reportFiltersStorageKey() {
            return this.$storageUi.LS_KEYS.reportByCategoriesFilters;
        },
        reportMode() {
            return this.$route.meta.reportMode || 'both';
        },
        tableColumns() {
            const base = [
                { name: 'categoryName', label: 'category', html: true },
                { name: 'amount', label: 'amount', html: true }
            ];
            if (this.compareEnabled) {
                base.push({ name: 'change', label: 'reportChange', html: true });
            }
            base.push({ name: 'share', label: 'share' });
            return base;
        },
        categoryColorMaps() {
            const toNames = (rows) => (rows || []).map((r) => r.categoryName).filter(Boolean);
            const buildMap = (names) => {
                const map = new Map();
                Array.from(new Set(names))
                    .sort((a, b) => String(a).localeCompare(String(b)))
                    .forEach((name, idx) => {
                        map.set(name, CHART_COLORS[idx % CHART_COLORS.length]);
                    });
                return map;
            };

            const incomeNames = [
                ...toNames(this.reportData?.income),
                ...toNames(this.reportCompareData?.income),
            ];
            const expenseNames = [
                ...toNames(this.reportData?.expenses),
                ...toNames(this.reportCompareData?.expenses),
            ];

            return {
                income: buildMap(incomeNames),
                expenses: buildMap(expenseNames),
            };
        },
        currencies() {
            return this.$store.getters.currencies || [];
        },
        defaultCurrencySymbol() {
            const currency = this.currencies.find(c => c.isDefault || c.isDefault);
            return currency ? currency.symbol : '';
        },
        reportCurrencySymbol() {
            const currency = this.currencies.find(c => c.isReport || c.isReport);
            return currency ? currency.symbol : this.defaultCurrencySymbol;
        },
        currentCurrencySymbol() {
            return this.currencyMode === 'report'
                ? this.reportCurrencySymbol
                : this.defaultCurrencySymbol;
        },
        incomeChartData() {
            const list = this.reportData?.income ?? [];
            return {
                labels: list.map((i) => translateTransactionCategory(i.categoryName, this.$t) || i.categoryName),
                datasets: [{
                    data: list.map((i) => i.amount),
                    backgroundColor: list.map((i) => this.categoryColorMaps.income.get(i.categoryName) || CHART_COLORS[0])
                }]
            };
        },
        expensesChartData() {
            const list = this.reportData?.expenses ?? [];
            return {
                labels: list.map((i) => translateTransactionCategory(i.categoryName, this.$t) || i.categoryName),
                datasets: [{
                    data: list.map((i) => i.amount),
                    backgroundColor: list.map((i) => this.categoryColorMaps.expenses.get(i.categoryName) || CHART_COLORS[0])
                }]
            };
        },
        incomeChartDataCompare() {
            const list = this.reportCompareData?.income ?? [];
            return {
                labels: list.map((i) => translateTransactionCategory(i.categoryName, this.$t) || i.categoryName),
                datasets: [{
                    data: list.map((i) => i.amount),
                    backgroundColor: list.map((i) => this.categoryColorMaps.income.get(i.categoryName) || CHART_COLORS[0])
                }]
            };
        },
        expensesChartDataCompare() {
            const list = this.reportCompareData?.expenses ?? [];
            return {
                labels: list.map((i) => translateTransactionCategory(i.categoryName, this.$t) || i.categoryName),
                datasets: [{
                    data: list.map((i) => i.amount),
                    backgroundColor: list.map((i) => this.categoryColorMaps.expenses.get(i.categoryName) || CHART_COLORS[0])
                }]
            };
        },
        incomeStats() {
            const list = this.reportData?.income ?? [];
            const total = list.reduce((sum, row) => sum + (row.amount || 0), 0);
            return list.map((row) => {
                const shareValue = total > 0 ? (row.amount / total) * 100 : 0;
                return {
                    ...row,
                    categoryLabel: translateTransactionCategory(row.categoryName, this.$t) || row.categoryName,
                    shareValue,
                    shareLabel: total > 0 ? `${shareValue.toFixed(1)}%` : '0%'
                };
            });
        },
        expenseStats() {
            const list = this.reportData?.expenses ?? [];
            const total = list.reduce((sum, row) => sum + (row.amount || 0), 0);
            return list.map((row) => {
                const shareValue = total > 0 ? (row.amount / total) * 100 : 0;
                return {
                    ...row,
                    categoryLabel: translateTransactionCategory(row.categoryName, this.$t) || row.categoryName,
                    shareValue,
                    shareLabel: total > 0 ? `${shareValue.toFixed(1)}%` : '0%'
                };
            });
        },
        incomeFootnotes() {
            return this.incomeStats.filter((row) => row.shareValue >= 5);
        },
        expenseFootnotes() {
            return this.expenseStats.filter((row) => row.shareValue >= 5);
        },
        incomeTotal() {
            return this.incomeStats.reduce((sum, row) => sum + (row.amount || 0), 0);
        },
        expenseTotal() {
            return this.expenseStats.reduce((sum, row) => sum + (row.amount || 0), 0);
        },
        incomeTotalCompare() {
            if (!this.reportCompareData) {
                return 0;
            }
            const list = this.reportCompareData.income || [];
            return list.reduce((sum, row) => sum + (row.amount || 0), 0);
        },
        expenseTotalCompare() {
            if (!this.reportCompareData) {
                return 0;
            }
            const list = this.reportCompareData.expenses || [];
            return list.reduce((sum, row) => sum + (row.amount || 0), 0);
        },
        tableRows() {
            if (!this.reportData) {
                return [];
            }

            let compareMap = null;
            if (this.compareEnabled && this.reportCompareData) {
                compareMap = new Map();
                const incomeCompare = this.reportCompareData.income || [];
                const expensesCompare = this.reportCompareData.expenses || [];
                incomeCompare.forEach((row) => {
                    compareMap.set(`1|${row.categoryName}`, row.amount || 0);
                });
                expensesCompare.forEach((row) => {
                    compareMap.set(`0|${row.categoryName}`, row.amount || 0);
                });
            }

            const income = this.reportMode !== 'expense'
                ? this.incomeStats.map((row) => {
                    const type = 1;
                    const key = `1|${row.categoryName}`;
                    const amountCompare = compareMap ? (compareMap.get(key) ?? null) : null;
                    const categoryColor = this.categoryColorMaps.income.get(row.categoryName) || '#9ca3af';
                    return {
                        ...row,
                        typeLabel: 'income',
                        type,
                        amountCompare,
                        categoryColor
                    };
                })
                : [];

            const expenses = this.reportMode !== 'income'
                ? this.expenseStats.map((row) => {
                    const type = 0;
                    const key = `0|${row.categoryName}`;
                    const amountCompare = compareMap ? (compareMap.get(key) ?? null) : null;
                    const categoryColor = this.categoryColorMaps.expenses.get(row.categoryName) || '#9ca3af';
                    return {
                        ...row,
                        typeLabel: 'outcome',
                        type,
                        amountCompare,
                        categoryColor
                    };
                })
                : [];

            const all = [...income, ...expenses];
            const total = all.reduce((sum, row) => sum + (row.amount || 0), 0);

            return all
                .map((row) => {
                    const amount = row.amount || 0;
                    const compare = row.amountCompare ?? null;
                    let changeDelta = null;
                    let changePercent = null;
                    if (this.compareEnabled && compare !== null) {
                        changeDelta = amount - compare;
                        changePercent = compare === 0
                            ? (amount === 0 ? '0%' : '—')
                            : `${((amount - compare) / compare * 100).toFixed(1)}%`;
                    }
                    return {
                        ...row,
                        share: total > 0 ? `${((amount / total) * 100).toFixed(1)}%` : '0%',
                        changeDelta,
                        changePercent
                    };
                })
                .sort((a, b) => parseFloat(b.share) - parseFloat(a.share));
        }
    },
    async created() {
        await this.loadCategories();
        this.restoreFiltersFromStorage();
        this.fetchReport();
    },
    methods: {
        formatNumber,
        translateTransactionCategory,
        async loadCategories() {
            try {
                this.categories = await TransactionCategoryController.getListItems();
            } catch {
                this.categories = [];
            }
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'this_month' },
                { value: this.startDate, defaultValue: null },
                { value: this.endDate, defaultValue: null },
                { value: this.categoryId, defaultValue: '' },
                { value: this.compareEnabled ? this.compareDateFilter : 'this_month', defaultValue: 'this_month' }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFilter: 'this_month',
                startDate: null,
                endDate: null,
                compareDateFilter: 'this_month',
                compareStartDate: null,
                compareEndDate: null,
                compareEnabled: false,
                categoryId: ''
            });
            this.saveFiltersToStorage();
            this.fetchReport();
        },
        applyFilters() {
            this.saveFiltersToStorage();
            this.fetchReport();
        },
        async fetchReport() {
            this.loading = true;
            const categoryIdParam = this.categoryId ? Number(this.categoryId) : null;
            try {
                if (this.compareEnabled) {
                    const [main, compare] = await Promise.all([
                        ReportsController.getByCategories(this.dateFilter, this.startDate, this.endDate, this.currencyMode, categoryIdParam),
                        ReportsController.getByCategories(this.compareDateFilter, this.compareStartDate, this.compareEndDate, this.currencyMode, categoryIdParam)
                    ]);
                    this.reportData = main;
                    this.reportCompareData = compare;
                } else {
                    this.reportData = await ReportsController.getByCategories(this.dateFilter, this.startDate, this.endDate, this.currencyMode, categoryIdParam);
                    this.reportCompareData = null;
                }
            } catch (e) {
                this.showNotification(this.$t('error'), e?.message , true);
            }
            this.loading = false;
        },
        itemMapper(item, column) {
            switch (column) {
                case 'categoryName': {
                    const label = translateTransactionCategory(item.categoryName, this.$t) || item.categoryName;
                    const safe = String(label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                    const attr = String(label).replace(/"/g, '&quot;');
                    const typeLabel = item.typeLabel === 'income' ? this.$t('income') : this.$t('outcome');
                    const color = item.categoryColor || '#9ca3af';
                    return `<span class="inline-flex items-center gap-2"><span class="inline-block w-3 h-3 rounded-full shrink-0" style="background-color:${color}" title="${attr}" role="img" aria-label="${this.$t('category')}: ${attr}, ${typeLabel}"></span><span>${safe}</span></span>`;
                }
                case 'typeLabel':
                    return this.$t(item.typeLabel);
                case 'amount': {
                    const currentValue = `${this.formatNumber(item.amount, 2, true)} ${this.currentCurrencySymbol}`;
                    if (this.compareEnabled && item.amountCompare != null) {
                        const compareValue = `${this.formatNumber(item.amountCompare, 2, true)} ${this.currentCurrencySymbol}`;
                        const baseTitle = (this.$t('reportMainPeriod')).replace(/"/g, '&quot;');
                        const compareTitle = (this.$t('compare')).replace(/"/g, '&quot;');
                        return `<i class="fas fa-calendar-alt text-[#337AB7] mr-1" title="${baseTitle}"></i><span>${currentValue}</span> <span class="text-gray-400 mx-1">/</span> <i class="fas fa-balance-scale text-gray-500 mr-1" title="${compareTitle}"></i><span>${compareValue}</span>`;
                    }
                    return currentValue;
                }
                case 'share':
                    return item.share ?? '0%';
                case 'change': {
                    if (item.changeDelta == null || item.changePercent == null) {
                        return '—';
                    }
                    const deltaStr = this.formatNumber(item.changeDelta, 2, true);
                    const sign = item.changeDelta >= 0 ? '+' : '';
                    const percentEscaped = String(item.changePercent).replace(/</g, '&lt;');
                    return `<span title="${sign}${deltaStr} ${this.currentCurrencySymbol}">${sign}${deltaStr} ${this.currentCurrencySymbol} (${percentEscaped})</span>`;
                }
                default:
                    return item[column];
            }
        },
        saveFiltersToStorage() {
            try {
                const payload = {
                    dateFilter: this.dateFilter,
                    startDate: this.startDate,
                    endDate: this.endDate,
                    compareEnabled: this.compareEnabled,
                    compareDateFilter: this.compareDateFilter,
                    compareStartDate: this.compareStartDate,
                    compareEndDate: this.compareEndDate,
                    currencyMode: this.currencyMode,
                    categoryId: this.categoryId
                };
                localStorage.setItem(this.reportFiltersStorageKey, JSON.stringify(payload));
            } catch {
                void 0;
            }
        },
        restoreFiltersFromStorage() {
            try {
                const raw = localStorage.getItem(this.reportFiltersStorageKey);
                if (!raw) return;
                const data = JSON.parse(raw);
                if (data) {
                    if (data.dateFilter != null) this.dateFilter = data.dateFilter;
                    if (data.startDate != null) this.startDate = data.startDate;
                    if (data.endDate != null) this.endDate = data.endDate;
                    if (data.compareEnabled != null) this.compareEnabled = data.compareEnabled;
                    if (data.compareDateFilter != null) this.compareDateFilter = data.compareDateFilter;
                    if (data.compareStartDate != null) this.compareStartDate = data.compareStartDate;
                    if (data.compareEndDate != null) this.compareEndDate = data.compareEndDate;
                    if (data.currencyMode != null) this.currencyMode = data.currencyMode;
                    if (data.categoryId != null) this.categoryId = data.categoryId;
                }
            } catch {
                void 0;
            }
        },
        exportTableToCsv() {
            const columns = this.tableColumns;
            const headers = columns.map((col) => this.$t(col.label)).join(';');
            const escapeCsv = (val) => {
                const s = String(val ?? '');
                if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                return s;
            };
            const rows = this.tableRows.map((item) => {
                return columns.map((col) => {
                    if (col.name === 'categoryName') {
                        return escapeCsv(translateTransactionCategory(item.categoryName, this.$t) || item.categoryName);
                    }
                    if (col.name === 'amount') {
                        return this.formatNumber(item.amount, 2, false);
                    }
                    if (col.name === 'share') return item.share ?? '0%';
                    if (col.name === 'change') {
                        if (item.changeDelta == null) return '—';
                        const sign = item.changeDelta >= 0 ? '+' : '';
                        return `${sign}${this.formatNumber(item.changeDelta, 2, false)} (${item.changePercent ?? ''})`;
                    }
                    return escapeCsv(item[col.name]);
                }).join(';');
            });
            const csv = '\uFEFF' + [headers, ...rows].join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_categories_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
};
</script>
