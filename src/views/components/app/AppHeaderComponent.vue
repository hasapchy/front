<template>
    <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
        <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <router-link v-for="tab in binded" :key="tab.path" :to="tab.path"
                        class="text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all mr-4">
                        {{ tab.name }}
                    </router-link>
                </div>

                <div class="flex items-center gap-4">
                    <Search v-if="showSearch" />
                    <ClearCacheButton />
                    <SoundToggle />
                    <CompanySwitcher @company-changed="onCompanyChanged" />
                    <LanguageSwitcher @language-changed="onLanguageChanged" />
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
import { eventBus } from '@/eventBus';

export default {
    components: {
        Search,
        LanguageSwitcher,
        CompanySwitcher,
        SoundToggle,
        UserProfileDropdown,
        ClearCacheButton
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
                '/transaction_categories': 'transaction_categories_view',
                '/transactions': 'transactions_view',
                '/mutual-settlements': 'mutual_settlements_view',
                '/transfers': 'transfers_view',
                '/cash-registers': 'cash_registers_view',
                '/invoices': 'invoices_view',
                '/products': 'products_view',
                '/services': 'products_view'
            };
            return permissionMap[path];
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