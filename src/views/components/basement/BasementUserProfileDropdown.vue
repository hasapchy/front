<template>
    <div class="relative user-profile-dropdown">
        <button @click="toggleDropdown" class="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                <img v-if="userPhoto" :src="userPhoto" :alt="userName" class="w-full h-full object-cover">
                <i v-else class="fas fa-user text-gray-500"></i>
            </div>
            <span class="font-semibold">{{ userName }}</span>
            <i class="fas fa-chevron-down text-xs"></i>
        </button>

        <div v-if="isOpen" class="absolute right-0 mt-2 w-auto min-w-[120px] bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div class="p-4 flex gap-2">
                <PrimaryButton 
                    :onclick="openProfileModal"
                    :icon="'fas fa-pen'"
                >
                </PrimaryButton>

                <PrimaryButton 
                    :onclick="logout"
                    :is-danger="true"
                    :icon="'fas fa-sign-out-alt'"
                >
                </PrimaryButton>
            </div>
        </div>

        <SideModalDialog :showForm="showProfileModal" :onclose="closeProfileModal" :showTimelineButton="false">
            <BasementProfileModal 
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
import { useI18n } from 'vue-i18n';
import { BasementAuthController } from '@/api/basement/BasementAuthController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import BasementProfileModal from '@/views/components/basement/BasementProfileModal.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
    name: 'BasementUserProfileDropdown',
    mixins: [getApiErrorMessageMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        BasementProfileModal
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { t } = useI18n();
        
        const isOpen = ref(false);
        const showProfileModal = ref(false);

        const userName = computed(() => {
            const name = store.state.user?.name || '';
            const surname = store.state.user?.surname || '';
            return [name, surname].filter((value) => value && value.trim() !== '').join(' ').trim();
        });
        const userPhoto = computed(() => {
            if (store.state.user?.photo) {
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
                title: t('success'),
                subtitle: t('profileUpdatedSuccessfully'),
                isDanger: false
            });
        };

        const logout = async () => {
            try {
                BasementAuthController.logout();
                store.dispatch('setUser', null);
                store.dispatch('setPermissions', []);
                router.push('/auth/login');
            } catch (error) {
                console.error('Error logging out:', error);
            }
        };

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
            userPhoto,
            toggleDropdown,
            closeDropdown,
            openProfileModal,
            closeProfileModal,
            handleProfileSaved,
            logout
        };
    },
    methods: {
        handleProfileSavedError(error) {
            let messages = this.getApiErrorMessage(error);
            if (Array.isArray(messages) && messages.length === 0) {
                messages = null;
            }
            if (!messages) {
                messages = [this.$t('failedToUpdateProfile')];
            } else if (!Array.isArray(messages)) {
                messages = [messages];
            }
            
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: messages,
                isDanger: true
            });
        }
    }
};
</script>

