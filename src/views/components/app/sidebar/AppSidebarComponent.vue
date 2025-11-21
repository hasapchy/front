<template>
    <!-- Mobile Overlay (transparent, only to capture clicks) -->
    <div 
        v-if="isMobileMenuOpen" 
        class="fixed inset-0 bg-transparent z-40 lg:hidden"
        @click="closeMobileMenu">
    </div>
    
    <!-- Sidebar -->
    <aside 
        :style="{ display: sidebarDisplayStyle }"
        :class="[
            'bg-[#282E33] text-white flex-shrink-0 transform transition-transform duration-300 relative z-50',
            'fixed top-0 left-0 h-screen max-h-screen lg:static lg:h-full lg:max-h-full',
            'w-full lg:w-40',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]">

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

        <!-- Close button for mobile -->
        <button 
            @click="closeMobileMenu"
            class="absolute top-4 right-4 lg:hidden text-white hover:text-gray-300 p-2"
            aria-label="Close menu">
            <i class="fas fa-times text-xl"></i>
        </button>

        <div class="pb-32 pt-4 lg:pt-0 flex flex-col h-full overflow-y-auto" v-if="permissionsLoaded">
            <ul :key="permissionsKey" class="flex-1">
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

                <!-- Mobile: Additional Menu Toggle Button -->
                <li v-if="hasAvailableMenuItems && isMobile" class="mb-2 mt-4">
                    <a href="#" @click.prevent="toggleAdditionalMenu"
                        :class="[
                            'flex items-center justify-between p-2 hover:bg-[#53585C]',
                            showAdditionalMenu ? 'bg-[#53585C] border-l-2 border-red-500' : '',
                            'transition-colors text-sm'
                        ]">
                        <span>
                            <i class="fas fa-ellipsis-h mr-2"></i> {{ $t('additionalMenu') || 'Доп. меню' }}
                        </span>
                        <i :class="[
                            'fas transition-transform duration-200',
                            showAdditionalMenu ? 'fa-chevron-up' : 'fa-chevron-down'
                        ]"></i>
                    </a>
                </li>

                <!-- Mobile: Additional Menu Items (Collapsible) -->
                <transition name="slide-down">
                    <div v-if="showAdditionalMenu && isMobile && hasAvailableMenuItems" class="overflow-hidden">
                        <draggable
                            :list="draggableAvailableItems"
                            @change="onAvailableDragChange"
                            :animation="200"
                            handle=".drag-handle"
                            item-key="id"
                            group="menu-items"
                        >
                            <SidebarLink 
                                v-for="element in draggableAvailableItems"
                                :key="element.id"
                                :to="element.to" 
                                :icon="element.icon"
                                :settings="true"
                                class="relative group pl-4"
                            >
                                <span class="flex items-center justify-between w-full">
                                    <span>{{ $t(element.label) }}</span>
                                    <i class="fas fa-grip-vertical drag-handle opacity-0 group-hover:opacity-50 cursor-move ml-2 text-xs"></i>
                                </span>
                            </SidebarLink>
                        </draggable>
                    </div>
                </transition>

                <!-- Desktop: Settings Button (показываем всегда на десктопе) -->
                <li class="mb-2 hidden lg:block">
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
                    <img src="/logo.png" alt="LTM Studio" class="h-8 w-auto mx-auto opacity-80">
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

                <div class="mt-3 text-[11px] uppercase tracking-wide text-gray-400 flex items-center justify-center gap-1">
                    <span>версия</span>
                    <AppVersionBadge variant="dark" />
                </div>
            </div>
        </div>
    </aside>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import SidebarLink from './SidebarLink.vue';
import AppVersionBadge from '../AppVersionBadge.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        draggable: VueDraggableNext,
        SidebarLink,
        AppVersionBadge
    },
    
    data() {
        return {
            draggableMenuItems: [],
            draggableAvailableItems: [],
            isMobileMenuOpen: false,
            isDesktop: false,
            showAdditionalMenu: false
        };
    },
    computed: {
        sidebarDisplayStyle() {
            if (this.isDesktop) {
                return 'block';
            }
            return this.isMobileMenuOpen ? 'block' : 'none';
        },
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
        availableMenuItems() {
            return this.$store.getters.availableMenuItems;
        },
        hasAvailableMenuItems() {
            return this.availableMenuItems && this.availableMenuItems.length > 0;
        },
        isMobile() {
            return !this.isDesktop;
        }
    },
    async mounted() {
        this.checkDesktop();
        window.addEventListener('resize', this.checkDesktop);
        
        if (!this.$store.state.menuItems || !this.$store.state.menuItems.main || this.$store.state.menuItems.main.length === 0) {
            await this.$store.dispatch('initializeMenu');
        }
        this.$nextTick(() => {
            this.updateDraggableItems();
            this.updateAvailableItems();
        });
        
        eventBus.on('toggleMobileMenu', this.toggleMobileMenu);
        eventBus.on('closeMobileMenu', this.closeMobileMenu);
        
        this.$router.afterEach(() => {
            if (window.innerWidth < 1024) {
                this.closeMobileMenu();
            }
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.checkDesktop);
        eventBus.off('toggleMobileMenu', this.toggleMobileMenu);
        eventBus.off('closeMobileMenu', this.closeMobileMenu);
        document.body.style.overflow = '';
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
        },
        availableMenuItems: {
            handler() {
                this.$nextTick(() => {
                    this.updateAvailableItems();
                });
            },
            immediate: true
        }
    },
    methods: {
        checkDesktop() {
            this.isDesktop = window.innerWidth >= 1024;
            if (this.isDesktop) {
                this.isMobileMenuOpen = false;
            }
        },
        getCompanyLogo() {
            const company = this.currentCompany;
            if (!company) return '/logo.png';
            
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
            
            return '/logo.png';
        },
        
        onLogoError(event) {
            event.target.src = '/logo.png';
        },
        
        updateDraggableItems() {
            this.draggableMenuItems = [...(this.mainMenuItems || [])];
        },
        updateAvailableItems() {
            this.draggableAvailableItems = [...(this.availableMenuItems || [])];
        },
        toggleAdditionalMenu() {
            this.showAdditionalMenu = !this.showAdditionalMenu;
        },
        onAvailableDragChange(evt) {
            this.$nextTick(() => {
                const currentMain = this.$store.state.menuItems.main || [];
                const availableItems = [...this.draggableAvailableItems];
                
                if (evt.added) {
                    const movedItem = evt.added.element;
                    const updatedMain = currentMain.filter(item => item.id !== movedItem.id);
                    this.$store.dispatch('updateBothMenuLists', {
                        mainItems: updatedMain,
                        availableItems: availableItems
                    });
                } else if (evt.removed) {
                    const removedItem = evt.removed.element;
                    if (!currentMain.find(item => item.id === removedItem.id)) {
                        this.$store.dispatch('updateBothMenuLists', {
                            mainItems: [...currentMain, removedItem],
                            availableItems: availableItems
                        });
                    } else {
                        this.$store.dispatch('updateBothMenuLists', {
                            mainItems: currentMain,
                            availableItems: availableItems
                        });
                    }
                } else {
                    this.$store.dispatch('updateBothMenuLists', {
                        mainItems: currentMain,
                        availableItems: availableItems
                    });
                }
            });
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
        },
        toggleMobileMenu() {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
            if (this.isMobileMenuOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        },
        closeMobileMenu() {
            this.isMobileMenuOpen = false;
            this.showAdditionalMenu = false;
            document.body.style.overflow = '';
        }
    }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
    max-height: 1000px;
    opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
}
</style>
