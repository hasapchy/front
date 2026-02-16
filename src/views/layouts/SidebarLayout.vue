<template>
    <transition name="fade" mode="out-in">
        <div v-if="$store.state.user !== null" key="routerview" class="flex h-screen max-h-screen bg-white overflow-hidden relative">
            <AppSidebarComponent />
            <transition name="settings-sidebar">
                <AppSettingsSidebarComponent v-if="this.$store.state.settings_open && !isMobile" />
            </transition>
            <div id="main-content" class="flex flex-col w-full flex-1 min-w-0 min-h-0 transition-transform duration-300 overflow-x-hidden">
                <AppHeaderComponent />
                <main class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pt-0">
                    <router-view />
                </main>
            </div>
            <ScrollToTopButton />
            <!-- ✅ Полноэкранный спиннер при загрузке данных компании -->
            <!-- Временно отключен -->
            <!--
            <transition name="fade">
                <div 
                    v-if="isLoadingCompanyData" 
                    class="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-[9999] flex items-center justify-center"
                    @click.self.prevent
                    @contextmenu.prevent
                    style="pointer-events: all;"
                >
                    <div class="bg-white rounded-xl p-8 shadow-2xl border border-gray-200 flex flex-col items-center gap-4">
                        <SpinnerIcon />
                        <p class="text-gray-700 font-medium">Загрузка данных компании...</p>
                    </div>
                </div>
            </transition>
            -->
        </div>
        <div v-else key="loader" class="h-screen flex items-center justify-center">
            <SpinnerIcon />
        </div>
    </transition>
</template>

<script>
import { useWindowSize } from '@vueuse/core';
import AppHeaderComponent from '../components/app/AppHeaderComponent.vue';
import AppSidebarComponent from '../components/app/sidebar/AppSidebarComponent.vue';
import AppSettingsSidebarComponent from '../components/app/sidebar/AppSettingsSidebarComponent.vue';
import SpinnerIcon from '../components/app/SpinnerIcon.vue';
import ScrollToTopButton from '../components/app/ScrollToTopButton.vue';

export default {
    components: {
        AppHeaderComponent,
        AppSidebarComponent,
        AppSettingsSidebarComponent,
        SpinnerIcon,
        ScrollToTopButton
    },
    setup() {
        const { width } = useWindowSize();
        return { windowWidth: width };
    },
    computed: {
        isMobile() {
            return this.windowWidth < 1024;
        },
        isLoadingCompanyData() {
            return this.$store.state.loadingFlags?.companyData || false;
        }
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