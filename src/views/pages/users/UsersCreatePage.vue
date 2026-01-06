<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? (editingItem.name || $t('editUser')) : $t('createUser') }}
        </h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
            changeTab(t);
        }
            " :key="`tabs-${$i18n.locale}`" />
        <div>
            <div v-show="currentTab === 'info'">
                <!-- Photo Upload -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('profilePhoto') }}</label>
                    <div>
                        <input type="file" @change="onFileChange" ref="imageInput">
                    </div>
                    <div v-if="selected_image" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                        <img :src="selected_image" alt="Selected Image" class="w-32 h-32 object-cover rounded-full">
                        <button @click="() => { this.selected_image = null; this.image = null }"
                            class="mt-2 text-red-500 text-sm">{{ $t('removeImage') }}</button>
                    </div>
                    <div v-else-if="editingItem?.photo && editingItem.photo !== ''"
                        class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                        <img :src="getUserPhotoSrc(editingItem)" alt="Current Photo"
                            class="w-32 h-32 object-cover rounded-full">
                        <button @click="() => { this.editingItem.photo = '' }" class="mt-2 text-red-500 text-sm">{{
                            $t('removeImage') }}</button>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('firstName') }}</label>
                    <input type="text" v-model="form.name"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('lastName') }}</label>
                    <input type="text" v-model="form.surname"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('email') }}</label>
                    <input type="email" v-model="form.email"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required />
                </div>

                <div class="mb-4" v-if="!editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('password') }}</label>
                    <div class="flex items-center space-x-2">
                        <input :type="showPassword ? 'text' : 'password'" v-model="form.password"
                            :placeholder="$t('enterPassword')"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required />
                        <PrimaryButton :onclick="togglePasswordVisibility"
                            :icon="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                        <PrimaryButton :onclick="generatePassword" :icon="'fas fa-dice'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4" v-if="!editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('confirmPassword')
                        }}</label>
                    <div class="flex items-center space-x-2">
                        <input :type="showConfirmPassword ? 'text' : 'password'" v-model="form.confirmPassword"
                            :placeholder="$t('confirmPassword')"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required />
                        <PrimaryButton :onclick="toggleConfirmPasswordVisibility"
                            :icon="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4" v-if="editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('newPassword') }}</label>
                    <div class="flex items-center space-x-2">
                        <input :type="showNewPassword ? 'text' : 'password'" v-model="form.newPassword"
                            :placeholder="$t('enterNewPassword')"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <PrimaryButton :onclick="toggleNewPasswordVisibility"
                            :icon="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                        <PrimaryButton :onclick="generateNewPassword" :icon="'fas fa-dice'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('position') }}</label>
                    <input type="text" v-model="form.position"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('hireDate') }}</label>
                    <input type="date" v-model="form.hire_date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('birthday') }}</label>
                    <input type="date" v-model="form.birthday"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('characteristics') }}</label>
                    <div class="flex items-center space-x-6">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" v-model="form.is_active" :true-value="true" :false-value="false"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="text-sm text-gray-700">{{ $t('userStatus') }}</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" v-model="form.is_admin" :true-value="true" :false-value="false"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span class="text-sm text-gray-700">{{ $t('isAdmin') }}</span>
                        </label>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('companies') }}</label>
                    <div class="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                        <div v-for="company in companies" :key="company.id" class="flex items-center space-x-2 mb-2">
                            <input type="checkbox" :id="`company-${company.id}`" :value="company.id"
                                v-model="form.companies"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label :for="`company-${company.id}`" class="text-sm text-gray-700 cursor-pointer">{{
                                company.name }}</label>
                        </div>
                    </div>
                </div>
            </div>
            <div v-show="currentTab === 'roles'">
                <div class="mb-4">
                    <label class="font-semibold mb-2 block">{{ $t('roles') }}</label>
                    <p class="text-sm text-gray-600 mb-3">{{ $t('selectRolesByCompany') }}</p>
                    
                    <div v-if="selectedCompanies && selectedCompanies.length > 0" class="space-y-4">
                        <div v-for="company in selectedCompanies" :key="company.id" class="border border-gray-300 rounded-md p-3 bg-gray-50">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-semibold text-sm">{{ company.name }}</div>
                                <button 
                                    v-if="getCompanyRole(company.id)"
                                    @click="clearCompanyRole(company.id)"
                                    type="button"
                                    class="text-xs text-red-600 hover:text-red-800">
                                    {{ $t('clear') || 'Очистить' }}
                                </button>
                            </div>
                            <div v-if="getRolesForCompany(company.id).length > 0" class="max-h-48 overflow-y-auto">
                                <div v-for="role in getRolesForCompany(company.id)" :key="role.id" class="flex items-center space-x-2 mb-2">
                                    <input 
                                        type="radio" 
                                        :id="`role-${company.id}-${role.id}`" 
                                        :name="`company-${company.id}-role`"
                                        :value="role.name"
                                        @change="updateCompanyRole(company.id, role.name)"
                                        :checked="getCompanyRole(company.id) === role.name"
                                        class="border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <label :for="`role-${company.id}-${role.id}`" class="text-sm text-gray-700 cursor-pointer flex-1">
                                        {{ role.name }}
                                        <span v-if="role.permissions && role.permissions.length > 0" class="text-xs text-gray-500 ml-2">
                                            ({{ role.permissions.length }} {{ $t('permissions') }})
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div v-else class="text-gray-500 text-sm">{{ $t('noRolesAvailable') }}</div>
                        </div>
                    </div>
                    <div v-else class="text-gray-500 text-sm">{{ $t('noCompaniesAvailable') }}</div>
                </div>
            </div>
            <div v-show="currentTab === 'salaries' && editingItem && canViewSalariesTab" class="mt-4">
                <UserSalaryTab :editing-item="editingItem" />
            </div>
            <div v-show="currentTab === 'balance' && editingItem && canViewBalanceTab" class="mt-4">
                <UserBalanceTab :editing-item="editingItem" />
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!$store.getters.hasPermission('users_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('users_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('users_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

    <!-- Image Cropper Modal -->
    <ImageCropperModal :show="showCropperModal" :imageSrc="tempImageSrc" @close="closeCropperModal"
        @cropped="handleCroppedImage" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import UsersController from '@/api/UsersController';
import CompaniesController from '@/api/CompaniesController';
import RolesController from '@/api/RolesController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import userPhotoMixin from '@/mixins/userPhotoMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import AuthController from '@/api/AuthController';
import UserSalaryTab from '@/views/pages/users/UserSalaryTab.vue';
import UserBalanceTab from '@/views/components/app/UserBalanceTab.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, userPhotoMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar, ImageCropperModal, UserSalaryTab, UserBalanceTab },
    props: {
        editingItem: { type: Object, required: false, default: null },
    },
    data() {
        return {
            form: {
                name: '',
                surname: '',
                email: '',
                password: '',
                confirmPassword: '',
                newPassword: '',
                position: '',
                hire_date: '',
                birthday: '',
                is_active: true,
                is_admin: false,
                companies: [],
                roles: [],
                company_roles: [],
            },
            editingItemId: null,
            companies: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            showPassword: false,
            showConfirmPassword: false,
            showNewPassword: false,
            selected_image: null,
            image: '',
            hasNewFile: false,
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            tabs: [
                { name: 'info', label: 'information' },
                { name: 'roles', label: 'roles' },
                { name: 'salaries', label: 'salaries' },
                { name: 'balance', label: 'balance' }
            ],
            allRoles: [],
        };
    },
    computed: {
        translatedTabs() {
            let visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
                tab.name !== 'salaries' && tab.name !== 'balance'
            );
            if (!this.canViewSalariesTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'salaries');
            }
            if (!this.canViewRolesTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'roles');
            }
            if (!this.canViewBalanceTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'balance');
            }
            return visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        canViewBalanceTab() {
            return this.$store.getters.hasPermission('users_view');
        },
        canViewSalariesTab() {
            if (!this.$store.getters.hasPermission('employee_salaries_view')) {
                return false;
            }
            
            if (this.$store.getters.hasPermission('employee_salaries_view_all')) {
                return true;
            }
            
            if (this.editingItem) {
                const currentUser = this.$store.getters.user;
                return currentUser && currentUser.id === this.editingItem.id;
            }
            
            return false;
        },
        canViewRolesTab() {
            return this.$store.getters.hasPermission('roles_view');
        },
        selectedCompanies() {
            if (this.form.companies && this.form.companies.length > 0) {
                return this.companies.filter(c => this.form.companies.includes(c.id));
            }
            return this.companies;
        }
    },
    mounted() {
        if (typeof window !== 'undefined') {
            window.i18n = this.$i18n;
        }

        this.$nextTick(async () => {
            const promises = [this.fetchCompanies()];
            if (this.canViewRolesTab) {
                promises.push(this.fetchRoles());
            }
            await Promise.all(promises);

            if (!this.editingItem) {
                this.clearForm();
            }

            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.form.name,
                surname: this.form.surname,
                email: this.form.email,
                password: this.form.password,
                confirmPassword: this.form.confirmPassword,
                newPassword: this.form.newPassword,
                position: this.form.position,
                hire_date: this.form.hire_date,
                birthday: this.form.birthday,
                is_active: this.form.is_active,
                is_admin: this.form.is_admin,
                companies: [...this.form.companies],
                roles: [...this.form.roles],
                selected_image: this.selected_image,
                image: this.image
            };
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
            } else {
                this.hasNewFile = false;
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

            const fileName = `cropped_user_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            // Сохраняем обрезанный файл
            this.croppedFile = file;
            this.selected_image = URL.createObjectURL(blob);
            this.hasNewFile = true;


            this.closeCropperModal();
        },
        async fetchCompanies() {
            try {
                const result = await CompaniesController.getItems(1, 1000);
                this.companies = result.items || [];
            } catch (error) {
                console.error('Error fetching companies:', error);
                this.companies = [];
            }
        },
        async fetchRoles() {
            try {
                this.allRoles = await RolesController.getListItems({ all_companies: true });
            } catch (error) {
                console.error('Error fetching roles:', error);
                this.allRoles = [];
            }
        },
        clearForm() {
            this.form.name = '';
            this.form.surname = '';
            this.form.email = '';
            this.form.password = '';
            this.form.confirmPassword = '';
            this.form.newPassword = '';
            this.form.position = '';
            this.form.hire_date = '';
            this.form.birthday = '';
            this.form.is_active = true;
            this.form.is_admin = false;
            this.form.companies = [];
            this.form.roles = [];
            this.form.company_roles = [];
            this.selected_image = null;
            this.image = null;
            this.hasNewFile = false;
            this.croppedFile = null;
            this.showCropperModal = false;
            this.tempImageSrc = '';
            this.editingItemId = null;
            this.showPassword = false;
            this.showConfirmPassword = false;
            this.showNewPassword = false;
            this.currentTab = 'info'; // Сбрасываем на первую вкладку
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.resetFormChanges();
        },
        // Методы для crudFormMixin
        prepareSave() {
            if (!this.editingItemId && this.form.password !== this.form.confirmPassword) {
                throw new Error(this.$t('passwordsDoNotMatch'));
            }

            const selectedCompanies = Array.isArray(this.form.companies)
                ? this.form.companies.filter((companyId) => companyId !== null && companyId !== undefined && `${companyId}` !== '')
                : typeof this.form.companies === 'string'
                    ? this.form.companies.split(',').filter((c) => c.trim() !== '')
                    : [];

            if (!selectedCompanies?.length) {
                throw new Error(this.$t('companiesRequired'));
            }

            const formData = this.prepareUserData();
            if (this.editingItemId && this.form.newPassword) {
                formData.password = this.form.newPassword;
            }
            if (this.editingItem && this.editingItem.photo === '') {
                formData.photo = '';
            }
            return formData;
        },
        async performSave(data) {
            const fileToUpload = this.hasNewFile ? (this.croppedFile || this.$refs.imageInput?.files[0]) : null;
            let savedUser;

            if (this.editingItemId) {
                savedUser = await UsersController.updateItem(this.editingItemId, data, fileToUpload);
            } else {
                savedUser = await UsersController.storeItem(data, fileToUpload);
            }

            const currentUser = this.$store.state.user;
            if (savedUser.user && savedUser.user.id === currentUser.id) {
                this.$store.commit('SET_USER', savedUser.user);
                if (savedUser.permissions) {
                    this.$store.commit('SET_PERMISSIONS', savedUser.permissions);
                }
            }

            if (savedUser.user && savedUser.user.photo) {
                this.selected_image = this.getUserPhotoSrc(savedUser.user);
                this.image = savedUser.user.photo;
            } else {
                this.selected_image = null;
                this.image = '';
            }

            this.hasNewFile = false;
            return savedUser.user || data;
        },
        // Метод save() теперь используется из crudFormMixin
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword;
        },
        toggleConfirmPasswordVisibility() {
            this.showConfirmPassword = !this.showConfirmPassword;
        },
        toggleNewPasswordVisibility() {
            this.showNewPassword = !this.showNewPassword;
        },
        generatePassword() {
            const password = this.generateRandomPassword();
            this.form.password = password;
            this.form.confirmPassword = password;
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
        changeTab(tab) {
            this.currentTab = tab;
        },
        getRolesForCompany(companyId) {
            if (!this.allRoles?.length) {
                return [];
            }
            return this.allRoles.filter(role => role.companyId === null || role.companyId === companyId);
        },
        updateCompanyRole(companyId, roleName) {
            let companyRole = this.form.company_roles.find(cr => cr.company_id === companyId);
            
            if (companyRole) {
                companyRole.role_ids = [roleName];
            } else {
                companyRole = { company_id: companyId, role_ids: [roleName] };
                this.form.company_roles.push(companyRole);
            }
        },
        getCompanyRole(companyId) {
            const companyRole = this.form.company_roles.find(cr => cr.company_id === companyId);
            return companyRole?.role_ids?.length 
                ? companyRole.role_ids[0] 
                : null;
        },
        clearCompanyRole(companyId) {
            this.form.company_roles = this.form.company_roles.filter(cr => cr.company_id !== companyId);
        },
        prepareUserData() {
            const data = {
                name: this.form.name,
                surname: this.form.surname,
                email: this.form.email,
                position: this.form.position,
                hire_date: this.form.hire_date,
                birthday: this.form.birthday,
                is_active: this.form.is_active,
                is_admin: this.form.is_admin,
                companies: Array.isArray(this.form.companies) ? this.form.companies : this.form.companies.split(',').filter(c => c.trim() !== ''),
            };

            if (!this.editingItemId) {
                data.password = this.form.password;
            }

            if (this.form.company_roles?.length) {
                data.company_roles = this.form.company_roles;
            } else if (this.form.roles?.length) {
                data.roles = Array.isArray(this.form.roles) ? this.form.roles : (this.form.roles ? this.form.roles.split(',').filter(r => r.trim() !== '') : []);
            }

            return data;
        },

        // Метод для crudFormMixin
        async performDelete() {
            await UsersController.deleteItem(this.editingItemId);
            return { message: 'deleted' };
        },
        // Метод deleteItem() теперь используется из crudFormMixin
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.form.name = newEditingItem.name || '';
                this.form.surname = newEditingItem.surname || '';
                this.form.email = newEditingItem.email || '';
                this.form.position = newEditingItem.position || '';
                this.form.hire_date = newEditingItem.hireDate
                    ? newEditingItem.hireDate.split('T')[0]
                    : '';
                this.form.birthday = newEditingItem.birthday
                    ? newEditingItem.birthday.split('T')[0]
                    : '';
                this.form.is_active = newEditingItem.isActive !== undefined ? newEditingItem.isActive : true;
                this.form.is_admin = newEditingItem.isAdmin !== undefined ? newEditingItem.isAdmin : false;
                this.form.companies = newEditingItem.companies?.map(c => c.id) || [];
                this.form.roles = newEditingItem.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
                
                if (newEditingItem.company_roles && Array.isArray(newEditingItem.company_roles)) {
                    this.form.company_roles = newEditingItem.company_roles.map(cr => ({
                        company_id: cr.company_id,
                        role_ids: Array.isArray(cr.role_ids) ? cr.role_ids : (cr.role_ids ? cr.role_ids.split(',') : [])
                    }));
                } else {
                    this.form.company_roles = [];
                }
                
                this.currentTab = 'info';

                if (newEditingItem.photo) {
                    this.selected_image = this.getUserPhotoSrc(newEditingItem);
                } else {
                    this.selected_image = null;
                    this.image = '';
                }
                this.hasNewFile = false;
            }
        }
    }
};
</script>
