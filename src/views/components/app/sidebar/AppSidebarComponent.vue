<template>
    <aside class="w-40 bg-[#282E33] text-white flex-shrink-0 transform transition-transform duration-300">
        <!-- Logo -->


        <div class="shrink-0 flex items-center justify-center">
            <a href="/">
                <img 
                    v-if="settings.company_logo" 
                    :src="settings.company_logo" 
                    alt="Company Logo" 
                    class="h-16 w-auto object-contain"
                />
            </a>
        </div>

        <div class="">
            <ul>
                <SidebarLink to="/" icon="fas fa-building mr-2">
                    {{ settings.company_name }}
                </SidebarLink>

                <SidebarLink v-if="hasPermission('orders_view')" to="/orders" icon="fas fa-cart-arrow-down mr-2">
                    Заказы
                </SidebarLink>

                <SidebarLink v-if="hasPermission('sales_view')" to="/sales" icon="fas fa-shopping-cart mr-2">
                    Продажи
                </SidebarLink>

                <SidebarLink v-if="hasPermission('transactions_view')" to="/transactions" icon="fas fa-coins mr-2">
                    Финансы
                </SidebarLink>

                <SidebarLink v-if="hasPermission('clients_view')" to="/clients" icon="fa-solid fa-user-friends mr-2">
                    Клиенты
                </SidebarLink>

                <SidebarLink v-if="hasPermission('projects_view')" to="/projects" icon="fa-solid fa-briefcase mr-2">
                    Проекты
                </SidebarLink>

                <SidebarLink v-if="hasPermission('warehouses_view')" to="/warehouses" icon="fa-solid fa-warehouse mr-2">
                    Склады
                </SidebarLink>

                <li class="mb-2">
                    <a href="#" @click="$store.state.settings_open = !$store.state.settings_open" id="settings-button"
                        :class="[
                            'flex items-center p-2 hover:bg-[#53585C]',
                            $store.state.settings_open ? 'bg-[#53585C] border-l-2 border-red-500' : '',
                            'transition-colors text-sm'
                        ]">
                        <i class="fas fa-cogs mr-2"></i> Настройки
                    </a>
                </li>
            </ul>
        </div>
    </aside>
</template>

<script>
import SidebarLink from './SidebarLink.vue';
import SettingsController from '@/api/SettingsController';
import { eventBus } from '@/eventBus';

export default {
    components: {
        SidebarLink
    },
    
    data() {
        return {
            settings: {
                company_name: '',
                company_logo: ''
            }
        };
    },
    
    async mounted() {
        await this.loadSettings();
        eventBus.on('settings-updated', this.loadSettings);
    },
    
    beforeUnmount() {
        eventBus.off('settings-updated', this.loadSettings);
    },
    
    computed: {
        hasPermission() {
            return (perm) => this.$store.getters.hasPermission(perm);
        }
    },
    
    methods: {
        async loadSettings() {
            try {
                const data = await SettingsController.getSettings();
                this.settings = data;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }
}
</script>
