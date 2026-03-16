<template>
    <div class="relative user-profile">
        <button @click="openProfileModal" class="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                <img v-if="userPhoto" :src="userPhoto" :alt="userName" class="w-full h-full object-cover">
                <i v-else class="fas fa-user text-gray-500"></i>
            </div>
            <span class="font-semibold hidden sm:inline">{{ userName }}</span>
        </button>

        <SideModalDialog :showForm="showProfileModal" :onclose="closeProfileModal" :showTimelineButton="false">
            <ProfileModal
                @saved="handleProfileSaved" 
                @saved-error="handleProfileSavedError"
                @close-request="closeProfileModal"
                @logout="handleLogoutFromProfile"
            />
        </SideModalDialog>

    </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AuthController from '@/api/AuthController';
import SideModalDialog from './dialog/SideModalDialog.vue';
import ProfileModal from './ProfileModal.vue';
import errorMessageMixin from '@/mixins/errorMessageMixin';
import { getUserPhotoSrc } from '@/utils/userUtils';

export default {
    name: 'UserProfileDropdown',
    mixins: [errorMessageMixin],
    components: {
        SideModalDialog,
        ProfileModal
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { t } = useI18n();
        
        const showProfileModal = ref(false);

        const userName = computed(() => {
            const name = store.state.user?.name || '';
            const surname = store.state.user?.surname || '';
            return [name, surname].filter((value) => value && value.trim() !== '').join(' ').trim();
        });
        const userPhoto = computed(() => {
            const user = store.state.user;
            if (!user) return null;
            const src = getUserPhotoSrc(user);
            return src || null;
        });

        const openProfileModal = () => {
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
                await AuthController.logout();
                store.commit('SET_USER', null);
                router.push('/auth/login');
            } catch (error) {
                console.error('Error logging out:', error);
            }
        };

        const handleLogoutFromProfile = () => {
            closeProfileModal();
            logout();
        };

        return {
            showProfileModal,
            userName,
            userPhoto,
            openProfileModal,
            closeProfileModal,
            handleProfileSaved,
            handleLogoutFromProfile
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
