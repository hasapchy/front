<template>
    <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('reports') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <router-link
                v-for="report in visibleReportLinks"
                :key="report.path"
                :to="report.path"
                class="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-[#337AB7] hover:shadow transition-all">
                <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 text-[#337AB7] shrink-0">
                    <i :class="report.icon" class="text-xl"></i>
                </div>
                <span class="font-medium text-gray-800">{{ $t(report.label) }}</span>
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
                { path: '/reports/expense-by-categories', icon: 'fas fa-arrow-down-wide-short', label: 'expensesByCategory', permission: 'reports_view_by_categories' }
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
