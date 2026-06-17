<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
                  required
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('lastName') }}</label>
                <input
                  v-model="form.surname"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('email') }}</label>
                <input
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
                  required
                >
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('phoneNumber') }}</label>
                <PhoneInputWithCountry
                  v-model="phoneDisplay"
                  :default-country="phoneCountryId"
                  @country-change="handlePhoneCountryChange"
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
                  class="absolute top-1 right-1 w-6 h-6 bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  @click="() => { selectedImage = null; image = null }"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else-if="editingItem?.photo && editingItem.photo !== '' && !existingPhotoCleared"
                class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden"
              >
                <img
                  :src="getUserPhotoSrc(editingItem)"
                  alt="Current Photo"
                  class="max-w-full max-h-full object-cover rounded-full"
                  @error="applyAvatarImageFallback"
                >
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  @click="existingPhotoCleared = true"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else
                class="h-40 p-3 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:border-[var(--label-accent)] hover:bg-[color-mix(in_srgb,var(--nav-accent)_10%,var(--surface-muted))] transition-colors dark:hover:border-[var(--label-accent)] dark:hover:bg-[var(--surface-elevated)]"
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

          <form
            class="contents"
            @submit.prevent="save"
          >
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
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
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
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
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
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
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
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
              >
              <PrimaryButton
                :onclick="toggleConfirmNewPasswordVisibility"
                :icon="showConfirmNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                class="px-2 py-1"
              />
            </div>
          </div>
          </form>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('position') }}</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
            >
          </div>

          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('birthday') }}</label>
              <input
                v-model="form.birthday"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('hireDate') }}</label>
              <input
                v-model="form.hireDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('dismissalDate') }}</label>
              <input
                v-model="form.dismissalDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
              >
            </div>
          </div>

          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">{{ $t('characteristics') }}</label>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-gray-700 dark:text-[var(--text-primary)]">{{ $t('userStatus') }}</span>
                <ToggleSwitch
                  v-model="form.isActive"
                  :aria-label="$t('userStatus')"
                />
              </div>
              <div
                v-if="canManageAdminFlag"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-sm text-gray-700 dark:text-[var(--text-primary)]">{{ $t('isAdmin') }}</span>
                <ToggleSwitch
                  v-model="form.isAdmin"
                  :aria-label="$t('isAdmin')"
                />
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-gray-700 dark:text-[var(--text-primary)]">{{ $t('simpleUserAccount') }}</span>
                <ToggleSwitch
                  v-model="form.isSimpleUser"
                  :aria-label="$t('simpleUserAccount')"
                />
              </div>
            </div>
          </div>

          <div
            v-if="form.isSimpleUser"
            class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">{{ $t('simpleOrderCategory') }}</label>
              <select
                v-model.number="form.simpleCategoryId"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
              >
                <option :value="null">
                  {{ $t('selectCategory') }}
                </option>
                <option
                  v-for="c in rootCategories"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">{{ $t('simpleOrderWarehouse') }}</label>
              <select
                v-model.number="form.simpleWarehouseId"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
              >
                <option :value="null">
                  {{ $t('selectWarehouse') }}
                </option>
                <option
                  v-for="w in allWarehouses"
                  :key="w.id"
                  :value="w.id"
                >
                  {{ w.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">{{ $t('companies') }}</label>
              <div class="max-h-32 overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
                <div
                  v-for="company in companies"
                  :key="company.id"
                  class="mb-2 flex items-center space-x-2"
                >
                  <input
                    :id="`company-${company.id}`"
                    v-model="form.companies"
                    type="checkbox"
                    :value="company.id"
                    class="rounded border-gray-300 text-[var(--color-info)] focus:ring-[var(--nav-accent)] dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)]"
                  >
                  <label
                    :for="`company-${company.id}`"
                    class="cursor-pointer text-sm text-gray-700 dark:text-[var(--text-primary)]"
                  >{{
                    company.name }}</label>
                </div>
              </div>
            </div>
            <div class="flex-1">
              <DepartmentSearch
                v-model="form.departments"
                :departments="departments"
              />
            </div>
          </div>

          <div
            v-if="canViewRolesTab && roleCompany"
            class="mb-4"
          >
            <CompanyRolePicker
              :label="$t('role')"
              :roles="getRolesForCompany(roleCompany.id)"
              :model-value="getCompanyRole(roleCompany.id) || ''"
              @update:model-value="onCompanyRoleChange(roleCompany.id, $event)"
            />
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
      <div
        v-if="editingItem && canViewSessionsTab"
        v-show="currentTab === 'sessions'"
        class="mt-4"
      >
        <ProfileSessionsTab :user-id="editingItem.id" />
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
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
    </teleport>

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
import notificationMixin from '@/mixins/notificationMixin';
import userPhotoMixin from '@/mixins/userPhotoMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import PhoneInputWithCountry from '@/views/components/app/forms/PhoneInputWithCountry.vue';
import UserSalaryTab from '@/views/pages/users/UserSalaryTab.vue';
import UserBalanceTab from '@/views/components/app/UserBalanceTab.vue';
import UserAccountTab from '@/views/pages/users/UserAccountTab.vue';
import ProfileSessionsTab from '@/views/components/app/ProfileSessionsTab.vue';
import { applyAvatarImageFallback } from '@/constants/imageFallback';
import CategoryController from '@/api/CategoryController';
import WarehouseController from '@/api/WarehouseController';
import { DEFAULT_PHONE_COUNTRY_ID, getCountryById } from '@/constants/phoneCountries';
import { formatPhoneForInput, getPhoneCountryId, validateAndNormalizeNewPhone } from '@/utils/phoneEmailFormUtils';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import CompanyRolePicker from '@/views/components/app/search/CompanyRolePicker.vue';
import DepartmentSearch from '@/views/components/app/search/DepartmentSearch.vue';

export default {
    components: { PrimaryButton, AlertDialog, TabBar, ImageCropperModal, PhoneInputWithCountry, UserSalaryTab, UserBalanceTab, UserAccountTab, ProfileSessionsTab, ToggleSwitch, CompanyRolePicker, DepartmentSearch },
    mixins: [getApiErrorMessage, notificationMixin, userPhotoMixin, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, required: false, default: null },
        initialTab: { type: String, required: false, default: 'info' },
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
                isSimpleUser: false,
                simpleCategoryId: null,
                simpleWarehouseId: null,
                companies: [],
                departments: [],
                roles: [],
                companyRoles: [],
            },
            phoneDisplay: '',
            phoneCountryId: DEFAULT_PHONE_COUNTRY_ID,
            companies: [],
            departments: [],
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
            existingPhotoCleared: false,
            tabs: [
                { name: 'info', label: 'information' },
                { name: 'salaries', label: 'salaries' },
                { name: 'balance', label: 'balance' },
                { name: 'account', label: 'account' },
                { name: 'sessions', label: 'activeSessions' },
            ],
            allRoles: [],
            rootCategories: [],
            allWarehouses: [],
        };
    },
    watch: {
        'form.isSimpleUser'(v) {
            if (!v) {
                this.form.simpleCategoryId = null;
                this.form.simpleWarehouseId = null;
            }
        },
        'form.companies': {
            handler(companyIds) {
                const selectedIds = new Set((companyIds || []).map((id) => Number(id)));
                this.form.companyRoles = (this.form.companyRoles || []).filter(
                    (companyRole) => selectedIds.has(Number(companyRole.companyId)),
                );
            },
            deep: true,
        },
        initialTab: {
            handler(value) {
                const nextTab = this.resolveRequestedTab(value);
                if (nextTab !== this.currentTab) {
                    this.currentTab = nextTab;
                }
            }
        }
    },
    computed: {
        translatedTabs() {
            let visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
                tab.name !== 'salaries' && tab.name !== 'balance' && tab.name !== 'account' && tab.name !== 'sessions'
            );
            if (!this.canViewSalariesTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'salaries');
            }
            if (!this.canViewBalanceTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'balance' && tab.name !== 'account');
            }
            if (!this.canViewSessionsTab) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'sessions');
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
        currentUserIsAdmin() {
            return Boolean(this.$store.getters.user?.isAdmin);
        },
        canViewSessionsTab() {
            return this.currentUserIsAdmin && Boolean(this.editingItem);
        },
        canManageAdminFlag() {
            return this.currentUserIsAdmin;
        },
        roleCompany() {
            const current = this.$store.getters.currentCompany;
            if (!current?.id) {
                return null;
            }
            const selectedIds = (this.form.companies || []).map((id) => Number(id));
            if (!selectedIds.length) {
                return null;
            }
            if (selectedIds.includes(Number(current.id))) {
                return current;
            }
            return null;
        },
    },
    mounted() {
        if (globalThis.window) {
            globalThis.window.i18n = this.$i18n;
        }

        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCompanies(),
                this.fetchRoles(),
                this.fetchDepartments(),
                this.fetchRootCategories(),
                this.fetchWarehouses(),
            ]);

            if (!this.editingItem) {
                this.clearForm();
            }

            this.saveInitialState();
        });
    },
    methods: {
        applyAvatarImageFallback,
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
                isSimpleUser: this.form.isSimpleUser,
                simpleCategoryId: this.form.simpleCategoryId,
                simpleWarehouseId: this.form.simpleWarehouseId,
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
                this.existingPhotoCleared = false;
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
            this.existingPhotoCleared = false;

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
        async fetchRootCategories() {
            try {
                this.rootCategories = (await CategoryController.getParentCategories()) || [];
            } catch (error) {
                console.error('Error fetching categories:', error);
                this.rootCategories = [];
            }
        },
        async fetchWarehouses() {
            try {
                this.allWarehouses = (await WarehouseController.getListItems()) || [];
            } catch (error) {
                console.error('Error fetching warehouses:', error);
                this.allWarehouses = [];
            }
        },
        clearForm() {
            this.form.name = '';
            this.form.surname = '';
            this.form.email = '';
            this.form.phone = '';
            this.phoneDisplay = '';
            this.phoneCountryId = DEFAULT_PHONE_COUNTRY_ID;
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
            this.form.isSimpleUser = false;
            this.form.simpleCategoryId = null;
            this.form.simpleWarehouseId = null;
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
            this.existingPhotoCleared = false;
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
            if (this.editingItemId && this.existingPhotoCleared) {
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

            const payload = savedUser.data;
            const currentUser = this.$store.state.user;
            if (payload.user && payload.user.id === currentUser.id) {
                this.$store.commit('SET_USER', payload.user);
                if (payload.permissions) {
                    this.$store.commit('SET_PERMISSIONS', payload.permissions);
                }
            }

            if (payload.user && payload.user.photo) {
                this.selectedImage = this.getUserPhotoSrc(payload.user);
                this.image = payload.user.photo;
            } else {
                this.selectedImage = null;
                this.image = '';
            }

            this.hasNewFile = false;
            return payload.user || data;
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
            const nextTab = this.resolveRequestedTab(tab);
            if (nextTab) {
                this.currentTab = nextTab;
            }
        },
        resolveRequestedTab(tab) {
            const requested = String(tab || 'info');
            const availableTabs = this.translatedTabs.map(t => t.name);
            if (!availableTabs.includes(requested)) {
                return availableTabs.includes('info') ? 'info' : availableTabs[0];
            }
            return requested;
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
        onCompanyRoleChange(companyId, roleName) {
            if (!roleName) {
                this.clearCompanyRole(companyId);
                return;
            }
            this.updateCompanyRole(companyId, roleName);
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
        handlePhoneCountryChange(country) {
            this.phoneCountryId = country?.id || DEFAULT_PHONE_COUNTRY_ID;
        },
        normalizeUserPhone() {
            const rawPhone = String(this.phoneDisplay || '').trim();
            if (!rawPhone) {
                this.form.phone = '';
                return;
            }

            const normalized = validateAndNormalizeNewPhone(
                rawPhone,
                { id: this.phoneCountryId },
                []
            );

            if (!normalized.ok) {
                this.form.phone = '';
                const message = normalized.i18nKey
                    ? this.$t(normalized.i18nKey, normalized.i18nParams || {})
                    : this.$t('phoneNumberInvalid');
                this.showNotification(this.$t('error'), message, true);
                return;
            }

            this.form.phone = normalized.phoneToSave || '';
            this.phoneCountryId = normalized.countryMeta?.id || this.phoneCountryId;
            this.phoneDisplay = this.formatPhoneForInput(this.form.phone);
        },
        formatPhoneForInput,
        getPhoneCountryId,
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
                isSimpleUser: this.form.isSimpleUser,
                companies: Array.isArray(this.form.companies) ? this.form.companies : this.form.companies.split(',').filter(c => c.trim() !== ''),
            };

            if (this.canManageAdminFlag) {
                data.isAdmin = this.form.isAdmin;
            }

            if (this.form.isSimpleUser && this.form.simpleCategoryId != null && this.form.simpleCategoryId !== '') {
                data.simpleCategoryId = Number(this.form.simpleCategoryId);
            }
            if (this.form.isSimpleUser && this.form.simpleWarehouseId != null && this.form.simpleWarehouseId !== '') {
                data.simpleWarehouseId = Number(this.form.simpleWarehouseId);
            }

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
        onEditingItemChanged(newEditingItem) {
            this.existingPhotoCleared = false;
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
                this.form.isSimpleUser = newEditingItem.isSimpleUser !== undefined ? newEditingItem.isSimpleUser : false;
                this.form.simpleCategoryId = newEditingItem.simpleCategoryId != null && newEditingItem.simpleCategoryId !== ''
                    ? Number(newEditingItem.simpleCategoryId)
                    : null;
                this.form.simpleWarehouseId = newEditingItem.simpleWarehouseId != null && newEditingItem.simpleWarehouseId !== ''
                    ? Number(newEditingItem.simpleWarehouseId)
                    : null;
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

                this.currentTab = this.resolveRequestedTab(this.initialTab);

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