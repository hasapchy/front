<template>
  <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 shadow-md dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
    <h2 class="mb-4 text-lg font-semibold text-[var(--text-primary)]">
      {{ $t('reports') }}
    </h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <router-link
        v-for="report in visibleReportLinks"
        :key="report.path"
        :to="report.path"
        class="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-sm transition-all hover:border-[var(--nav-accent)] hover:shadow-md dark:hover:shadow-none"
      >
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--nav-accent)_12%,var(--surface-muted))] text-[var(--nav-accent)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-muted))]">
          <i
            :class="report.icon"
            class="text-xl"
          />
        </div>
        <span class="font-medium text-[var(--text-primary)]">{{ $t(report.label) }}</span>
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    data() {
        return {
            reportLinks: [
                { path: '/reports/income-by-categories', icon: 'fas fa-arrow-up-wide-short', label: 'incomesByCategory', permission: 'reports_view_by_categories' },
                { path: '/reports/expense-by-categories', icon: 'fas fa-arrow-down-wide-short', label: 'expensesByCategory', permission: 'reports_view_by_categories' },
                { path: '/reports/cashflow', icon: 'fas fa-chart-line', label: 'ddsReport', permission: 'reports_view_by_categories' },
                { path: '/reports/counterparties', icon: 'fas fa-users', label: 'counterpartiesReport', permission: 'reports_view_by_categories' },
                { path: '/reports/orders', icon: 'fas fa-file-invoice', label: 'ordersReport', permission: 'reports_view_by_categories' },
                { path: '/reports/contracts', icon: 'fas fa-file-signature', label: 'contractsReport', permission: 'reports_view_by_categories' },
                { path: '/reports/plan-fact', icon: 'fas fa-layer-group', label: 'planFactBlueprint', permission: 'reports_view_by_categories' }
            ]
        };
    },
    computed: {
        ...mapGetters(['hasPermission']),
        visibleReportLinks() {
            return this.reportLinks.filter((report) => this.hasPermission(report.permission));
        }
    }
};
</script>
