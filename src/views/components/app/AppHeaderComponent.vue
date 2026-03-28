<template>
  <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
    <div class="flex items-center justify-between">
      <button
        class="lg:hidden mr-4 p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Toggle menu"
        @click="toggleMobileMenu"
      >
        <i class="fas fa-bars text-xl" />
      </button>

      <div class="flex items-center gap-4">
        <router-link
          v-for="tab in binded"
          :key="tab.path"
          :to="tab.path"
          class="relative flex items-center justify-center gap-2 text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all"
          :title="tab.name"
        >
          <i
            :class="getTabIcon(tab.path)"
            class="text-lg"
          />
          <span class="tab-label">{{ tab.name }}</span>
        </router-link>
      </div>

      <div class="flex items-center gap-4">
        <AppSearch v-if="showSearch" />
        <SoundToggle />
        <CompanySwitcher @company-changed="onCompanyChanged" />
        <LanguageSwitcher @language-changed="onLanguageChanged" />
        <MessengerBadge />
        <UserProfileDropdown v-if="$store.state.user" />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AuthController from '@/api/AuthController';
import AppSearch from '@/views/components/app/search/Search.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import SoundToggle from './SoundToggle.vue';
import UserProfileDropdown from './UserProfileDropdown.vue';
import MessengerBadge from '@/views/components/app/MessengerBadge.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        AppSearch,
        LanguageSwitcher,
        CompanySwitcher,
        SoundToggle,
        UserProfileDropdown,
        MessengerBadge
    },
    data() {
        const route = useRoute();
        const title = computed(() => route.meta.title ? this.$t(route.meta.title) : this.$t('accountingSystem'));
        const binded = computed(() => {
            if (route.meta.binded) {
                return route.meta.binded
                    .filter(tab => {
                        const routePermission = tab.permission || this.getRoutePermission(tab.path);
                        return !routePermission || this.$store.getters.hasPermission(routePermission);
                    })
                    .map(tab => ({
                        ...tab,
                        name: this.$t(tab.name)
                    }));
            }
            return [];
        });
        const showSearch = computed(() => route.meta.showSearch || false);
        return {
            title,
            binded,
            showSearch
        };
    },

    computed: {
        displayTitle() {
            if (this.$route.path === '/') {
                return this.$t('myCompany');
            }
            return this.title;
        },
        currentCompany() {
            return this.$store.getters.currentCompany;
        }
    },


    methods: {
        async logout() {
            await AuthController.logout();
            this.$store.state.user = null;
            this.$router.push('/auth/login');
        },

        onLanguageChanged() {
            this.$forceUpdate();
        },

        onCompanyChanged() {
            this.$forceUpdate();
        },

        getRoutePermission(path) {
            const permissionMap = {
                '/categories': 'categories_view',
                '/order_statuses': 'order_statuses_view',
                '/order_status_categories': 'order_statuscategories_view',
                '/project_statuses': 'project_statuses_view',
                '/projects': 'projects_view',
                '/task_statuses': 'task_statuses_view',
                '/tasks': 'tasks_view',
                '/transaction_categories': 'transaction_categories_view',
                '/transactions': 'transactions_view',
                '/transactions/templates': 'transactions_view',
                '/mutual-settlements': 'mutual_settlements_view',
                '/transfers': 'transfers_view',
                '/cash-registers': 'cash_registers_view',
                '/invoices': 'invoices_view',
                '/products': 'products_view',
                '/services': 'products_view',
                '/warehouses': 'warehouse_stocks_view',
                '/admin/warehouses': 'warehouses_view',
                '/simple-orders': 'orders_simple_view',
                '/org-structure': 'departments_view_all',
                '/roles': 'roles_view',
                '/contracts': 'projects_view',
                '/salaries': 'employee_salaries_accrue',
            };
            return permissionMap[path];
        },
        getTabIcon(path) {
            const iconMap = {
                '/orders': 'fas fa-clipboard-list',
                '/simple-orders': 'fas fa-clipboard-check',
                '/order_statuses': 'fas fa-sitemap',
                '/order_status_categories': 'fas fa-layer-group',
                '/transactions': 'fas fa-money-check-alt',
                '/transactions/templates': 'fas fa-clone',
                '/mutual-settlements': 'fas fa-handshake',
                '/transfers': 'fas fa-exchange-alt',
                '/cash-registers': 'fas fa-cash-register',
                '/invoices': 'fas fa-file-invoice-dollar',
                '/products': 'fas fa-boxes',
                '/services': 'fas fa-concierge-bell',
                '/project_statuses': 'fas fa-project-diagram',
                '/projects': 'fas fa-tasks',
                '/task_statuses': 'fas fa-project-diagram',
                '/tasks': 'fas fa-tasks',
                '/categories': 'fa-solid fa-tags',
                '/warehouses': 'fas fa-box',
                '/admin/warehouses': 'fas fa-warehouse',
                '/org-structure': 'fas fa-sitemap',
                '/roles': 'fas fa-user-shield',
                '/contracts': 'fas fa-file-signature',
                '/salaries': 'fas fa-money-bill-wave',
            };
            return iconMap[path] || 'fas fa-circle';
        },
        toggleMobileMenu() {
            eventBus.emit('toggleMobileMenu');
        }
    }
};
</script>

<style scoped>
@media (max-width: 640px) {
    .tab-label {
        display: none;
    }
}
</style>