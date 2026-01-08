<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ $t('editProfile') }}</h2>
        
        <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
            changeTab(t);
        }" />
        
        <div v-show="currentTab === 'info'">
            <form>
            <!-- Photo Upload -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('profilePhoto') }}</label>
                <div>
                    <input 
                        type="file" 
                        @change="onFileChange" 
                        ref="imageInput"
                    >
                </div>
                <div v-if="selected_image" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                    <img :src="selected_image" alt="Selected Image" class="w-32 h-32 object-cover rounded-full">
                    <button @click="() => { this.selected_image = null; this.image = null }"
                        class="mt-2 text-red-500 text-sm">{{ $t('removeImage') }}</button>
                </div>
                <div v-else-if="$store.state.user?.photo && $store.state.user.photo !== ''" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                    <img :src="getUserPhotoSrc($store.state.user)" alt="Current Photo" class="w-32 h-32 object-cover rounded-full">
                    <button @click="() => { this.$store.state.user.photo = '' }"
                        class="mt-2 text-red-500 text-sm">{{ $t('removeImage') }}</button>
                </div>
            </div>

            <!-- Name -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('name') }}</label>
                <input 
                    v-model="form.name" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Email -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('email') }}</label>
                <input 
                    v-model="form.email" 
                    type="email" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Birthday -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('birthday') }}</label>
                <input 
                    v-model="form.birthday" 
                    type="date" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Current Password -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('currentPassword') }}</label>
                <div class="flex items-center space-x-2">
                    <input 
                        v-model="form.currentPassword" 
                        :type="showCurrentPassword ? 'text' : 'password'" 
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :placeholder="$t('enterCurrentPassword')" autocomplete="on"
                    />
                    <PrimaryButton :onclick="toggleCurrentPasswordVisibility"
                        :icon="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
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
                        :placeholder="$t('enterNewPassword')" autocomplete="on"
                    />
                    <PrimaryButton :onclick="toggleNewPasswordVisibility"
                        :icon="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                    <PrimaryButton :onclick="generateNewPassword" :icon="'fas fa-dice'" class="px-2 py-1" />
                </div>
            </div>

        </form>
        </div>
        
        <div v-show="currentTab === 'balance'">
            <UserClientBalanceTab :editingItem="currentUser" :hideActions="true" />
        </div>
        
        <div v-show="currentTab === 'salary'">
            <UserSalaryTab :editingItem="currentUser" />
        </div>
    </div>
    <div v-show="currentTab === 'info'" class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
        
    <!-- Image Cropper Modal -->
    <ImageCropperModal
        :show="showCropperModal"
        :imageSrc="tempImageSrc"
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
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { defineAsyncComponent } from 'vue';

const UserClientBalanceTab = defineAsyncComponent(() => 
    import('@/views/components/app/UserBalanceTab.vue')
);

const UserSalaryTab = defineAsyncComponent(() => 
    import('@/views/pages/users/UserSalaryTab.vue')
);

export default {
    mixins: [getApiErrorMessage, formChangesMixin, userPhotoMixin],
    emits: ['saved', 'saved-error', 'close-request'],
    components: { PrimaryButton, AlertDialog, ImageCropperModal, TabBar, UserClientBalanceTab, UserSalaryTab },
    data() {
        return {
            saveLoading: false,
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
            selected_image: null,
            image: '',
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            userClientAccount: null,
            showCurrentPassword: false,
            showNewPassword: false,
        };
    },
    computed: {
        userPhoto() {
            if (this.$store.state.user?.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.$store.state.user.photo}`;
            }
            return null;
        },
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
            // Проверяем есть ли у пользователя активные клиентские аккаунты
            return this.$store.state.user?.client_accounts && 
                   this.$store.state.user.client_accounts.length > 0;
        },
        currentClientAccount() {
            // Получаем клиентский аккаунт для текущей компании
            if (!this.$store.state.user?.client_accounts) return null;
            
            const currentCompanyId = this.$store.getters.currentCompanyId;
            const clientAccount = this.$store.state.user.client_accounts.find(
                acc => acc.company_id === currentCompanyId
            );
            
            if (!clientAccount) return null;
            
            // Возвращаем данные клиента в формате, который ожидает ClientBalanceTab
            return {
                id: clientAccount.id,
                clientType: clientAccount.client_type || 'employee',
                balance: clientAccount.balance || '0.00',
                isSupplier: false,
                isConflict: false,
                firstName: clientAccount.first_name || '',
                lastName: '',
                contactPerson: '',
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
    mounted() {
        this.loadUserData();
    },
    methods: {
        changeTab(tabName) {
            this.currentTab = tabName;
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
            this.selected_image = URL.createObjectURL(blob);
            
            
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
                selected_image: this.selected_image,
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
            this.selected_image = null;
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
                    updateData.current_password = this.form.currentPassword;
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
                
                this.$store.commit('SET_USER', savedUser.user);
                
                this.form.name = savedUser.user.name;
                this.form.email = savedUser.user.email;
                this.form.birthday = savedUser.user.birthday
                    ? savedUser.user.birthday.split('T')[0]
                    : '';
                this.form.currentPassword = '';
                this.form.newPassword = '';
                this.showCurrentPassword = false;
                this.showNewPassword = false;
                
                if (savedUser.user && savedUser.user.photo) {
                    this.selected_image = this.getUserPhotoSrc(savedUser.user);
                    this.image = savedUser.user.photo;
                } else {
                    this.selected_image = null;
                    this.image = '';
                }
                if (this.$refs.imageInput) {
                    this.$refs.imageInput.value = null;
                }
                
                this.resetFormChanges();
                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            }
            this.saveLoading = false;
        }
    },
    watch: {
        '$store.state.user': {
            handler(newUser) {
                if (newUser) {
                    this.form = {
                        name: newUser.name || '',
                        email: newUser.email || '',
                        birthday: newUser.birthday
                            ? newUser.birthday.split('T')[0]
                            : '',
                        currentPassword: '',
                        newPassword: ''
                    };
                    this.selected_image = this.getUserPhotoSrc(newUser);
                    this.image = newUser.photo || '';
                }
            },
            deep: true,
            immediate: true
        }
    }
};
</script>
