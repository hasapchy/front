<template>
  <div class="relative z-40 mb-5 overflow-visible rounded bg-white px-4 py-1.5 shadow-sm dark:bg-[var(--surface-elevated)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
    <Transition name="header-mobile-search">
      <div
        v-if="mobileSearchExpanded"
        key="mobile-search-bar"
        class="flex min-h-9 w-full items-center gap-2 min-[1200px]:!hidden"
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
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 dark:hover:bg-red-950/40"
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
        v-if="isMobileHeader"
        class="min-w-0 justify-self-stretch self-center"
      >
        <span
          v-if="bindedList.length"
          class="line-clamp-2 text-sm font-semibold leading-tight text-gray-800 dark:text-[var(--text-primary)]"
        >{{ displayTitle }}</span>
      </div>
      <div
        v-else-if="!isMobileHeader"
        class="flex min-h-9 min-w-0 items-center justify-self-start gap-2 overflow-x-auto overflow-y-hidden sm:gap-4"
      >
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
            <span class="tab-label">{{ tab.name }}</span>
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
        <AppHeaderSettingsMenu />
      </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { useWindowSize } from '@vueuse/core';
import { mapState } from 'vuex';
import AppSearch from '@/views/components/app/search/Search.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import AppHeaderSettingsMenu from './AppHeaderSettingsMenu.vue';
import MessengerBadge from '@/views/components/app/MessengerBadge.vue';
import UserProfileDropdown from '@/views/components/app/UserProfileDropdown.vue';
import { getBindedList, getTabIcon } from '@/utils/headerBindedTabs';

const TABS_COLLAPSED = 6;

export default {
    components: {
        AppSearch,
        AppHeaderSettingsMenu,
        CompanySwitcher,
        MessengerBadge,
        UserProfileDropdown
    },
    setup() {
        const { width } = useWindowSize();
        return { windowWidth: width };
    },
    data() {
        return {
            headerTabsExpanded: false,
            mobileSearchOpen: false,
            headerMessengerBadgeVisible: false
        };
    },
    computed: {
        ...mapState({
            mobileSidebarNavOpen: (state) => state.mobile_sidebar_nav_open
        }),
        isMobileHeader() {
            return this.windowWidth < 1200;
        },
        mobileSearchExpanded() {
            return this.mobileSearchOpen && this.$route.meta.showSearch && this.isMobileHeader;
        },
        pageTitle() {
            return this.$route.meta.title ? this.$t(this.$route.meta.title) : this.$t('accountingSystem');
        },
        bindedList() {
            return getBindedList(this.$route, this.$store, (key) => this.$t(key));
        },
        showHeaderTabsMore() {
            return this.bindedList.length > TABS_COLLAPSED;
        },
        visibleHeaderTabs() {
            if (!this.showHeaderTabsMore || this.headerTabsExpanded) {
                return this.bindedList;
            }
            return this.bindedList.slice(0, TABS_COLLAPSED);
        },
        desktopSearchColumn() {
            return !this.isMobileHeader && !(this.showHeaderTabsMore && this.headerTabsExpanded);
        },
        headerGridClass() {
            const compact = this.showHeaderTabsMore && this.headerTabsExpanded;
            if (this.isMobileHeader) {
                return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 [grid-template-columns:auto_minmax(0,1fr)_auto]';
            }
            if (compact) {
                return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 sm:gap-x-3 [grid-template-columns:minmax(0,1fr)_auto]';
            }
            return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 sm:gap-x-3 [grid-template-columns:minmax(0,1fr)_minmax(10rem,min(100%,28rem))_minmax(0,1fr)]';
        },
        displayTitle() {
            return this.$route.path === '/' ? this.$t('myCompany') : this.pageTitle;
        }
    },
    watch: {
        windowWidth(w) {
            if (w >= 1200) {
                this.mobileSearchOpen = false;
                this.$store.commit('SET_MOBILE_SIDEBAR_NAV_OPEN', false);
            }
        },
        '$route.path'() {
            this.headerTabsExpanded = false;
            this.mobileSearchOpen = false;
        }
    },
    methods: {
        getTabIcon,
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

@media (max-width: 1440px) {
    .tab-label {
        display: none;
    }
}
</style>
