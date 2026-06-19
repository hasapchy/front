<template>
  <div class="relative z-50">
    <div
      v-show="isMobileNavOpen"
      class="fixed inset-0 z-[101] bg-black/50 lg:!hidden"
      aria-hidden="true"
      @click="closeMobileNav"
    />
    <div
      class="flex h-dvh max-h-dvh min-h-0 shrink-0 flex-col self-stretch max-lg:w-0 max-lg:min-w-0 max-lg:overflow-visible lg:w-40"
    >
      <aside
        class="app-sidebar grid h-dvh max-h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden text-white transition-transform duration-300 ease-out max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-[102] max-lg:w-72 max-lg:max-w-[min(18rem,88vw)] max-lg:shadow-2xl lg:relative lg:w-40 lg:shrink-0 lg:translate-x-0"
        :class="[sidebarShellClass, isMobileNavOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full']"
      >
        <div
          class="flex shrink-0 items-center py-3 lg:justify-center lg:py-4 max-lg:justify-between max-lg:px-3"
        >
          <a
            href="/"
            class="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full lg:h-[6.3rem] lg:w-[6.3rem]"
            :class="sidebarLogoFallback
              ? 'bg-white'
              : 'border-2 border-gray-600 bg-[#1f2529] shadow-lg'"
            @click="closeMobileNav"
          >
            <img
              v-if="currentCompany"
              :key="sidebarLogoCacheKey"
              :src="getCompanyLogo()"
              alt="Company Logo"
              class="h-[4.5rem] w-[4.5rem] rounded-full border-0 lg:h-[6.3rem] lg:w-[6.3rem]"
              :class="sidebarLogoFallback ? 'object-contain p-2' : 'mb-1 object-cover'"
              @error="onLogoError"
            >
            <SpinnerIcon
              v-else
              size-class="text-base lg:text-lg text-white"
            />
          </a>
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:!hidden"
            :aria-label="$t('close')"
            @click="closeMobileNav"
          >
            <i class="fas fa-times text-xl" />
          </button>
        </div>
        <div class="sidebar-scroll min-h-0 overflow-y-auto overscroll-contain px-1 pt-4 [-webkit-overflow-scrolling:touch] lg:px-0 lg:pt-0">
          <ul :key="permissionsKey">
            <SidebarLink
              to="/"
              icon="fas fa-newspaper mr-2"
              @click="closeMobileNav"
            >
              <span v-if="currentCompany">{{ currentCompany.name }}</span>
              <span
                v-else
                class="inline-flex items-center gap-1"
              ><SpinnerIcon size-class="text-xs" /></span>
            </SidebarLink>
            <div
              v-if="permissionsLoaded"
              class="lg:block max-lg:contents"
            >
              <draggable
                :list="draggableMenuItems"
                :animation="200"
                handle=".drag-handle"
                item-key="id"
                group="menu-items"
                @change="onDragChange"
              >
                <SidebarLink
                  v-for="element in draggableMenuItems"
                  :key="element.id"
                  :to="element.to"
                  :icon="element.icon"
                  class="relative group"
                  @click="closeMobileNav"
                >
                  <span class="flex w-full items-center justify-between">
                    <span class="inline-flex items-center">
                      {{ $t(element.label) }}
                      <OrdersBadge
                        v-if="element.to === '/orders'"
                        inline
                      />
                      <MessengerBadge
                        v-if="element.to === '/messenger'"
                        inline
                      />
                      <TasksBadge v-if="element.to === '/tasks'" />
                    </span>
                    <i class="fas fa-grip-vertical drag-handle ml-2 cursor-move text-xs opacity-0 group-hover:opacity-50" />
                  </span>
                </SidebarLink>
              </draggable>
              <li
                v-if="hasAvailableMenuItems"
                class="mb-2 lg:!hidden"
              >
                <a
                  href="#"
                  :class="additionalMenuToggleClass"
                  @click.prevent="toggleAdditionalMenu"
                >
                  <span>
                    <i class="fas fa-cog mr-2" /> {{ $t('additionalMenu') }}
                  </span>
                  <i
                    :class="[
                      'fas transition-transform duration-200',
                      showAdditionalMenu ? 'fa-chevron-up' : 'fa-chevron-down'
                    ]"
                  />
                </a>
              </li>
              <transition name="sidebar-extra">
                <div
                  v-if="showAdditionalMenu && hasAvailableMenuItems"
                  key="additional-menu"
                  class="sidebar-extra-outer m-0 w-full lg:!hidden"
                >
                  <div class="sidebar-extra-inner m-0 w-full p-0">
                    <draggable
                      :list="draggableAvailableItems"
                      :animation="200"
                      handle=".drag-handle"
                      item-key="id"
                      group="menu-items"
                      @change="onAvailableDragChange"
                    >
                      <SidebarLink
                        v-for="element in draggableAvailableItems"
                        :key="element.id"
                        :to="element.to"
                        :icon="element.icon"
                        :settings="true"
                        class="relative group"
                        @click="closeMobileNav"
                      >
                        <span class="flex w-full items-center justify-between">
                          <span class="inline-flex items-center">
                            {{ $t(element.label) }}
                            <OrdersBadge
                              v-if="element.to === '/orders'"
                              inline
                            />
                            <MessengerBadge
                              v-if="element.to === '/messenger'"
                              inline
                            />
                            <TasksBadge v-if="element.to === '/tasks'" />
                          </span>
                          <i class="fas fa-grip-vertical drag-handle ml-2 cursor-move text-xs opacity-0 group-hover:opacity-50" />
                        </span>
                      </SidebarLink>
                    </draggable>
                  </div>
                </div>
              </transition>
            </div>
            <li class="mb-2 hidden lg:!list-item">
              <a
                id="settings-button"
                href="#"
                :class="settingsMenuToggleClass"
                @click.prevent="toggleSettingsOpen"
              >
                <i class="fas fa-cog mr-2" />
                {{ $t('additionalMenu') }}
              </a>
            </li>
          </ul>
        </div>
        <div class="flex min-h-0 shrink-0 flex-col border-t border-[#53585c] bg-[#282E33] pb-[env(safe-area-inset-bottom,0px)]">
          <div class="bg-[#1f2529] px-2 py-1.5 lg:p-4">
            <div class="text-center leading-tight lg:leading-normal">
              <div class="mb-1 lg:mb-3">
                <img
                  src="/logo.png"
                  alt="LTM Studio"
                  class="mx-auto h-5 w-auto opacity-80 lg:h-8"
                >
              </div>
              <div class="mb-0 text-[10px] text-gray-300 lg:mb-2 lg:text-sm">
                <div class="text-gray-400">
                  powered by
                  <a
                    href="https://ltm.studio"
                    target="_blank"
                    class="text-[var(--label-accent)] transition-colors hover:text-[var(--label-accent)]"
                  >
                    LTM
                  </a>
                </div>
              </div>
              <div class="text-[10px] text-gray-400 lg:text-xs">
                <a
                  href="mailto:info@ltm.studio"
                  class="transition-colors hover:text-gray-300"
                >
                  info@ltm.studio
                </a>
              </div>
              <div class="mt-1.5 flex items-center justify-center gap-0.5 text-[10px] uppercase tracking-wide text-gray-400 lg:mt-3 lg:gap-1 lg:text-[11px] max-lg:[&_button]:gap-0.5 max-lg:[&_button]:text-[10px] max-lg:[&_i]:text-[9px]">
                <span>версия</span>
                <AppVersionBadge variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import SidebarLink from './SidebarLink.vue';
import AppVersionBadge from '../AppVersionBadge.vue';
import OrdersBadge from '../OrdersBadge.vue';
import MessengerBadge from '../MessengerBadge.vue';
import TasksBadge from '../TasksBadge.vue';
import SpinnerIcon from '../SpinnerIcon.vue';
import { applyLogoImageFallback } from '@/constants/imageFallback';
export default {
    components: {
        draggable: VueDraggableNext,
        SpinnerIcon,
        SidebarLink,
        AppVersionBadge,
        OrdersBadge,
        MessengerBadge,
        TasksBadge
    },
    data() {
        return {
            draggableMenuItems: [],
            draggableAvailableItems: [],
            showAdditionalMenu: false,
            sidebarLogoFallback: false
        };
    },
    computed: {
        isMobileNavOpen() {
            return this.$store.state.mobile_sidebar_nav_open;
        },
        sidebarShellClass() {
            return this.$store.getters.profileWallpaperActive ? '' : 'bg-[#282E33]';
        },
        profileWallpaperActive() {
            return this.$store.getters.profileWallpaperActive;
        },
        additionalMenuToggleClass() {
            const base = 'flex items-center justify-between p-2 text-sm transition-colors hover:bg-[#53585C]';
            if (!this.showAdditionalMenu) {
                return base;
            }
            const openClasses = 'border-l-2 border-[var(--nav-accent)]';
            return this.profileWallpaperActive ? `${base} ${openClasses}` : `${base} ${openClasses} bg-[#53585C]`;
        },
        settingsMenuToggleClass() {
            const base = 'flex items-center p-2 text-sm transition-colors hover:bg-[#53585C]';
            if (!this.$store.state.settings_open) {
                return base;
            }
            const openClasses = 'border-l-2 border-[var(--nav-accent)]';
            return this.profileWallpaperActive ? `${base} ${openClasses}` : `${base} ${openClasses} bg-[#53585C]`;
        },
        currentCompany() {
            return this.$store.getters.currentCompany;
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
        sidebarLogoCacheKey() {
            const company = this.currentCompany;
            if (!company) {
                return '0';
            }
            const ver = this.$store.state.logoVersion || 0;
            return `${company.id}-${ver}`;
        }
    },
    watch: {
        sidebarLogoCacheKey() {
            this.sidebarLogoFallback = false;
        },
        '$store.state.mobile_sidebar_nav_open'(value) {
            document.body.style.overflow = value ? 'hidden' : '';
        },
        mainMenuItems: {
            handler() {
                this.$nextTick(() => this.updateDraggableItems());
            },
            immediate: true,
            deep: true
        },
        availableMenuItems: {
            handler() {
                this.$nextTick(() => this.updateAvailableItems());
            },
            immediate: true,
            deep: true
        }
    },
    async mounted() {
        this._removeAfterEach = this.$router.afterEach(() => this.closeMobileNav());
        this._onNavEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeMobileNav();
            }
        };
        document.addEventListener('keydown', this._onNavEscape);
        if (!this.$store.state.menuItems?.main?.length) {
            await this.$store.dispatch('initializeMenu');
        }
        this.$nextTick(() => {
            this.updateDraggableItems();
            this.updateAvailableItems();
        });
    },
    beforeUnmount() {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this._onNavEscape);
        this._removeAfterEach?.();
    },
    methods: {
        closeMobileNav() {
            this.$store.commit('SET_MOBILE_SIDEBAR_NAV_OPEN', false);
        },
        getCompanyLogo() {
            const company = this.currentCompany;
            if (!company) return '/logo.png';
            const logoUrl = company.logoUrl?.();
            if (logoUrl) {
                const ver = this.$store.state.logoVersion || 0;
                return logoUrl + `&cv=${ver}`;
            }
            if (company.logo && company.logo.length > 0) {
                const timestamp = company.updatedAt ? new Date(company.updatedAt).getTime() : Date.now();
                const ver = this.$store.state.logoVersion || 0;
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${company.logo}?v=${timestamp}&cv=${ver}`;
            }
            return '/logo.png';
        },
        onLogoError(event) {
            applyLogoImageFallback(event);
            this.sidebarLogoFallback = true;
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
        toggleSettingsOpen() {
            this.$store.commit('SET_SETTINGS_OPEN', !this.$store.state.settings_open);
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
    }
}
</script>
