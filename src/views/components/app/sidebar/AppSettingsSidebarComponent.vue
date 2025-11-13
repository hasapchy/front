<template>
    <div id="settings-sidebar" :key="$store.getters.permissions.join(',')"
        class="w-50 bg-[#53585C] text-white flex-shrink-0 transform transition-transform duration-300">
        <div>
            <ul v-if="hasPermission('users_view')">
                <SidebarLink to="/users" icon="fa-solid fa-user mr-2" :settings="true">
                    {{ $t('users') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('companies_view')">
                <SidebarLink to="/companies" icon="fa-solid fa-building mr-2" :settings="true">
                    {{ $t('companies') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('cash-registers_view')">
                <SidebarLink to="/cash-registers" icon="fa-solid fa-cash-register mr-2" :settings="true">
                    {{ $t('cashRegisters') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('mutual_settlements_view')">
                <SidebarLink to="/mutual-settlements" icon="fa-solid fa-handshake mr-2" :settings="true">
                    {{ $t('mutualSettlements') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('warehouses_view')">
                <SidebarLink to="/admin/warehouses" icon="fa-solid fa-warehouse mr-2" :settings="true">
                    {{ $t('warehouses') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('categories_view')">
                <SidebarLink to="/categories" icon="fa-solid fa-list-alt mr-2" :settings="true">
                    {{ $t('categories') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('products_view')">
                <SidebarLink to="/products" icon="fa-solid fa-box mr-2" :settings="true">
                    {{ $t('products') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('products_view')">
                <SidebarLink to="/services" icon="fa-solid fa-paint-roller mr-2" :settings="true">
                    {{ $t('services') }}
                </SidebarLink>
            </ul>

            <ul>
                <SidebarLink to="/settings/performance" icon="fa-solid fa-chart-line mr-2" :settings="true">
                    {{ $t('performanceMonitor') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('currency_history_view')">
                <SidebarLink to="/settings/currency-history" icon="fa-solid fa-chart-line mr-2" :settings="true">
                    {{ $t('currencyHistory') }}
                </SidebarLink>
            </ul>
        </div>
    </div>
</template>

<script>
import SidebarLink from './SidebarLink.vue';

export default {
    components: {
        SidebarLink
    },
    computed: {
        hasPermission() {
            return (perm) => this.$store.getters.hasPermission(perm);
        }
    }
}
</script>
