<template>
  <div
    class="app-header relative z-40 mb-5 overflow-visible rounded px-4 py-1.5"
    :class="headerShellClass"
  >
    <Transition name="header-mobile-search">
      <div
        v-if="mobileSearchExpanded"
        key="mobile-search-bar"
        class="flex min-h-9 w-full items-center gap-2 lg:!hidden"
      >
        <button
          v-show="!mobileSidebarNavOpen"
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
          :aria-expanded="mobileSidebarNavOpen"
          :aria-label="$t('navMenu')"
          @click="toggleMobileSidebarNav"
        >
          <i class="fas fa-bars text-lg" />
        </button>
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))] hover:text-[var(--color-danger-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/35 dark:hover:bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)]"
          :aria-label="$t('close')"
          @click="closeMobileSearch"
        >
          <i class="fas fa-times text-lg" />
        </button>
        <div class="min-w-0 flex-1">
          <AppSearch />
        </div>
      </div>
      <div
        v-else
        key="header-grid"
        :class="headerGridClass"
      >
      <div
        v-if="isMobileHeader"
        class="flex shrink-0 items-center justify-self-start"
      >
        <button
          v-show="!mobileSidebarNavOpen"
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
          :aria-expanded="mobileSidebarNavOpen"
          :aria-label="$t('navMenu')"
          @click="toggleMobileSidebarNav"
        >
          <i class="fas fa-bars text-lg" />
        </button>
      </div>
      <div
        v-else-if="!isMobileHeader"
        ref="headerTabsTrack"
        class="relative flex min-h-9 w-full min-w-0 items-center gap-2 overflow-x-auto overflow-y-hidden sm:gap-4"
      >
        <div
          ref="headerTabsMeasure"
          aria-hidden="true"
          class="pointer-events-none invisible absolute left-0 top-0 -z-10 flex w-max max-w-none opacity-0"
        >
          <div class="flex flex-nowrap items-center gap-2 sm:gap-4">
            <div
              v-for="tab in bindedList"
              :key="`measure-${tab.path}`"
              :ref="(el) => setTabMeasureEl(tab.path, el)"
              class="relative flex shrink-0 items-center justify-center gap-2 font-semibold text-[var(--nav-accent)]"
            >
              <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent text-inherit dark:rounded-full dark:border-0 dark:bg-white dark:text-[var(--nav-accent)]">
                <i
                  :class="getTabIcon(tab.path)"
                  class="text-lg"
                />
              </span>
              <span class="tab-label whitespace-nowrap">{{ tab.name }}</span>
            </div>
          </div>
          <button
            ref="headerTabsMoreMeasure"
            type="button"
            tabindex="-1"
            class="flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold"
          >
            <i class="fas fa-angles-right text-base" />
            <span class="hidden min-[1441px]:inline">{{ $t('headerTabsExpand') }}</span>
          </button>
        </div>
        <div class="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-4">
          <router-link
            v-for="tab in visibleHeaderTabs"
            :key="tab.path"
            :to="tab.path"
            class="relative flex shrink-0 items-center justify-center gap-2 font-semibold text-[var(--nav-accent)] transition-all hover:text-[var(--nav-accent-hover)] hover:underline dark:text-white dark:hover:text-white dark:hover:opacity-90 dark:hover:no-underline"
            :title="tab.name"
          >
            <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent text-inherit dark:rounded-full dark:border-0 dark:bg-white dark:text-[var(--nav-accent)]">
              <i
                :class="getTabIcon(tab.path)"
                class="text-lg"
              />
            </span>
            <span class="tab-label whitespace-nowrap">{{ tab.name }}</span>
          </router-link>
          <button
            v-if="showHeaderTabsMore"
            type="button"
            class="flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--nav-accent)] transition-colors hover:bg-slate-100 hover:text-[var(--nav-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:hover:bg-[var(--surface-muted)]"
            :title="headerTabsExpanded ? $t('headerTabsCollapse') : $t('headerTabsExpand')"
            :aria-expanded="headerTabsExpanded"
            :aria-label="headerTabsExpanded ? $t('headerTabsCollapse') : $t('headerTabsExpand')"
            @click="headerTabsExpanded = !headerTabsExpanded"
          >
            <i
              class="fas text-base"
              :class="headerTabsExpanded ? 'fa-angles-left' : 'fa-angles-right'"
            />
            <span class="hidden min-[1441px]:inline">{{ headerTabsExpanded ? $t('headerTabsCollapse') : $t('headerTabsExpand') }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="desktopSearchColumn"
        class="flex min-h-9 w-full min-w-0 items-center justify-center justify-self-center px-1 sm:px-2"
      >
        <Transition name="header-desktop-search">
          <div
            v-if="$route.meta.showSearch && !(showHeaderTabsMore && headerTabsExpanded)"
            class="min-w-0 w-full max-w-xl"
          >
            <AppSearch />
          </div>
        </Transition>
      </div>

      <div class="relative z-20 flex shrink-0 items-center justify-self-end gap-2 sm:gap-4">
        <button
          v-if="isMobileHeader && $route.meta.showSearch && !mobileSearchOpen"
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
          :aria-label="$t('searchPlaceholder')"
          @click="openMobileSearch"
        >
          <i class="fas fa-search text-lg" />
        </button>
        <CompanySwitcher v-if="!isMobileHeader" />
        <MessengerBadge v-if="headerMessengerBadgeVisible" />
        <UserProfileDropdown
          v-if="$store.state.user"
          variant="header"
        />
        <NotificationsBell />
        <AppHeaderSettingsMenu />
      </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { useWindowSize } from '@vueuse/core';
import { mapGetters, mapState } from 'vuex';
import AppSearch from '@/views/components/app/search/Search.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import AppHeaderSettingsMenu from './AppHeaderSettingsMenu.vue';
import MessengerBadge from '@/views/components/app/MessengerBadge.vue';
import NotificationsBell from '@/views/components/app/NotificationsBell.vue';
import UserProfileDropdown from '@/views/components/app/UserProfileDropdown.vue';
import { calcHeaderTabsFitCount, getBindedList, getTabIcon } from '@/utils/headerBindedTabs';

export default {
    components: {
        AppSearch,
        AppHeaderSettingsMenu,
        CompanySwitcher,
        MessengerBadge,
        NotificationsBell,
        UserProfileDropdown,
    },
    setup() {
        const { width } = useWindowSize();
        return { windowWidth: width };
    },
    data() {
        return {
            headerTabsExpanded: false,
            headerTabsFitCount: null,
            tabMeasureEls: {},
            mobileSearchOpen: false,
            headerMessengerBadgeVisible: false,
            headerTabsResizeObserver: null,
            headerTabsMeasureAttempts: 0,
        };
    },
    computed: {
        ...mapState({
            mobileSidebarNavOpen: (state) => state.mobile_sidebar_nav_open
        }),
        ...mapGetters(['profileWallpaperActive']),
        headerShellClass() {
            if (this.profileWallpaperActive) {
                return '';
            }
            return 'bg-white shadow-sm dark:bg-[var(--surface-elevated)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]';
        },
        isMobileHeader() {
            return this.windowWidth < 1024;
        },
        mobileSearchExpanded() {
            return this.mobileSearchOpen && this.$route.meta.showSearch && this.isMobileHeader;
        },
        bindedList() {
            return getBindedList(this.$route, this.$store, (key) => this.$t(key));
        },
        showHeaderTabsMore() {
            const fitCount = this.headerTabsFitCount ?? this.bindedList.length;
            return this.bindedList.length > fitCount;
        },
        visibleHeaderTabs() {
            if (this.headerTabsExpanded) {
                return this.bindedList;
            }
            const fitCount = this.headerTabsFitCount ?? this.bindedList.length;
            if (fitCount >= this.bindedList.length) {
                return this.bindedList;
            }
            return this.bindedList.slice(0, fitCount);
        },
        desktopSearchColumn() {
            return !this.isMobileHeader && !(this.showHeaderTabsMore && this.headerTabsExpanded);
        },
        headerGridClass() {
            const compact = this.showHeaderTabsMore && this.headerTabsExpanded;
            if (this.isMobileHeader) {
                return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 [grid-template-columns:auto_1fr]';
            }
            if (compact) {
                return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 sm:gap-x-3 [grid-template-columns:minmax(0,1fr)_auto]';
            }
            return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 sm:gap-x-3 [grid-template-columns:minmax(0,1fr)_minmax(10rem,min(100%,28rem))_minmax(0,1fr)]';
        }
    },
    watch: {
        windowWidth(w) {
            if (w >= 1024) {
                this.mobileSearchOpen = false;
                this.$store.commit('SET_MOBILE_SIDEBAR_NAV_OPEN', false);
            }
            this.scheduleHeaderTabsMeasure();
        },
        bindedList: {
            handler() {
                this.tabMeasureEls = {};
                this.headerTabsMeasureAttempts = 0;
                this.scheduleHeaderTabsMeasure();
            },
            deep: true,
        },
        headerTabsExpanded() {
            this.scheduleHeaderTabsMeasure();
        },
        '$route.path'() {
            this.headerTabsExpanded = false;
            this.mobileSearchOpen = false;
            this.scheduleHeaderTabsMeasure();
        },
        '$i18n.locale'() {
            this.scheduleHeaderTabsMeasure();
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.remeasureHeaderTabs();
            const track = this.$refs.headerTabsTrack;
            if (!track || typeof ResizeObserver === 'undefined') {
                return;
            }
            this.headerTabsResizeObserver = new ResizeObserver(() => {
                this.remeasureHeaderTabs();
            });
            this.headerTabsResizeObserver.observe(track);
        });
    },
    beforeUnmount() {
        if (this.headerTabsResizeObserver) {
            this.headerTabsResizeObserver.disconnect();
            this.headerTabsResizeObserver = null;
        }
    },
    methods: {
        getTabIcon,
        setTabMeasureEl(path, el) {
            if (el) {
                this.tabMeasureEls[path] = el;
                return;
            }
            delete this.tabMeasureEls[path];
        },
        scheduleHeaderTabsMeasure() {
            this.headerTabsMeasureAttempts = 0;
            this.$nextTick(() => {
                this.remeasureHeaderTabs();
            });
        },
        remeasureHeaderTabs() {
            if (this.isMobileHeader) {
                this.headerTabsFitCount = null;
                this.headerTabsMeasureAttempts = 0;
                return;
            }
            const track = this.$refs.headerTabsTrack;
            if (!track) {
                return;
            }
            const available = track.clientWidth;
            if (available <= 0) {
                if (this.headerTabsMeasureAttempts < 8) {
                    this.headerTabsMeasureAttempts += 1;
                    this.$nextTick(() => {
                        this.remeasureHeaderTabs();
                    });
                }
                return;
            }
            const tabs = this.bindedList;
            if (!tabs.length) {
                this.headerTabsFitCount = 0;
                this.headerTabsMeasureAttempts = 0;
                return;
            }
            const gap = this.windowWidth >= 640 ? 16 : 8;
            const widths = tabs.map((tab) => this.tabMeasureEls[tab.path]?.offsetWidth ?? 0);
            const moreButton = this.$refs.headerTabsMoreMeasure;
            const fitCount = calcHeaderTabsFitCount({
                tabWidths: widths,
                availableWidth: available,
                moreButtonWidth: moreButton?.offsetWidth ?? 48,
                gap,
            });
            if (fitCount === null) {
                if (this.headerTabsMeasureAttempts < 8) {
                    this.headerTabsMeasureAttempts += 1;
                    this.$nextTick(() => {
                        this.remeasureHeaderTabs();
                    });
                } else {
                    this.headerTabsFitCount = tabs.length;
                }
                return;
            }
            this.headerTabsFitCount = fitCount;
            this.headerTabsMeasureAttempts = 0;
        },
        openMobileSearch() {
            this.$store.commit('SET_MOBILE_SIDEBAR_NAV_OPEN', false);
            this.mobileSearchOpen = true;
        },
        toggleMobileSidebarNav() {
            this.$store.commit('SET_MOBILE_SIDEBAR_NAV_OPEN', !this.mobileSidebarNavOpen);
        },
        closeMobileSearch() {
            this.mobileSearchOpen = false;
        }
    }
};
</script>

<style scoped>
.header-mobile-search-enter-active,
.header-mobile-search-leave-active,
.header-desktop-search-enter-active,
.header-desktop-search-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
}

.header-mobile-search-enter-from,
.header-mobile-search-leave-to,
.header-desktop-search-enter-from,
.header-desktop-search-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

</style>
