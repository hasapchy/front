<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 overflow-auto p-4">
      <h2 class="text-lg font-bold mb-4">
        {{ editingItem ? (editingItem.name || $t('editUser')) : $t('createUser')
        }}
      </h2>
      <TabBar
        :key="`tabs-${$i18n.locale}`"
        :tabs="translatedTabs"
        :active-tab="currentTab"
        :tab-click="(t) => {
          changeTab(t);
        }
        "
      />
      <div>
        <div v-show="currentTab === 'info'">
          <div class="mt-2 flex items-start">
            <div class="flex-1">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('firstName') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('lastName') }}</label>
                <input
                  v-model="form.surname"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('email') }}</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('phoneNumber') }}</label>
                <PhoneInputWithCountry
                  v-model="phoneDisplay"
                  :default-country="phoneCountryId"
                  @country-change="phoneCountryId = $event?.id || 'tm'"
                  @blur="normalizeUserPhone"
                />
              </div>
            </div>
            <div class="ml-3 w-40 flex flex-col">
              <label class="block mb-1">{{ $t('profilePhoto') }}</label>
              <input
                ref="imageInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="onFileChange"
              >
              <div
                v-if="selectedImage"
                class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden"
              >
                <img
                  :src="selectedImage"
                  alt="Selected Image"
                  class="max-w-full max-h-full object-cover rounded-full"
                >
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  @click="() => { selectedImage = null; image = null }"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else-if="editingItem?.photo && editingItem.photo !== ''"
                class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden"
              >
                <img
                  :src="getUserPhotoSrc(editingItem)"
                  alt="Current Photo"
                  class="max-w-full max-h-full object-cover rounded-full"
                >
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  @click="() => { editingItem.photo = '' }"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else
                class="h-40 p-3 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                @click="$refs.imageInput?.click()"
              >
                <div class="w-full h-full flex flex-col items-center justify-center bg-white rounded">
                  <img
                    src="/logo.png"
                    alt="Placeholder"
                    class="w-16 h-16 object-contain opacity-50"
                  >
                  <span class="text-xs text-gray-500 mt-2 text-center">{{ $t('clickToUploadImage') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="!editingItem"
            class="mb-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('password')
            }}</label>
            <div class="flex items-center space-x-2">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('enterPassword')"
                autocomplete="new-password"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
              <PrimaryButton
                :onclick="togglePasswordVisibility"
                :icon="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                class="px-2 py-1"
              />
              <PrimaryButton
                :onclick="generatePassword"
                :icon="'fas fa-dice'"
                class="px-2 py-1"
                :aria-label="$t('generatePassword')"
              />
            </div>
          </div>

          <div
            v-if="!editingItem"
            class="mb-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('confirmPassword')
            }}</label>
            <div class="flex items-center space-x-2">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :placeholder="$t('confirmPassword')"
                autocomplete="new-password"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
              <PrimaryButton
                :onclick="toggleConfirmPasswordVisibility"
                :icon="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                class="px-2 py-1"
              />
            </div>
          </div>

          <div
            v-if="editingItem"
            class="mb-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('newPassword') }}</label>
            <div class="flex items-center space-x-2">
              <input
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                :placeholder="$t('enterNewPassword')"
                autocomplete="new-password"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div
            v-if="editingItem && form.newPassword"
            class="mb-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('confirmNewPassword') || $t('confirmPassword') }}</label>
            <div class="flex items-center space-x-2">
              <input
                v-model="form.confirmNewPassword"
                :type="showConfirmNewPassword ? 'text' : 'password'"
                :placeholder="$t('confirmPassword')"
                autocomplete="new-password"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <PrimaryButton
                :onclick="toggleConfirmNewPasswordVisibility"
                :icon="showConfirmNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                class="px-2 py-1"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('position') }}</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('birthday') }}</label>
              <input
                v-model="form.birthday"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('hireDate') }}</label>
              <input
                v-model="form.hireDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('dismissalDate') }}</label>
              <input
                v-model="form.dismissalDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('characteristics') }}</label>
            <div class="flex items-center space-x-6">
              <label class="flex items-center space-x-2">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  :true-value="true"
                  :false-value="false"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-700">{{ $t('userStatus') }}</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  v-model="form.isAdmin"
                  type="checkbox"
                  :true-value="true"
                  :false-value="false"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm text-gray-700">{{ $t('isAdmin') }}</span>
              </label>
            </div>
          </div>

          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('companies') }}</label>
              <div class="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                <div
                  v-for="company in companies"
                  :key="company.id"
                  class="flex items-center space-x-2 mb-2"
                >
                  <input
                    :id="`company-${company.id}`"
                    v-model="form.companies"
                    type="checkbox"
                    :value="company.id"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                  <label
                    :for="`company-${company.id}`"
                    class="text-sm text-gray-700 cursor-pointer"
                  >{{
                    company.name }}</label>
                </div>
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('departments') }}</label>
              <div class="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                <div v-if="departments && departments.length > 0">
                  <div
                    v-for="department in departments"
                    :key="department.id"
                    class="flex items-center space-x-2 mb-2"
                  >
                    <input
                      :id="`department-${department.id}`"
                      v-model="form.departments"
                      type="checkbox"
                      :value="department.id"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                    <label
                      :for="`department-${department.id}`"
                      class="text-sm text-gray-700 cursor-pointer"
                    >
                      {{ department.title }}
                    </label>
                  </div>
                </div>
                <div
                  v-else
                  class="text-gray-500 text-sm"
                >
                  {{ $t('noDepartmentsAvailable') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="currentTab === 'roles'">
        <div class="mb-4">
          <label class="font-semibold mb-2 block">{{ $t('roles') }}</label>
          <p class="text-sm text-gray-600 mb-3">
            {{ $t('selectRolesByCompany') }}
          </p>

          <div
            v-if="selectedCompanies && selectedCompanies.length > 0"
            class="space-y-4"
          >
            <div
              v-for="company in selectedCompanies"
              :key="company.id"
              class="border border-gray-300 rounded-md p-3 bg-gray-50"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="font-semibold text-sm">
                  {{ company.name }}
                </div>
                <button
                  v-if="getCompanyRole(company.id)"
                  type="button"
                  class="text-xs text-red-600 hover:text-red-800"
                  @click="clearCompanyRole(company.id)"
                >
                  {{ $t('clear') }}
                </button>
              </div>
              <div
                v-if="getRolesForCompany(company.id).length > 0"
                class="max-h-48 overflow-y-auto"
              >
                <div
                  v-for="role in getRolesForCompany(company.id)"
                  :key="role.id"
                  class="flex items-center space-x-2 mb-2"
                >
                  <input
                    :id="`role-${company.id}-${role.id}`"
                    type="radio"
                    :name="`company-${company.id}-role`"
                    :value="role.name"
                    :checked="getCompanyRole(company.id) === role.name"
                    class="border-gray-300 text-blue-600 focus:ring-blue-500"
                    @change="updateCompanyRole(company.id, role.name)"
                  >
                  <label
                    :for="`role-${company.id}-${role.id}`"
                    class="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {{ role.name }}
                    <span
                      v-if="role.permissions && role.permissions.length > 0"
                      class="text-xs text-gray-500 ml-2"
                    >
                      ({{ role.permissions.length }} {{ $t('permissions') }})
                    </span>
                  </label>
                </div>
              </div>
              <div
                v-else
                class="text-gray-500 text-sm"
              >
                {{ $t('noRolesAvailable') }}
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-gray-500 text-sm"
          >
            {{ $t('noCompaniesAvailable') }}
          </div>
        </div>
      </div>
      <div
        v-show="currentTab === 'salaries' && editingItem && canViewSalariesTab"
        class="mt-4"
      >
        <UserSalaryTab :editing-item="editingItem" />
      </div>
      <div
        v-if="editingItem && canViewBalanceTab"
        v-show="currentTab === 'balance'"
        class="mt-4"
      >
        <UserBalanceTab :editing-item="editingItem" />
      </div>
      <div
        v-if="editingItem && canViewBalanceTab"
        v-show="currentTab === 'account'"
        class="mt-4"
      >
        <UserAccountTab :editing-item="editingItem" />
      </div>
    </div>
    <div class="flex-shrink-0 p-4 flex space-x-2 bg-[#edf4fb]">
      <PrimaryButton
        v-if="editingItem != null"
        :onclick="showDeleteDialog"
        :is-danger="true"
        :is-loading="deleteLoading"
        icon="fas fa-trash"
        :disabled="!$store.getters.hasPermission('users_delete')"
      />
      <PrimaryButton
        icon="fas fa-save"
        :onclick="save"
        :is-loading="saveLoading"
        :disabled="(editingItemId != null && !$store.getters.hasPermission('users_update')) ||
          (editingItemId == null && !$store.getters.hasPermission('users_create'))"
        :aria-label="$t('save')"
      />
    </div>

    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />

    <ImageCropperModal
      :show="showCropperModal"
      :image-src="tempImageSrc"
      @close="closeCropperModal"
      @cropped="handleCroppedImage"
    />
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import UsersController from '@/api/UsersController';
import CompaniesController from '@/api/CompaniesController';
import DepartmentsController from '@/api/DepartmentController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import userPhotoMixin from '@/mixins/userPhotoMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import PhoneInputWithCountry from '@/views/components/app/forms/PhoneInputWithCountry.vue';
import UserSalaryTab from '@/views/pages/users/UserSalaryTab.vue';
import UserBalanceTab from '@/views/components/app/UserBalanceTab.vue';
import UserAccountTab from '@/views/pages/users/UserAccountTab.vue';

export default {
    components: { PrimaryButton, AlertDialog, TabBar, ImageCropperModal, PhoneInputWithCountry, UserSalaryTab, UserBalanceTab, UserAccountTab },
    mixins: [getApiErrorMessage, userPhotoMixin, crudFormMixin],
    props: {
        editingItem: { type: Object, required: false, default: null },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            form: {
                name: '',
                surname: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                newPassword: '',
                confirmNewPassword: '',
                position: '',
                hireDate: '',
                dismissalDate: '',
                birthday: '',
                isActive: true,
                isAdmin: false,
                companies: [],
                departments: [],
                roles: [],
                companyRoles: [],
            },
            phoneDisplay: '',
            phoneCountryId: 'tm',
            editingItemId: null,
            companies: [],
            departments: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            showPassword: false,
            showConfirmPassword: false,
            showNewPassword: false,
            showConfirmNewPassword: false,
            selectedImage: null,
            image: '',
            hasNewFile: false,
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            tabs: [
                { name: 'info', label: 'information' },
                { name: 'roles', label: 'roles' },
                { name: 'salaries', label: 'salaries' },
                { name: 'balance', label: 'balance' },
                { name: 'account', label: 'account' }
            ],
            allRoles: [],
        };
    },
    computed: {
        translatedTabs() {
            let visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
                tab.name !== 'salaries' && tab.name !== 'balance' && tab.name !== 'account'
            );
            if (!this.canViewSalariesTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'salaries');
            }
            if (!this.canViewRolesTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'roles');
            }
            if (!this.canViewBalanceTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'balance' && tab.name !== 'account');
            }
            return visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        canViewBalanceTab() {
            if (this.$store.getters.hasPermission('settings_client_balance_view')) {
                return true;
            }

            if (this.$store.getters.hasPermission('settings_client_balance_view_own')) {
                const currentUser = this.$store.getters.user;
                return currentUser && this.editingItem && currentUser.id === this.editingItem.id;
            }

            return false;
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
        if (globalThis.window) {
            globalThis.window.i18n = this.$i18n;
        }

        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCompanies(),
                this.fetchRoles(),
                this.fetchDepartments()
            ]);

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
                phone: this.form.phone,
                password: this.form.password,
                confirmPassword: this.form.confirmPassword,
                newPassword: this.form.newPassword,
                position: this.form.position,
                hireDate: this.form.hireDate,
                dismissalDate: this.form.dismissalDate,
                birthday: this.form.birthday,
                isActive: this.form.isActive,
                isAdmin: this.form.isAdmin,
                companies: [...this.form.companies],
                departments: [...this.form.departments],
                roles: [...this.form.roles],
                companyRoles: JSON.parse(JSON.stringify(this.form.companyRoles || [])),
                selectedImage: this.selectedImage,
                image: this.image
            };
        },
        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert(this.$t('onlyImagesAllowed'));
                    event.target.value = '';
                    return;
                }
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

            this.croppedFile = file;
            this.selectedImage = URL.createObjectURL(blob);
            this.hasNewFile = true;


            this.closeCropperModal();
        },
        async fetchCompanies() {
            try {
                this.companies = (await CompaniesController.getItems(1, 100)).items || [];
            } catch (error) {
                console.error('Error fetching companies:', error);
                this.companies = [];
            }
        },
        async fetchRoles() {
            try {
                await this.$store.dispatch('loadRoles');
                this.allRoles = this.$store.getters.roles || [];
            } catch (error) {
                console.error('Error fetching roles:', error);
                this.allRoles = [];
            }
        },
        async fetchDepartments() {
            try {
                this.departments = (await DepartmentsController.getAllItems()) || [];
            } catch (error) {
                console.error('Error fetching departments:', error);
                this.departments = [];
            }
        },
        clearForm() {
            this.form.name = '';
            this.form.surname = '';
            this.form.email = '';
            this.form.phone = '';
            this.phoneDisplay = '';
            this.phoneCountryId = 'tm';
            this.form.password = '';
            this.form.confirmPassword = '';
            this.form.newPassword = '';
            this.form.confirmNewPassword = '';
            this.form.position = '';
            this.form.hireDate = '';
            this.form.dismissalDate = '';
            this.form.birthday = '';
            this.form.isActive = true;
            this.form.isAdmin = false;
            this.form.companies = [];
            this.form.departments = [];
            this.form.roles = [];
            this.form.companyRoles = [];
            this.selectedImage = null;
            this.image = null;
            this.hasNewFile = false;
            this.croppedFile = null;
            this.showCropperModal = false;
            this.tempImageSrc = '';
            this.editingItemId = null;
            this.showPassword = false;
            this.showConfirmPassword = false;
            this.showNewPassword = false;
            this.currentTab = 'info';
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.resetFormChanges();
        },
        prepareSave() {
            if (!this.editingItemId && this.form.password !== this.form.confirmPassword) {
                throw new Error(this.$t('passwordsDoNotMatch'));
            }
            if (this.editingItemId && this.form.newPassword && this.form.newPassword !== this.form.confirmNewPassword) {
                throw new Error(this.$t('passwordsDoNotMatch'));
            }

            const selectedCompanies = Array.isArray(this.form.companies)
                ? this.form.companies.filter((companyId) => companyId !== null && companyId !== undefined && `${companyId}` !== '')
                : this.form.companies?.split
                    ? this.form.companies.split(',').filter((c) => c.trim() !== '')
                    : [];

            if (!selectedCompanies?.length) {
                throw new Error(this.$t('companiesRequired'));
            }

            const formData = this.prepareUserData();
            if (this.editingItemId && this.form.newPassword) {
                formData.password = this.form.newPassword;
                formData.passwordConfirmation = this.form.confirmNewPassword;
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
                this.selectedImage = this.getUserPhotoSrc(savedUser.user);
                this.image = savedUser.user.photo;
            } else {
                this.selectedImage = null;
                this.image = '';
            }

            this.hasNewFile = false;
            return savedUser.user || data;
        },
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
            const pwd = this.generateRandomPassword();
            this.form.newPassword = pwd;
            this.form.confirmNewPassword = pwd;
        },
        toggleConfirmNewPasswordVisibility() {
            this.showConfirmNewPassword = !this.showConfirmNewPassword;
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
            if ((tab === 'balance' || tab === 'account') && !this.editingItem) {
                return;
            }
            this.currentTab = tab;
        },
        getRolesForCompany(companyId) {
            if (!this.allRoles?.length) {
                return [];
            }
            return this.allRoles.filter(role => role.companyId === null || role.companyId === companyId);
        },
        updateCompanyRole(companyId, roleName) {
            let companyRole = this.form.companyRoles.find(cr => cr.companyId === companyId);

            if (companyRole) {
                companyRole.roleIds = [roleName];
            } else {
                companyRole = { companyId: companyId, roleIds: [roleName] };
                this.form.companyRoles.push(companyRole);
            }
        },
        getCompanyRole(companyId) {
            const companyRole = this.form.companyRoles.find(cr => cr.companyId === companyId);
            return companyRole?.roleIds?.length
                ? companyRole.roleIds[0]
                : null;
        },
        clearCompanyRole(companyId) {
            this.form.companyRoles = this.form.companyRoles.filter(cr => cr.companyId !== companyId);
        },
        normalizeUserPhone() {
            const cleaned = (this.phoneDisplay ).replace(/\D/g, '');
            if (!cleaned) {
                this.form.phone = '';
                return;
            }
            const code = this.phoneCountryId === 'ru' ? '7' : '993';
            this.form.phone = cleaned.startsWith(code) ? cleaned : code + cleaned;
            this.phoneDisplay = this.formatPhoneForInput(this.form.phone);
        },
        formatPhoneForInput(phone) {
            if (!phone) return '';
            const c = String(phone).replace(/\D/g, '');
            return c.startsWith('993') ? c.slice(3) : c.startsWith('7') ? c.slice(1) : c;
        },
        getPhoneCountryId(phone) {
            return (String(phone ).replace(/\D/g, '').startsWith('7')) ? 'ru' : 'tm';
        },
        prepareUserData() {
            this.normalizeUserPhone();
            const data = {
                name: this.form.name,
                surname: this.form.surname,
                email: this.form.email,
                phone: this.form.phone || null,
                position: this.form.position,
                hireDate: this.form.hireDate,
                dismissalDate: this.form.dismissalDate,
                birthday: this.form.birthday,
                isActive: this.form.isActive,
                isAdmin: this.form.isAdmin,
                companies: Array.isArray(this.form.companies) ? this.form.companies : this.form.companies.split(',').filter(c => c.trim() !== ''),
            };

            if (!this.editingItemId) {
                data.password = this.form.password;
                data.passwordConfirmation = this.form.confirmPassword;
            }

            if (this.form.departments?.length) {
                data.departments = this.form.departments;
            }

            if (this.form.companyRoles?.length) {
                data.companyRoles = this.form.companyRoles.map((companyRole) => ({
                    companyId: companyRole.companyId,
                    roleIds: companyRole.roleIds,
                }));
            } else if (this.form.roles?.length) {
                data.roles = Array.isArray(this.form.roles) ? this.form.roles : (this.form.roles ? this.form.roles.split(',').filter(r => r.trim() !== '') : []);
            }

            return data;
        },

        async performDelete() {
            await UsersController.deleteItem(this.editingItemId);
            return { message: 'deleted' };
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.form.name = newEditingItem.name ;
                this.form.surname = newEditingItem.surname ;
                this.form.email = newEditingItem.email ;
                this.form.phone = newEditingItem.phone ;
                this.phoneCountryId = this.getPhoneCountryId(newEditingItem.phone);
                this.phoneDisplay = this.formatPhoneForInput(newEditingItem.phone);
                this.form.position = newEditingItem.position ;
                this.form.hireDate = newEditingItem.hireDate
                    ? newEditingItem.hireDate.split('T')[0]
                    : '';
                this.form.dismissalDate = newEditingItem.dismissalDate
                    ? newEditingItem.dismissalDate.split('T')[0]
                    : '';
                this.form.birthday = newEditingItem.birthday
                    ? newEditingItem.birthday.split('T')[0]
                    : '';
                this.form.isActive = newEditingItem.isActive !== undefined ? newEditingItem.isActive : true;
                this.form.isAdmin = newEditingItem.isAdmin !== undefined ? newEditingItem.isAdmin : false;
                this.form.companies = newEditingItem.companies?.map(c => c.id) || [];
                this.form.departments = newEditingItem.departments?.map(d => d.id) || [];
                this.form.roles = newEditingItem.roles?.map(r => r?.name || r) || [];

                if (newEditingItem.companyRoles && Array.isArray(newEditingItem.companyRoles)) {
                    this.form.companyRoles = newEditingItem.companyRoles.map(cr => ({
                        companyId: cr.companyId,
                        roleIds: Array.isArray(cr.roleIds) ? cr.roleIds : (cr.roleIds ? cr.roleIds.split(',') : [])
                    }));
                } else {
                    this.form.companyRoles = [];
                }

                this.currentTab = 'info';

                if (newEditingItem.photo) {
                    this.selectedImage = this.getUserPhotoSrc(newEditingItem);
                } else {
                    this.selectedImage = null;
                    this.image = '';
                }
                this.hasNewFile = false;
            }
        }
    }
};
</script>