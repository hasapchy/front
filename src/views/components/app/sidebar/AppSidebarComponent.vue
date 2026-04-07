<template>
  <div>
    <div
      v-show="isMobileNavOpen"
      class="fixed inset-0 z-[101] bg-black/50 min-[1200px]:!hidden"
      aria-hidden="true"
      @click="closeMobileNav"
    />
    <div
      class="flex h-dvh max-h-dvh min-h-0 shrink-0 flex-col self-stretch max-[1199px]:w-0 max-[1199px]:min-w-0 max-[1199px]:overflow-visible min-[1200px]:w-40"
    >
      <aside
        class="grid h-dvh max-h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#282E33] text-white transition-transform duration-300 ease-out max-[1199px]:fixed max-[1199px]:left-0 max-[1199px]:top-0 max-[1199px]:z-[102] max-[1199px]:w-[90vw] max-[1199px]:max-w-none max-[1199px]:shadow-2xl min-[1200px]:relative min-[1200px]:w-40 min-[1200px]:shrink-0 min-[1200px]:translate-x-0"
        :class="isMobileNavOpen ? 'max-[1199px]:translate-x-0' : 'max-[1199px]:-translate-x-full'"
      >
        <div
          class="flex shrink-0 items-center py-3 min-[1200px]:justify-center min-[1200px]:py-4 max-[1199px]:justify-between max-[1199px]:px-3"
        >
          <a
            href="/"
            class="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full min-[1200px]:h-[6.3rem] min-[1200px]:w-[6.3rem]"
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
              class="h-[4.5rem] w-[4.5rem] rounded-full border-0 min-[1200px]:h-[6.3rem] min-[1200px]:w-[6.3rem]"
              :class="sidebarLogoFallback ? 'object-contain p-2' : 'mb-1 object-cover'"
              @error="onLogoError"
            >
            <SpinnerIcon
              v-else
              size-class="text-base min-[1200px]:text-lg text-white"
            />
          </a>
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 min-[1200px]:!hidden"
            :aria-label="$t('close')"
            @click="closeMobileNav"
          >
            <i class="fas fa-times text-xl" />
          </button>
        </div>
        <div class="min-h-0 overflow-y-auto overscroll-contain pt-4 [-webkit-overflow-scrolling:touch] min-[1200px]:pt-0">
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
              class="min-[1200px]:block max-[1199px]:contents"
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
                class="mb-2 min-[1200px]:!hidden"
              >
                <a
                  href="#"
                  :class="[
                    'flex items-center justify-between p-2 text-sm transition-colors hover:bg-[#53585C]',
                    showAdditionalMenu ? 'border-l-2 border-[var(--nav-accent)] bg-[#53585C]' : ''
                  ]"
                  @click.prevent="toggleAdditionalMenu"
                >
                  <span>
                    <i class="fas fa-ellipsis-h mr-2" /> {{ $t('additionalMenu') }}
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
                  class="sidebar-extra-outer m-0 w-full min-[1200px]:!hidden"
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
            <li class="mb-2 hidden min-[1200px]:!list-item">
              <a
                id="settings-button"
                href="#"
                :class="[
                  'flex items-center p-2 text-sm transition-colors hover:bg-[#53585C]',
                  $store.state.settings_open ? 'border-l-2 border-[var(--nav-accent)] bg-[#53585C]' : ''
                ]"
                @click.prevent="toggleSettingsOpen"
              >
                <i class="fas fa-ellipsis-h mr-2" />
                {{ $t('additionalMenu') }}
              </a>
            </li>
          </ul>
        </div>
        <div class="flex min-h-0 shrink-0 flex-col border-t border-[#53585c] bg-[#282E33] pb-[env(safe-area-inset-bottom,0px)]">
          <div
            v-if="showSidebarProfile"
            class="flex justify-center px-2 py-2"
          >
            <UserProfileDropdown variant="sidebar" />
          </div>
          <div class="bg-[#1f2529] px-2 py-1.5 min-[1200px]:p-4">
            <div class="text-center leading-tight min-[1200px]:leading-normal">
              <div class="mb-1 min-[1200px]:mb-3">
                <img
                  src="/logo.png"
                  alt="LTM Studio"
                  class="mx-auto h-5 w-auto opacity-80 min-[1200px]:h-8"
                >
              </div>
              <div class="mb-0 text-[10px] text-gray-300 min-[1200px]:mb-2 min-[1200px]:text-sm">
                <div class="text-gray-400">
                  powered by
                  <a
                    href="https://ltm.studio"
                    target="_blank"
                    class="text-blue-400 transition-colors hover:text-blue-300"
                  >
                    LTM
                  </a>
                </div>
              </div>
              <div class="text-[10px] text-gray-400 min-[1200px]:text-xs">
                <a
                  href="mailto:info@ltm.studio"
                  class="transition-colors hover:text-gray-300"
                >
                  info@ltm.studio
                </a>
              </div>
              <div class="mt-1.5 flex items-center justify-center gap-0.5 text-[10px] uppercase tracking-wide text-gray-400 min-[1200px]:mt-3 min-[1200px]:gap-1 min-[1200px]:text-[11px] max-[1199px]:[&_button]:gap-0.5 max-[1199px]:[&_button]:text-[10px] max-[1199px]:[&_i]:text-[9px]">
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
import UserProfileDropdown from '../UserProfileDropdown.vue';
import { applyLogoImageFallback } from '@/constants/imageFallback';
export default {
    components: {
        draggable: VueDraggableNext,
        SpinnerIcon,
        UserProfileDropdown,
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
        showSidebarProfile() {
            return !!this.$store.state.user;
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
