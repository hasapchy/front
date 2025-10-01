<template>
    <div class="relative user-profile-dropdown">
        <button @click="toggleDropdown" class="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <img v-if="userPhoto" :src="userPhoto" :alt="userName" class="w-full h-full object-cover">
                <i v-else class="fas fa-user text-gray-500"></i>
            </div>
            <span class="font-semibold">{{ userName }}</span>
            <i class="fas fa-chevron-down text-xs"></i>
        </button>

        <div v-if="isOpen" class="absolute right-0 mt-2 w-auto bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div class="p-4 flex gap-2">
                <!-- Edit Profile Button -->
                <PrimaryButton 
                    :onclick="openProfileModal"
                    :icon="'fas fa-pen'"
                >
                </PrimaryButton>

                <!-- Logout Button -->
                <PrimaryButton 
                    :onclick="logout"
                    :is-danger="true"
                    :icon="'fas fa-sign-out-alt'"
                >
                </PrimaryButton>
            </div>
        </div>

        <!-- Profile Edit Modal -->
        <SideModalDialog :showForm="showProfileModal" :onclose="closeProfileModal" :showTimelineButton="false">
            <ProfileModal 
                ref="profileModalRef"
                @saved="handleProfileSaved" 
                @saved-error="handleProfileSavedError"
                @close-request="closeProfileModal"
            />
        </SideModalDialog>

    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AuthController from '@/api/AuthController';
import PrimaryButton from './buttons/PrimaryButton.vue';
import SideModalDialog from './dialog/SideModalDialog.vue';
import ProfileModal from './ProfileModal.vue';

export default {
    name: 'UserProfileDropdown',
    components: {
        PrimaryButton,
        SideModalDialog,
        ProfileModal
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        
        const isOpen = ref(false);
        const showProfileModal = ref(false);

        const userName = computed(() => store.state.user?.name || '');
        const userEmail = computed(() => store.state.user?.email || '');
        const userPosition = computed(() => store.state.user?.position || '');
        const userRole = computed(() => {
            if (store.state.user?.isAdmin) {
                return 'Administrator';
            }
            // Можно добавить логику для других ролей
            return 'User';
        });
        const userPhoto = computed(() => {
            if (store.state.user?.photo) {
                // Используем UserDto метод если доступен
                if (store.state.user.photoUrl) {
                    return store.state.user.photoUrl();
                }
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${store.state.user.photo}`;
            }
            return null;
        });

        const toggleDropdown = () => {
            isOpen.value = !isOpen.value;
        };

        const closeDropdown = () => {
            isOpen.value = false;
        };

        const openProfileModal = () => {
            closeDropdown();
            showProfileModal.value = true;
        };

        const closeProfileModal = () => {
            showProfileModal.value = false;
        };


        const handleProfileSaved = () => {
            closeProfileModal();
            store.dispatch('showNotification', {
                title: 'Success',
                subtitle: 'Profile updated successfully',
                isDanger: false
            });
        };

        const handleProfileSavedError = (error) => {
            console.error('Error updating profile:', error);
            store.dispatch('showNotification', {
                title: 'Error',
                subtitle: 'Failed to update profile',
                isDanger: true
            });
        };

        const logout = async () => {
            try {
                await AuthController.logout();
                store.commit('SET_USER', null);
                router.push('/auth/login');
            } catch (error) {
                console.error('Error logging out:', error);
            }
        };

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-profile-dropdown')) {
                closeDropdown();
            }
        };

        onMounted(() => {
            document.addEventListener('click', handleClickOutside);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
        });

        return {
            isOpen,
            showProfileModal,
            userName,
            userEmail,
            userPosition,
            userRole,
            userPhoto,
            toggleDropdown,
            closeDropdown,
            openProfileModal,
            closeProfileModal,
            handleProfileSaved,
            handleProfileSavedError,
            logout
        };
    }
};
</script>
