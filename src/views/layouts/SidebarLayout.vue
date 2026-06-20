<template>

  <transition

    name="fade"

    mode="out-in"

  >

    <div

      v-if="$store.state.user !== null"

      key="routerview"

      class="relative flex h-dvh max-h-dvh min-h-0 overflow-hidden"

      :class="layoutRootClass"

    >

      <div

        v-if="profileWallpaperImageUrl"

        class="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"

        :style="wallpaperStyle"

      />

      <AppSidebarComponent />

      <transition name="settings-sidebar">

        <AppSettingsSidebarComponent v-if="$store.state.settings_open && !isMobileLayout" />

      </transition>

      <div

        id="main-content"

        class="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden transition-transform duration-300"

      >

        <AppHeaderComponent />

        <PageBindedTabBar />

        <main

          class="layout-flex-fill-col min-h-0 flex-1 overflow-x-hidden p-4 pt-0"

          :class="isMessengerRoute ? 'overflow-hidden max-md:px-0 max-md:pb-0' : 'overflow-y-auto'"

        >

          <router-view />

        </main>

      </div>

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

import { useRoute } from 'vue-router';

import { useWindowSize } from '@vueuse/core';

import { mapGetters } from 'vuex';

import AppHeaderComponent from '../components/app/AppHeaderComponent.vue';

import AppSidebarComponent from '../components/app/sidebar/AppSidebarComponent.vue';

import AppSettingsSidebarComponent from '../components/app/sidebar/AppSettingsSidebarComponent.vue';

import SpinnerIcon from '../components/app/SpinnerIcon.vue';

import ScrollToTopButton from '../components/app/ScrollToTopButton.vue';

import PageBindedTabBar from '../components/app/PageBindedTabBar.vue';



export default {

    components: {

        AppHeaderComponent,

        AppSidebarComponent,

        AppSettingsSidebarComponent,

        SpinnerIcon,

        ScrollToTopButton,

        PageBindedTabBar,

    },

    computed: {

        ...mapGetters(['profileWallpaperImageUrl', 'profileWallpaperActive']),

        isMessengerRoute() {

            return this.$route.name === 'Messenger';

        },

        layoutRootClass() {

            return {

                'has-profile-wallpaper': this.profileWallpaperActive,

                'bg-white dark:bg-[var(--surface-page)]': !this.profileWallpaperActive,

            };

        },

        wallpaperStyle() {

            if (!this.profileWallpaperImageUrl) {

                return {};

            }

            return {

                backgroundImage: `url(${this.profileWallpaperImageUrl})`,

            };

        },

    },

    setup() {

        const { width } = useWindowSize();

        const isMobileLayout = computed(() => width.value < 1024);

        return { isMobileLayout };

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

