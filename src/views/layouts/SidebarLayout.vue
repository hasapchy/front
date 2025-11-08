<template>
    <transition name="fade" mode="out-in">
        <div v-if="$store.state.user !== null" key="routerview" class="flex min-h-screen h-100 bg-white overflow-x-hidden">
            <AppSidebarComponent />
            <transition name="settings-sidebar">
                <AppSettingsSidebarComponent v-if="this.$store.state.settings_open" />
            </transition>
            <div id="main-content" class="flex flex-col flex-1 transition-transform duration-300 h-full overflow-x-hidden">
                <AppHeaderComponent />
                <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-0">
                    <router-view />
                </main>
            </div>
            <NotificationToast
                :title="$store.getters.notificationTitle"
                :subtitle="$store.getters.notificationSubtitle"
                :show="$store.getters.notification"
                :is-danger="$store.getters.notificationIsDanger"
                @close="$store.dispatch('closeNotification')"
            />
        </div>
        <div v-else key="loader" class="h-screen flex items-center justify-center">
            <SpinnerIcon />
        </div>
    </transition>
</template>

<script>
import AppHeaderComponent from '../components/app/AppHeaderComponent.vue';
import AppSidebarComponent from '../components/app/sidebar/AppSidebarComponent.vue';
import AppSettingsSidebarComponent from '../components/app/sidebar/AppSettingsSidebarComponent.vue';
import NotificationToast from '../components/app/dialog/NotificationToast.vue';

export default {
    components: {
        AppHeaderComponent,
        AppSidebarComponent,
        AppSettingsSidebarComponent,
        NotificationToast
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