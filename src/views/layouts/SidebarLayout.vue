<template>
  <transition
    name="fade"
    mode="out-in"
  >
    <div
      v-if="$store.state.user !== null"
      key="routerview"
      class="relative flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-white dark:bg-[var(--surface-page)]"
    >
      <AppSidebarComponent />
      <transition name="settings-sidebar">
        <AppSettingsSidebarComponent v-if="$store.state.settings_open && !isMobileLayout" />
      </transition>
      <div
        id="main-content"
        class="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden transition-transform duration-300"
      >
        <AppHeaderComponent />
        <main
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 pt-0"
          :class="{ 'max-[1199px]:pb-[calc(4.15rem+env(safe-area-inset-bottom,0px))]': showMobileBindedBar }"
        >
          <router-view />
        </main>
      </div>
      <AppMobileBindedBar />
      <ScrollToTopButton />
    </div>
    <div
      v-else
      key="loader"
      class="flex h-screen items-center justify-center dark:bg-[var(--surface-page)]"
    >
      <SpinnerIcon />
    </div>
  </transition>
</template>

<script>
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { useBindedTabs } from '@/composables/useBindedTabs';
import AppHeaderComponent from '../components/app/AppHeaderComponent.vue';
import AppSidebarComponent from '../components/app/sidebar/AppSidebarComponent.vue';
import AppSettingsSidebarComponent from '../components/app/sidebar/AppSettingsSidebarComponent.vue';
import SpinnerIcon from '../components/app/SpinnerIcon.vue';
import ScrollToTopButton from '../components/app/ScrollToTopButton.vue';
import AppMobileBindedBar from '../components/app/AppMobileBindedBar.vue';

export default {
    components: {
        AppHeaderComponent,
        AppSidebarComponent,
        AppSettingsSidebarComponent,
        SpinnerIcon,
        ScrollToTopButton,
        AppMobileBindedBar
    },
    setup() {
        const { width } = useWindowSize();
        const bindedTabs = useBindedTabs();
        const isMobileLayout = computed(() => width.value < 1200);
        const showMobileBindedBar = computed(() => isMobileLayout.value && bindedTabs.value.length > 0);
        return { isMobileLayout, showMobileBindedBar };
    }
}
</script>

<style scoped>
.settings-sidebar-enter-active,
.settings-sidebar-leave-active {
    transition: all 0.3s ease;
}

.settings-sidebar-enter-from,
.settings-sidebar-leave-to {
    width: 0;
    opacity: 0;
}

.settings-sidebar-enter-to,
.settings-sidebar-leave-from {
    width: 50;
    opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
}
</style>
