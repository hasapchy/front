<template>
  <div class="relative user-profile">
    <button
      :class="buttonClass"
      @click="openProfileModal"
    >
      <div
        :class="[
          'rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
          variant === 'sidebar' ? 'w-7 h-7 bg-[#3d454c]' : 'w-8 h-8 bg-gray-200'
        ]"
      >
        <img
          v-if="userPhoto"
          :src="userPhoto"
          :alt="userName"
          class="h-full w-full object-center"
          :class="variant === 'sidebar' ? 'object-contain p-0.5' : 'object-cover'"
          @error="applyAvatarImageFallback"
        >
        <i
          v-else
          :class="variant === 'sidebar' ? 'fas fa-user text-gray-400' : 'fas fa-user text-gray-500'"
        />
      </div>
      <span
        :class="[
          'font-semibold truncate',
          variant === 'sidebar' ? 'text-sm text-gray-200' : 'text-gray-700 hidden sm:inline'
        ]"
      >{{ userName }}</span>
    </button>

    <SideModalDialog
      :show-form="showProfileModal"
      :title="$t('sideModalEditProfile')"
      :onclose="closeProfileModal"
      :show-timeline-button="false"
    >
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
import { ref, computed, toRefs } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AuthController from '@/api/AuthController';
import SideModalDialog from './dialog/SideModalDialog.vue';
import ProfileModal from './ProfileModal.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

export default {
    name: 'UserProfileDropdown',
    components: {
        SideModalDialog,
        ProfileModal
    },
    mixins: [getApiErrorMessageMixin],
    props: {
        variant: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'sidebar'].includes(value)
        }
    },
    setup(props) {
        const { variant } = toRefs(props);
        const store = useStore();
        const router = useRouter();
        const { t } = useI18n();
        
        const showProfileModal = ref(false);

        const userName = computed(() => {
            const name = store.state.user?.name ;
            const surname = store.state.user?.surname ;
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

        const buttonClass = computed(() => {
            if (variant.value === 'sidebar') {
                return 'flex w-full min-w-0 items-center justify-center gap-2 text-center text-gray-200 hover:text-white focus:outline-none py-1';
            }
            return 'flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none';
        });

        return {
            showProfileModal,
            userName,
            userPhoto,
            applyAvatarImageFallback,
            openProfileModal,
            closeProfileModal,
            handleProfileSaved,
            handleLogoutFromProfile,
            buttonClass
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
