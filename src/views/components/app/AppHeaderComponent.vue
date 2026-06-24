<template>
  <div class="app-header relative z-40 shrink-0 overflow-visible rounded px-4 py-1.5 mb-4"
    :class="[headerShellClass, headerSpacingClass]">
    <Transition name="header-mobile-search">
      <div v-if="mobileSearchExpanded" key="mobile-search-bar"
        class="flex min-h-9 w-full items-center gap-2 lg:!hidden">
        <button v-show="!mobileSidebarNavOpen" type="button" :class="headerIconBtnClass"
          :aria-expanded="mobileSidebarNavOpen" :aria-label="$t('navMenu')" @click="toggleMobileSidebarNav">
          <i class="fas fa-bars text-lg" />
        </button>
        <button type="button" :class="[headerIconBtnClass, 'text-[var(--color-danger)]']" :aria-label="$t('close')"
          @click="closeMobileSearch">
          <i class="fas fa-times text-lg" />
        </button>
        <div class="min-w-0 flex-1">
          <AppSearch />
        </div>
      </div>
      <div v-else key="header-grid" :class="headerGridClass">
        <div v-if="isMobileHeader" class="flex shrink-0 items-center justify-self-start">
          <button v-show="!mobileSidebarNavOpen" type="button" :class="headerIconBtnClass"
            :aria-expanded="mobileSidebarNavOpen" :aria-label="$t('navMenu')" @click="toggleMobileSidebarNav">
            <i class="fas fa-bars text-lg" />
          </button>
        </div>
        <div v-else class="flex min-h-9 shrink-0 items-center justify-self-start">
          <CompanySwitcher />
        </div>

        <div v-if="!isMobileHeader"
          class="flex min-h-9 w-full min-w-0 items-center justify-center justify-self-center px-1 sm:px-2">
          <Transition name="header-desktop-search">
            <div v-if="$route.meta.showSearch" class="flex w-full min-w-0 justify-center">
              <AppSearch />
            </div>
          </Transition>
        </div>

        <div class="relative z-20 flex shrink-0 items-center justify-self-end gap-2 sm:gap-4">
          <button v-if="isMobileHeader && $route.meta.showSearch && !mobileSearchOpen" type="button"
            :class="headerIconBtnClass" :aria-label="$t('searchPlaceholder')" @click="openMobileSearch">
            <i class="fas fa-search text-lg" />
          </button>
          <UserProfileDropdown v-if="$store.state.user" variant="header" />
          <NotificationsBell />
          <AppHeaderSettingsMenu />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { mapGetters, mapState } from 'vuex';
import { useBindedTabs } from '@/composables/useBindedTabs';
import AppSearch from '@/views/components/app/search/Search.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import AppHeaderSettingsMenu from './AppHeaderSettingsMenu.vue';
import NotificationsBell from '@/views/components/app/NotificationsBell.vue';
import UserProfileDropdown from '@/views/components/app/UserProfileDropdown.vue';

export default {
  components: {
    AppSearch,
    AppHeaderSettingsMenu,
    CompanySwitcher,
    NotificationsBell,
    UserProfileDropdown,
  },
  setup() {
    const { width } = useWindowSize();
    const bindedTabs = useBindedTabs();
    const hasBindedTabs = computed(() => bindedTabs.value.length > 1);
    return { windowWidth: width, hasBindedTabs };
  },
  data() {
    return {
      mobileSearchOpen: false,
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
    headerSpacingClass() {
      if (!this.isMobileHeader || !this.hasBindedTabs) {
        return '';
      }
      return 'mb-2';
    },
    headerIconBtnClass() {
      return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--nav-accent)] shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:border-0 dark:bg-white dark:text-[var(--nav-accent)] dark:hover:bg-white/90';
    },
    isMobileHeader() {
      return this.windowWidth < 1024;
    },
    mobileSearchExpanded() {
      return this.mobileSearchOpen && this.$route.meta.showSearch && this.isMobileHeader;
    },
    headerGridClass() {
      if (this.isMobileHeader) {
        return 'grid min-h-9 w-full min-w-0 items-center gap-x-2 [grid-template-columns:auto_1fr]';
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
    },
    '$route.path'() {
      this.mobileSearchOpen = false;
    },
  },
  methods: {
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
