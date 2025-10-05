<template>
    <aside class="w-40 bg-[#282E33] text-white flex-shrink-0 transform transition-transform duration-300 relative">

        <div class="shrink-0 flex items-center justify-center">
            <a href="/">
                <img 
                    v-if="currentCompany?.logo" 
                    :src="currentCompany.logo" 
                    alt="Company Logo" 
                    class="mb-1 w-auto max-h-12"
                    @error="onLogoError"
                />
                <img 
                    v-else
                    src="/logo.jpg" 
                    alt="Default Logo" 
                    class="mb-1 w-auto max-h-12"
                />
            </a>
        </div>

        <div class="pb-32">
            <ul>
                <SidebarLink to="/" icon="fas fa-building mr-2">
                    {{ $t('myCompany') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('orders_view')" to="/orders" icon="fas fa-cart-arrow-down mr-2">
                    {{ $t('orders') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('sales_view')" to="/sales" icon="fas fa-shopping-cart mr-2">
                    {{ $t('sales') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('transactions_view')" to="/transactions" icon="fas fa-coins mr-2">
                    {{ $t('finance') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('clients_view')" to="/clients" icon="fa-solid fa-user-friends mr-2">
                    {{ $t('clients') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('projects_view')" to="/projects" icon="fa-solid fa-briefcase mr-2">
                    {{ $t('projects') }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('warehouses_view')" to="/warehouses" icon="fa-solid fa-warehouse mr-2">
                    {{ $t('warehouses') }}
                </SidebarLink>

                <li class="mb-2">
                    <a href="#" @click="$store.state.settings_open = !$store.state.settings_open" id="settings-button"
                        :class="[
                            'flex items-center p-2 hover:bg-[#53585C]',
                            $store.state.settings_open ? 'bg-[#53585C] border-l-2 border-red-500' : '',
                            'transition-colors text-sm',
                            $store.getters.isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                        ]"
                        :disabled="$store.getters.isLoading">
                        <i class="fas fa-cogs mr-2"></i> {{ $t('settings') }}
                    </a>
                </li>
            </ul>
        </div>
        
        <!-- Логотип и контактная информация внизу -->
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-[#1f2529] border-t border-[#53585c]">
            <div class="text-center">
                <!-- Логотип LTM -->
                <div class="mb-3">
                    <img src="/logo.jpg" alt="LTM Studio" class="h-8 w-auto mx-auto opacity-80">
                </div>
                
                <!-- Название и ссылка -->
                <div class="text-sm text-gray-300 mb-2">
       
                    <div class="text-gray-400">
                        powered by
                        <a href="https://ltm.studio" target="_blank" class="text-blue-400 hover:text-blue-300 transition-colors">
                            LTM
                        </a>
                    </div>
                </div>
                
                <!-- Контактная информация -->
                <div class="text-xs text-gray-400">
                    <a href="mailto:info@ltm.studio" class="hover:text-gray-300 transition-colors">
                        info@ltm.studio
                    </a>
                </div>
            </div>
        </div>
    </aside>
</template>

<script>
import SidebarLink from './SidebarLink.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        SidebarLink
    },
    
    computed: {
        hasPermission() {
            return (perm) => this.$store.getters.hasPermission(perm);
        },
        currentCompany() {
            return this.$store.getters.currentCompany;
        }
    },
    
    methods: {
        onLogoError(event) {
            console.error('Company logo failed to load:', event.target.src);
        }
    }
}
</script>
