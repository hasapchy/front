<template>
    <div id="settings-sidebar" :key="$store.getters.permissions.join(',')"
        class="w-50 bg-[#53585C] text-white flex-shrink-0 transform transition-transform duration-300">
        <div>
            <div class="mb-5"></div>

            <ul v-if="hasPermission('users_view')">
                <SidebarLink to="/users" icon="fa-solid fa-user mr-2" :settings="true">
                    {{ $t('users') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('cash-registers_view')">
                <SidebarLink to="/cash-registers" icon="fa-solid fa-cash-register mr-2" :settings="true">
                    {{ $t('cashRegisters') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('warehousess_view')">
                <SidebarLink to="/admin/warehouses" icon="fa-solid fa-warehouse mr-2" :settings="true">
                    {{ $t('warehouses') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('categories_view')">
                <SidebarLink to="/categories" icon="fa-solid fa-list-alt mr-2" :settings="true">
                    {{ $t('productCategories') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('order_statuses_view')">
                <SidebarLink to="/order_statuses" icon="fa-solid fa-list-alt mr-2" :settings="true">
                    {{ $t('orderStatuses') }}
                </SidebarLink>
            </ul>

            <ul v-if="hasPermission('order_categories_view')">
                <SidebarLink to="/order_categories" icon="fa-solid fa-list-alt mr-2" :settings="true">
                    {{ $t('orderTypes') }}
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

            <ul v-if="hasPermission('system_settings_view')">
                <SidebarLink to="/settings" icon="fa-solid fa-cogs mr-2" :settings="true">
                    {{ $t('systemSettings') }}
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
