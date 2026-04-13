<template>
  <!-- Один столбец: скролл только у середины, иначе футер с logout обрезается overflow-hidden у SideModalDialog -->
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
    <TabBar
      :key="`tabs-${$i18n.locale}`"
      :tabs="translatedTabs"
      :active-tab="currentTab"
      :tab-click="(t) => {
        changeTab(t);
      }"
    />
        
    <div v-show="currentTab === 'info'">
      <form>
        <!-- Photo Upload -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('profilePhoto') }}</label>
          <div>
            <input 
              ref="imageInput" 
              type="file" 
              @change="onFileChange"
            >
          </div>
          <div
            v-if="selectedImage"
            class="mt-2 p-3 bg-gray-100 rounded"
          >
            <img
              :src="selectedImage"
              alt="Selected Image"
              class="w-32 h-32 object-cover rounded-full"
            >
            <button
              class="mt-2 text-red-500 text-sm"
              @click="() => { selectedImage = null; image = null }"
            >
              {{ $t('removeImage') }}
            </button>
          </div>
          <div
            v-else-if="$store.state.user?.photo && $store.state.user.photo !== ''"
            class="mt-2 p-3 bg-gray-100 rounded"
          >
            <img
              :src="getUserPhotoSrc($store.state.user)"
              alt="Current Photo"
              class="w-32 h-32 object-cover rounded-full"
              @error="applyAvatarImageFallback"
            >
            <button
              class="mt-2 text-red-500 text-sm"
              @click="() => { $store.state.user.photo = '' }"
            >
              {{ $t('removeImage') }}
            </button>
          </div>
        </div>

        <!-- Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('name') }}</label>
          <input 
            v-model="form.name" 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('email') }}</label>
          <input 
            v-model="form.email" 
            type="email" 
            autocomplete="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Birthday -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('birthday') }}</label>
          <input 
            v-model="form.birthday" 
            type="date" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- Current Password -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('currentPassword') }}</label>
          <div class="flex items-center space-x-2">
            <input 
              v-model="form.currentPassword" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="$t('enterCurrentPassword')"
              autocomplete="new-password"
            >
            <PrimaryButton
              :onclick="toggleCurrentPasswordVisibility"
              :icon="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
              class="px-2 py-1"
            />
          </div>
        </div>

        <!-- New Password -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('newPassword') }}</label>
          <div class="flex items-center space-x-2">
            <input 
              v-model="form.newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="$t('enterNewPassword')"
              autocomplete="new-password"
            >
            <PrimaryButton
              :onclick="toggleNewPasswordVisibility"
              :icon="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
              class="px-2 py-1"
            />
            <PrimaryButton
              :onclick="generateNewPassword"
              :icon="'fas fa-dice'"
              class="px-2 py-1"
              :aria-label="$t('generatePassword')"
            />
          </div>
        </div>
      </form>
    </div>
        
    <div v-show="currentTab === 'balance'">
      <UserClientBalanceTab
        :editing-item="currentUser"
        :hide-actions="true"
      />
    </div>
        
    <div v-show="currentTab === 'salary'">
      <UserSalaryTab :editing-item="currentUser" />
    </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <template v-if="currentTab === 'info'">
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :aria-label="$t('save')"
          />
        </template>
        <PrimaryButton
          icon="fas fa-sign-out-alt"
          :onclick="handleLogout"
          :is-danger="true"
          :aria-label="$t('logout')"
        />
      </div>
    </teleport>
  </div>

  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
  <AlertDialog
    :dialog="logoutConfirmDialog"
    :descr="$t('confirmLogout')"
    :confirm-text="$t('logout')"
    :leave-text="$t('cancel')"
    @confirm="confirmLogout"
    @leave="cancelLogout"
  />
        
  <!-- Image Cropper Modal -->
  <ImageCropperModal
    :show="showCropperModal"
    :image-src="tempImageSrc"
    @close="closeCropperModal"
    @cropped="handleCroppedImage"
  />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import UsersController from '@/api/UsersController';
import UserClientBalanceTab from '@/views/components/app/UserBalanceTab.vue';
import UserSalaryTab from '@/views/pages/users/UserSalaryTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

export default {
    components: { PrimaryButton, AlertDialog, ImageCropperModal, TabBar, UserClientBalanceTab, UserSalaryTab },
    mixins: [getApiErrorMessage, crudFormMixin, userPhotoMixin, sideModalFooterPortal],
    emits: ['saved', 'saved-error', 'close-request', 'logout'],
    data() {
        return {
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'profileInfo' },
                { name: 'balance', label: 'balance' },
                { name: 'salary', label: 'salaries' }
            ],
            form: {
                name: '',
                email: '',
                birthday: '',
                currentPassword: '',
                newPassword: ''
            },
            selectedImage: null,
            image: '',
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            userClientAccount: null,
            showCurrentPassword: false,
            showNewPassword: false,
            logoutConfirmDialog: false,
        };
    },
    computed: {
        translatedTabs() {
            const visibleTabs = [];
            
            visibleTabs.push(this.tabs[0]);
            
            if (this.$store.getters.hasPermission('settings_client_balance_view') || 
                this.$store.getters.hasPermission('settings_client_balance_view_own')) {
                visibleTabs.push(this.tabs[1]);
            }
            
            visibleTabs.push(this.tabs[2]);
            
            return visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        currentUser() {
            if (!this.$store.state.user) return null;
            
            return {
                id: this.$store.state.user.id,
                name: this.$store.state.user.name,
                email: this.$store.state.user.email
            };
        },
        hasClientAccount() {
            return this.clientAccounts.length > 0;
        },
        clientAccounts() {
            const accounts = this.$store.state.user?.clientAccounts || [];
            return (accounts || []).map((account) => ({
                ...account,
                companyId: account.companyId,
                clientType: account.clientType,
                firstName: account.firstName,
            }));
        },
        currentClientAccount() {
            const currentCompanyId = this.$store.getters.currentCompanyId;
            const clientAccount = this.clientAccounts.find(
                acc => Number(acc.companyId) === Number(currentCompanyId)
            );
            
            if (!clientAccount) return null;
            
            // Возвращаем данные клиента в формате, который ожидает ClientBalanceTab
            return {
                id: clientAccount.id,
                clientType: clientAccount.clientType || 'employee',
                balance: clientAccount.balance || '0.00',
                isSupplier: false,
                isConflict: false,
                firstName: clientAccount.firstName,
                lastName: '',
                address: '',
                note: '',
                status: clientAccount.status || 'active',
                discountType: 'none',
                discount: 0,
                createdAt: '',
                updatedAt: '',
                emails: [],
                phones: []
            };
        }
    },
    watch: {
        '$store.state.user': {
            handler(newUser) {
                if (newUser) {
                    this.form = {
                        name: newUser.name ,
                        email: newUser.email ,
                        birthday: newUser.birthday
                            ? newUser.birthday.split('T')[0]
                            : '',
                        currentPassword: '',
                        newPassword: ''
                    };
                    this.selectedImage = this.getUserPhotoSrc(newUser);
                    this.image = newUser.photo ;
                }
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.loadUserData();
    },
    methods: {
        applyAvatarImageFallback,
        changeTab(tabName) {
            this.currentTab = tabName;
        },
        handleLogout() {
            this.logoutConfirmDialog = true;
        },
        confirmLogout() {
            this.logoutConfirmDialog = false;
            this.$emit('logout');
        },
        cancelLogout() {
            this.logoutConfirmDialog = false;
        },
        loadUserData() {
            this.$nextTick(() => {
                this.saveInitialState();
            });
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                // Проверяем, что файл является изображением
                if (!file.type.startsWith('image/')) {
                    alert(this.$t('onlyImagesAllowed'));
                    event.target.value = '';
                    return;
                }
                // Открываем модальное окно для обрезки
                this.tempImageSrc = URL.createObjectURL(file);
                this.showCropperModal = true;
            }
        },
        
        closeCropperModal() {
            this.showCropperModal = false;
            this.tempImageSrc = '';
            
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = '';
            }
        },
        
        handleCroppedImage(blob) {
            
            const fileName = `cropped_profile_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Сохраняем обрезанный файл
            this.croppedFile = file;
            this.selectedImage = URL.createObjectURL(blob);
            
            
            this.closeCropperModal();
        },


        handleCloseRequest() {
            if (this.checkForChanges()) {
                this.closeConfirmDialog = true;
            } else {
                this.closeForm();
            }
        },

        getFormState() {
            return {
                name: this.form.name,
                email: this.form.email,
                birthday: this.form.birthday,
                currentPassword: this.form.currentPassword,
                newPassword: this.form.newPassword,
                selectedImage: this.selectedImage,
                image: this.image
            };
        },

        confirmClose() {
            this.closeConfirmDialog = false;
            this.closeForm();
        },

        cancelClose() {
            this.closeConfirmDialog = false;
        },

        closeForm() {
            this.selectedImage = null;
            this.image = '';
            this.croppedFile = null;
            this.showCropperModal = false;
            this.tempImageSrc = '';
            this.showCurrentPassword = false;
            this.showNewPassword = false;
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.$emit('close-request');
        },


        toggleCurrentPasswordVisibility() {
            this.showCurrentPassword = !this.showCurrentPassword;
        },
        toggleNewPasswordVisibility() {
            this.showNewPassword = !this.showNewPassword;
        },
        generateNewPassword() {
            this.form.newPassword = this.generateRandomPassword();
        },
        generateRandomPassword() {
            const length = 12;
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let password = "";
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return password;
        },
        async save() {
            this.saveLoading = true;
            try {
                const updateData = {
                    name: this.form.name,
                    email: this.form.email,
                    birthday: this.form.birthday,
                };
                
                if (this.form.currentPassword && this.form.currentPassword.trim() !== '') {
                    updateData.currentPassword = this.form.currentPassword;
                }
                
                if (this.form.newPassword && this.form.newPassword.trim() !== '') {
                    updateData.password = this.form.newPassword;
                }
                
                if (this.$store.state.user && this.$store.state.user.photo === '') {
                    updateData.photo = '';
                }
                
                // Используем обрезанный файл, если он есть, иначе файл из input
                const fileToUpload = this.croppedFile || this.$refs.imageInput?.files[0];
                
                const savedUser = await UsersController.updateProfile(updateData, fileToUpload);
                const user = savedUser.data;

                this.$store.commit('SET_USER', user);

                this.form.name = user.name;
                this.form.email = user.email;
                this.form.birthday = user.birthday
                    ? user.birthday.split('T')[0]
                    : '';
                this.form.currentPassword = '';
                this.form.newPassword = '';
                this.showCurrentPassword = false;
                this.showNewPassword = false;

                if (user && user.photo) {
                    this.selectedImage = this.getUserPhotoSrc(user);
                    this.image = user.photo;
                } else {
                    this.selectedImage = null;
                    this.image = '';
                }
                if (this.$refs.imageInput) {
                    this.$refs.imageInput.value = null;
                }
                
                this.resetFormChanges();
                this.$emit('saved');
            } catch (e) {
                this.emitSavedError(e);
            }
            this.saveLoading = false;
        }
    }
};
</script>
