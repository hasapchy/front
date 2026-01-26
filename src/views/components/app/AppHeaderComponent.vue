<template>
    <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
        <div class="flex items-center justify-between">
            <!-- Mobile Menu Button -->
            <button @click="toggleMobileMenu"
                class="lg:hidden mr-4 p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="Toggle menu">
                <i class="fas fa-bars text-xl"></i>
            </button>

            <div class="flex items-center gap-4">
                <router-link v-for="tab in binded" :key="tab.path" :to="tab.path"
                    class="flex items-center justify-center gap-2 text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all"
                    :title="tab.name">
                    <i :class="getTabIcon(tab.path)" class="text-lg"></i>
                    <span class="tab-label">{{ tab.name }}</span>
                </router-link>
            </div>

            <div class="flex items-center gap-4">
                <Search v-if="showSearch" />
                <ClearCacheButton />
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
import PrimaryButton from './buttons/PrimaryButton.vue';
import Search from '@/views/components/app/search/Search.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import SoundToggle from './SoundToggle.vue';
import UserProfileDropdown from './UserProfileDropdown.vue';
import ClearCacheButton from './ClearCacheButton.vue';
import MessengerBadge from './MessengerBadge.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        Search,
        LanguageSwitcher,
        CompanySwitcher,
        SoundToggle,
        UserProfileDropdown,
        ClearCacheButton,
        MessengerBadge
    },
    data() {
        const route = useRoute();
        const title = computed(() => route.meta.title ? this.$t(route.meta.title) : this.$t('accountingSystem'));
        const binded = computed(() => {
            if (route.meta.binded) {
                return route.meta.binded
                    .filter(tab => {
                        // Проверяем права доступа для каждого таба
                        const routePermission = this.getRoutePermission(tab.path);
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


    methods: {
        async logout() {
            await AuthController.logout();
            this.$store.state.user = null;
            this.$router.push('/auth/login');
        },

        onLanguageChanged(locale) {
            this.$forceUpdate();
        },

        onCompanyChanged(companyId) {
            this.$forceUpdate();
        },

        getRoutePermission(path) {
            // Маппинг путей к правам доступа (используем названия из PermissionsSeeder)
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
                '/mutual-settlements': 'mutual_settlements_view',
                '/transfers': 'transfers_view',
                '/cash-registers': 'cash_registers_view',
                '/invoices': 'invoices_view',
                '/products': 'products_view',
                '/services': 'products_view',
                '/warehouses': 'warehouse_stocks_view',
                '/admin/warehouses': 'warehouses_view'
            };
            return permissionMap[path];
        },
        getTabIcon(path) {
            const iconMap = {
                '/orders': 'fas fa-clipboard-list',
                '/order_statuses': 'fas fa-sitemap',
                '/order_status_categories': 'fas fa-layer-group',
                '/transactions': 'fas fa-money-check-alt',
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
                '/categories': 'fas fa-tags',
                '/warehouses': 'fas fa-box',
                '/admin/warehouses': 'fas fa-warehouse'
            };
            return iconMap[path] || 'fas fa-circle';
        },
        toggleMobileMenu() {
            eventBus.emit('toggleMobileMenu');
        }
    },

    computed: {
        displayTitle() {
            // Если мы на главной странице, показываем "Моя компания"
            if (this.$route.path === '/') {
                return this.$t('myCompany');
            }
            return this.title;
        },
        currentCompany() {
            return this.$store.getters.currentCompany;
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