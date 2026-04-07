<template>
  <div class="relative user-profile">
    <button
      :class="buttonClass"
      @click="openProfileModal"
    >
      <div
        :class="[
          'rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
          variant === 'sidebar' ? 'w-7 h-7 bg-[#3d454c]' : '',
          variant === 'header' ? 'h-8 w-8 bg-gray-200' : '',
          variant === 'default' ? 'w-8 h-8 bg-gray-200' : ''
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
          :class="avatarIconClass"
        />
      </div>
      <div
        v-if="variant === 'header'"
        class="flex min-h-8 min-w-0 flex-col justify-center gap-0 text-left leading-none"
      >
        <span class="truncate text-[11px] font-semibold leading-[1.2] text-gray-900 dark:text-gray-900">{{ userName }}</span>
        <span
          v-if="userRoleText"
          class="truncate text-[10px] font-normal leading-[1.2] text-gray-500 dark:text-gray-600"
        >{{ userRoleText }}</span>
      </div>
      <span
        v-else
        :class="nameClass"
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
            validator: (value) => ['default', 'sidebar', 'header'].includes(value)
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

        const userRoleText = computed(() => {
            const user = store.state.user;
            if (!user) {
                return '';
            }
            if (user.isAdmin === true || Number(user.is_admin) === 1) {
                return t('isAdmin');
            }
            const roles = user.roles;
            if (!Array.isArray(roles) || roles.length === 0) {
                return '';
            }
            const parts = roles
                .map((r) => (typeof r === 'string' ? r : r?.name))
                .filter((value) => value && String(value).trim() !== '');
            if (parts.length === 0) {
                return '';
            }
            return parts.join(', ');
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
            if (variant.value === 'header') {
                return 'flex min-h-8 min-w-0 max-w-[14rem] items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-2.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:bg-white dark:hover:bg-white/90';
            }
            return 'flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none';
        });

        const nameClass = computed(() => {
            if (variant.value === 'sidebar') {
                return 'font-semibold truncate text-sm text-gray-200';
            }
            return 'font-semibold truncate text-gray-700 hidden sm:inline';
        });

        const avatarIconClass = computed(() => {
            if (variant.value === 'sidebar') {
                return 'fas fa-user text-gray-400';
            }
            if (variant.value === 'header') {
                return 'fas fa-user text-gray-500';
            }
            return 'fas fa-user text-gray-500';
        });

        return {
            showProfileModal,
            userName,
            userPhoto,
            userRoleText,
            applyAvatarImageFallback,
            openProfileModal,
            closeProfileModal,
            handleProfileSaved,
            handleLogoutFromProfile,
            buttonClass,
            nameClass,
            avatarIconClass
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
