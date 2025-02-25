<template>
    <aside class="w-50 bg-[#282E33] text-white flex-shrink-0 transform transition-transform duration-300">
        <!-- Logo -->


        <div class="shrink-0 flex items-center p-4 justify-center">
            <a href="/">
                <!-- {{ -- @if ($logo) --}}
                <img src="{{ asset('logo.png') }}" alt="Company Logo" class="h-24 w-auto">
                {{ -- @else --}}
                {{ -- < x - application - logo class="block h-9 w-auto fill-current text-gray-800" /> --}}
                {{ -- @endif --}} -->
            </a>
        </div>

        <div class="">
            <h2 class="text-lg font-semibold mb-4 p-2">
                Название компании
            </h2>
            <ul>
                <SidebarLink to="/" icon="fas fa-building mr-2">
                    Моя компания 
                </SidebarLink>
                <SidebarLink to="/transactions" icon="fas fa-coins mr-2">
                    Финансы 
                </SidebarLink>
                <SidebarLink to="/clients" icon="fa-solid fa-user-friends mr-2">
                    Клиенты
                </SidebarLink>
                <SidebarLink to="/projects" icon="fa-solid fa-briefcase mr-2">
                    Проекты
                </SidebarLink>
                <SidebarLink to="/warehouses" icon="fa-solid fa-warehouse mr-2">
                    Склады
                </SidebarLink>
                <SidebarLink to="/components" icon="fa-solid fa-cogs mr-2">
                    Компоненты
                </SidebarLink>
                <li class="mb-2">
                    <a href="#" @click="this.$store.state.settings_open = !this.$store.state.settings_open" id="settings-button" :class="['flex items-center p-2 hover:bg-[#53585C]', this.$store.state.settings_open ? 'bg-[#53585C] border-l-2 border-red-500' : '', 'transition-colors text-sm']">
                        <i class="fas fa-cogs mr-2"></i> Настройки
                    </a>
                </li>

            </ul>
        </div>
    </aside>
</template>

<script>
import SidebarLink from './SidebarLink.vue';

export default {
    components: {
        SidebarLink
    }
}

</script>