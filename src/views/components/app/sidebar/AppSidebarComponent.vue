<template>
    <aside class="w-40 bg-[#282E33] text-white flex-shrink-0 transform transition-transform duration-300 relative">

        <div class="shrink-0 flex items-center justify-center py-4">
            <a href="/">
                <img 
                    :src="getCompanyLogo()" 
                    alt="Company Logo" 
                    class="mb-1 w-28 h-28 rounded-full object-cover border-2 border-gray-600 shadow-lg"
                    @error="onLogoError"
                />
            </a>
        </div>

        <div class="pb-32" v-if="permissionsLoaded">
            <ul :key="permissionsKey">
                <SidebarLink to="/" icon="fas fa-building mr-2">
                    {{ currentCompanyName }}
                </SidebarLink>

                <draggable
                    :list="draggableMenuItems"
                    @change="onDragChange"
                    :animation="200"
                    handle=".drag-handle"
                    item-key="id"
                    group="menu-items"
                >
                    <SidebarLink 
                        v-for="element in draggableMenuItems"
                        :key="element.id"
                        :to="element.to" 
                        :icon="element.icon"
                        class="relative group"
                    >
                        <span class="flex items-center justify-between w-full">
                            <span>{{ $t(element.label) }}</span>
                            <i class="fas fa-grip-vertical drag-handle opacity-0 group-hover:opacity-50 cursor-move ml-2 text-xs"></i>
                        </span>
                    </SidebarLink>
                </draggable>

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

                <div class="mt-3 text-[11px] uppercase tracking-wide text-gray-500">
                    версия {{ appVersionLabel }}
                </div>
            </div>
        </div>
    </aside>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import SidebarLink from './SidebarLink.vue';
import { CURRENT_APP_VERSION } from '@/constants/appVersion';

export default {
    components: {
        draggable: VueDraggableNext,
        SidebarLink
    },
    
    data() {
        return {
            draggableMenuItems: []
        };
    },
    computed: {
        currentCompany() {
            return this.$store.getters.currentCompany;
        },
        currentCompanyName() {
            const company = this.currentCompany;
            if (!company || !company.name) {
                return this.$t('myCompany');
            }
            return company.name;
        },
        mainMenuItems() {
            return this.$store.getters.mainMenuItems;
        },
        permissionsKey() {
            const perms = this.$store.state.permissions;
            return Array.isArray(perms) && perms.length > 0 ? perms.join(',') : 'no-permissions';
        },
        permissionsLoaded() {
            if (!this.$store.state.user) {
                return true;
            }
            return this.$store.state.permissionsLoaded;
        },
        appVersionLabel() {
            return CURRENT_APP_VERSION.version;
        }
    },
    
    async mounted() {
        if (!this.$store.state.menuItems || !this.$store.state.menuItems.main || this.$store.state.menuItems.main.length === 0) {
            await this.$store.dispatch('initializeMenu');
        }
        this.$nextTick(() => {
            this.updateDraggableItems();
        });
    },
    watch: {
        '$store.state.permissions': {
            handler() {
                this.$forceUpdate();
            },
            deep: true
        },
        mainMenuItems: {
            handler() {
                this.$nextTick(() => {
                    this.updateDraggableItems();
                });
            },
            immediate: true
        }
    },
    methods: {
        getCompanyLogo() {
            const company = this.currentCompany;
            if (!company) return '/logo.jpg';
            
            if (company.logoUrl && typeof company.logoUrl === 'function') {
                const url = company.logoUrl();
                const ver = this.$store.state.logoVersion || 0;
                return url + `&cv=${ver}`;
            }
            
            if (company.logo && company.logo.length > 0) {
                const timestamp = company.updatedAt ? new Date(company.updatedAt).getTime() : Date.now();
                const ver = this.$store.state.logoVersion || 0;
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${company.logo}?v=${timestamp}&cv=${ver}`;
            }
            
            return '/logo.jpg';
        },
        
        onLogoError(event) {
            event.target.src = '/logo.jpg';
        },
        
        updateDraggableItems() {
            this.draggableMenuItems = [...(this.mainMenuItems || [])];
        },
        onDragChange(evt) {
            this.$nextTick(() => {
                const currentAvailable = this.$store.state.menuItems.available || [];
                const mainItems = [...this.draggableMenuItems];
                
                if (evt.added) {
                    const movedItem = evt.added.element;
                    const updatedAvailable = currentAvailable.filter(item => item.id !== movedItem.id);
                    this.$store.dispatch('updateBothMenuLists', {
                        mainItems: mainItems,
                        availableItems: updatedAvailable
                    });
                } else if (evt.removed) {
                    const removedItem = evt.removed.element;
                    if (!currentAvailable.find(item => item.id === removedItem.id)) {
                        this.$store.dispatch('updateBothMenuLists', {
                            mainItems: mainItems,
                            availableItems: [...currentAvailable, removedItem]
                        });
                    } else {
                        this.$store.dispatch('updateBothMenuLists', {
                            mainItems: mainItems,
                            availableItems: currentAvailable
                        });
                    }
                } else {
                    this.$store.dispatch('updateBothMenuLists', {
                        mainItems: mainItems,
                        availableItems: currentAvailable
                    });
                }
            });
        }
    }
}
</script>
