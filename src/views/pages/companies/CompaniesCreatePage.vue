<template>
  <div>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
        changeTab(t);
      }" />
      <div>
        <div v-show="currentTab === 'info'">
          <div class="mt-2 flex items-start">
            <div class="flex-1">
              <div>
                <label class="required">{{ $t('companyName') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  :placeholder="$t('enterCompanyName')"
                  required
                >
              </div>
            </div>
            <div class="ml-3 flex w-40 flex-col">
              <label class="mb-1 block">{{ $t('companyLogo') }}</label>
              <input
                ref="logoInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleLogoChange"
              >

              <div
                v-if="selectedLogo"
                class="relative flex h-40 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100 p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]"
              >
                <img
                  :src="selectedLogo"
                  alt="Selected Logo"
                  class="max-h-full max-w-full rounded object-contain"
                >
                <button
                  type="button"
                  class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors hover:bg-red-600"
                  @click="() => { selectedLogo = null; form.logo = null }"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else-if="editingItem?.logo && !existingLogoCleared"
                class="relative flex h-40 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100 p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]"
              >
                <img
                  :src="getCompanyLogoSrc(editingItem)"
                  alt="Company Logo"
                  class="max-h-full max-w-full rounded object-contain"
                  @error="applyLogoImageFallback"
                >
                <button
                  type="button"
                  class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors hover:bg-red-600"
                  @click="existingLogoCleared = true"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>
              <div
                v-else
                class="h-40 cursor-pointer rounded border-2 border-dashed border-gray-300 bg-gray-100 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:hover:border-[var(--label-accent)] dark:hover:bg-[var(--surface-elevated)]"
                @click="$refs.logoInput.click()"
              >
                <div class="flex h-full w-full flex-col items-center justify-center rounded bg-white dark:bg-[var(--surface-elevated)]">
                  <img
                    src="/logo.png"
                    alt="Placeholder"
                    class="h-16 w-16 object-contain opacity-50"
                  >
                  <span class="mt-2 text-center text-xs text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('clickToUploadImage') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4 mt-4 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <div class="mb-3 flex items-center gap-2">
              <h3 class="text-md font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                {{ $t('companyDetails') }}
              </h3>
              <FieldHint
                :text="$t('companyDetailsHint')"
                :aria-label="$t('companyDetailsHintAria')"
                placement="bottom"
              />
            </div>
            <div class="space-y-3">
              <div>
                <label class="mb-1 block">{{ $t('companyFullName') }}</label>
                <input
                  v-model="form.fullName"
                  type="text"
                  class="w-full"
                  :placeholder="$t('enterCompanyFullName')"
                >
              </div>
              <div>
                <label class="mb-1 block">{{ $t('companyAddress') }}</label>
                <textarea
                  v-model="form.address"
                  rows="2"
                  class="w-full"
                  :placeholder="$t('enterCompanyAddress')"
                />
              </div>
              <div>
                <label class="mb-1 block">{{ $t('companyTaxId') }}</label>
                <input
                  v-model="form.registrationNumber"
                  type="text"
                  class="w-full"
                  :placeholder="$t('enterCompanyTaxId')"
                >
              </div>
              <div>
                <label class="mb-1 block">{{ $t('companyWarehouseId') }}</label>
                <input
                  v-model="form.warehouseNumber"
                  type="text"
                  class="w-full"
                  :placeholder="$t('enterCompanyWarehouseId')"
                >
              </div>
              <div>
                <label class="mb-1 block">{{ $t('companyPhone') }}</label>
                <input
                  v-model="form.phone"
                  type="text"
                  class="w-full"
                  :placeholder="$t('enterCompanyPhone')"
                >
              </div>
              <div>
                <label class="mb-1 block">{{ $t('companyEmail') }}</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full"
                  :placeholder="$t('enterCompanyEmail')"
                >
              </div>
            </div>
          </div>
        </div>
        <div v-show="currentTab === 'workSchedule'" class="mt-4">
          <WorkScheduleEditor v-model="form.workSchedule" />
        </div>
        <div v-show="currentTab === 'transactionCategoryBindings' && editingItem" class="mt-4">
          <TransactionCategoryBindingsTab
            v-model="form.transactionCategoryBindings"
            :disabled="!$store.getters.hasPermission('settings_transaction_category_bindings_edit')"
          />
        </div>
        <div
          v-show="currentTab === 'settings' && editingItem"
          class="mt-4"
        >
          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('displaySettings') }}
            </h3>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('showDeletedTransactions') }}</span>
              <ToggleSwitch v-model="form.showDeletedTransactions" :aria-label="$t('showDeletedTransactions')" />
            </div>
            <div class="mt-3 flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
                <span>{{ $t('skipProjectOrderBalance') }}</span>
                <FieldHint
                  :text="$t('skipProjectOrderBalanceWarningNote')"
                  placement="top"
                />
              </span>
              <ToggleSwitch
                :model-value="form.skipProjectOrderBalance"
                :aria-label="$t('skipProjectOrderBalance')"
                @update:model-value="onSkipProjectOrderBalanceUpdate"
              />
            </div>
          </div>

          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('displaySettings') }}
            </h3>
            <div class="mb-3">
              <label class="mb-1 inline-flex items-center gap-1">
                <span>{{ $t('displayDecimalPlaces') }}</span>
                <FieldHint
                  :text="$t('displayDecimalPlacesHint')"
                  placement="top"
                />
              </label>
              <select v-model.number="form.displayDecimals">
                <option :value="0">0</option>
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
                <option :value="5">5</option>
              </select>
            </div>
          </div>

          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('roundingSettings') }}
            </h3>

            <div class="mb-3">
              <label class="mb-1 inline-flex items-center gap-1">
                <span>{{ $t('roundingDecimalPlaces') }}</span>
                <FieldHint
                  :text="$t('roundingDecimalPlacesHint')"
                  placement="top"
                />
              </label>
              <select v-model.number="form.roundingDecimals">
                <option :value="0">
                  0
                </option>
                <option :value="1">
                  1
                </option>
                <option :value="2">
                  2
                </option>
              </select>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between gap-3">
                <span class="inline-flex items-center gap-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
                  <span>{{ $t('enableRounding') }}</span>
                  <FieldHint
                    :text="$t('roundingWarningNote')"
                    placement="top"
                  />
                </span>
                <ToggleSwitch
                  :model-value="form.roundingEnabled"
                  :aria-label="$t('enableRounding')"
                  @update:model-value="onRoundingEnabledUpdate"
                />
              </div>
            </div>

            <div v-if="form.roundingEnabled">
              <div class="mb-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('roundingOrdersEnabled') }}</span>
                  <ToggleSwitch
                    v-model="form.roundingOrdersEnabled"
                    :aria-label="$t('roundingOrdersEnabled')"
                  />
                </div>
              </div>
              <div class="mb-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('roundingContractsEnabled') }}</span>
                  <ToggleSwitch
                    v-model="form.roundingContractsEnabled"
                    :aria-label="$t('roundingContractsEnabled')"
                  />
                </div>
              </div>
              <div class="mb-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('roundingWarehouseEnabled') }}</span>
                  <ToggleSwitch
                    v-model="form.roundingWarehouseEnabled"
                    :aria-label="$t('roundingWarehouseEnabled')"
                  />
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  {{ $t('roundingModuleUsesGlobalRules') }}
                </div>
              </div>
              <div class="mb-3">
                <label class="mb-1 block">{{ $t('roundingDirection') }}</label>
                <select v-model="form.roundingDirection">
                  <option value="standard">
                    {{ $t('roundingStandard') }}
                  </option>
                  <option value="up">
                    {{ $t('roundingUp') }}
                  </option>
                  <option value="down">
                    {{ $t('roundingDown') }}
                  </option>
                  <option value="custom">
                    {{ $t('roundingCustom') }}
                  </option>
                </select>
              </div>

              <div v-if="form.roundingDirection === 'custom'">
                <label class="mb-1 inline-flex items-center gap-1">
                  <span>{{ $t('roundingThreshold') }}</span>
                  <FieldHint
                    :text="$t('roundingThresholdHint')"
                    placement="top"
                  />
                </label>
                <input
                  v-model.number="form.roundingCustomThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                >
              </div>
            </div>
          </div>

          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('quantityRoundingSettings') }}
            </h3>

            <div class="mb-3">
              <label class="mb-1 inline-flex items-center gap-1">
                <span>{{ $t('decimalPlaces') }} ({{ $t('forQuantity') }})</span>
                <FieldHint
                  :text="$t('quantityDecimalPlacesHint')"
                  placement="top"
                />
              </label>
              <select v-model.number="form.roundingQuantityDecimals">
                <option :value="0">
                  0
                </option>
                <option :value="1">
                  1
                </option>
                <option :value="2">
                  2
                </option>
                <option :value="3">
                  3
                </option>
                <option :value="4">
                  4
                </option>
                <option :value="5">
                  5
                </option>
              </select>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between gap-3">
                <span class="inline-flex items-center gap-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
                  <span>{{ $t('enableRounding') }} ({{ $t('forQuantity') }})</span>
                  <FieldHint
                    :text="$t('roundingQuantityWarningNote')"
                    placement="top"
                  />
                </span>
                <ToggleSwitch
                  :model-value="form.roundingQuantityEnabled"
                  :aria-label="$t('enableRounding')"
                  @update:model-value="onRoundingQuantityEnabledUpdate"
                />
              </div>
            </div>

            <div v-if="form.roundingQuantityEnabled">
              <div class="mb-3">
                <label class="mb-1 block">{{ $t('roundingDirection') }} ({{ $t('forQuantity') }})</label>
                <select v-model="form.roundingQuantityDirection">
                  <option value="standard">
                    {{ $t('roundingStandard') }}
                  </option>
                  <option value="up">
                    {{ $t('roundingUp') }}
                  </option>
                  <option value="down">
                    {{ $t('roundingDown') }}
                  </option>
                  <option value="custom">
                    {{ $t('roundingCustom') }}
                  </option>
                </select>
              </div>

              <div v-if="form.roundingQuantityDirection === 'custom'">
                <label class="mb-1 inline-flex items-center gap-1">
                  <span>{{ $t('roundingThreshold') }} ({{ $t('forQuantity') }})</span>
                  <FieldHint
                    :text="$t('roundingThresholdHint')"
                    placement="top"
                  />
                </label>
                <input
                  v-model.number="form.roundingQuantityCustomThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null" :onclick="deleteItem" :is-danger="true" :is-loading="deleteLoading"
          icon="fas fa-trash" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('companies_update')) ||
          (editingItemId == null && !$store.getters.hasPermission('companies_create'))" :aria-label="$t('save')" />
      </div>
    </teleport>
  </div>

  <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
    :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
  <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
  <AlertDialog :dialog="roundingConfirmDialog" :descr="$t('roundingEnableConfirmDescription')"
    :confirm-text="$t('enable')" :leave-text="$t('cancel')" @confirm="confirmRoundingEnable"
    @leave="cancelRoundingEnable" />
  <AlertDialog :dialog="roundingQuantityConfirmDialog" :descr="$t('roundingQuantityEnableConfirmDescription')"
    :confirm-text="$t('enable')" :leave-text="$t('cancel')" @confirm="confirmQuantityRoundingEnable"
    @leave="cancelQuantityRoundingEnable" />
  <AlertDialog :dialog="skipProjectOrderBalanceConfirmDialog"
    :descr="$t('skipProjectOrderBalanceEnableConfirmDescription')" :confirm-text="$t('enable')"
    :leave-text="$t('cancel')" @confirm="confirmSkipProjectOrderBalance" @leave="cancelSkipProjectOrderBalance" />

  <!-- Image Cropper Modal -->
  <ImageCropperModal :show="showCropperModal" :image-src="tempImageSrc" @close="closeCropperModal"
    @cropped="handleCroppedImage" />
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import CompaniesController from '@/api/CompaniesController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { eventBus } from '@/eventBus';
import WorkScheduleEditor from '@/views/components/app/WorkScheduleEditor.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import { CompanyDto } from '@/dto/companies/CompanyDto';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { applyLogoImageFallback } from '@/constants/imageFallback';
import {
  cloneWorkSchedule,
  effectiveWorkSchedule,
} from '@/constants/defaultWorkSchedule';
import TransactionCategoryBindingsTab from '@/views/components/companies/TransactionCategoryBindingsTab.vue';
import { flattenBindingsForPayload } from '@/constants/transactionCategoryBindings';

export default {
  components: { PrimaryButton, AlertDialog, ImageCropperModal, TabBar, WorkScheduleEditor, ToggleSwitch, FieldHint, TransactionCategoryBindingsTab },
  mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: {
      type: Object,
      default: null
    }
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'update:editingItem'],
  data() {
    return {
      lastSaveResponse: null, // Для передачи response в onSaveSuccess
      form: {
        name: '',
        fullName: '',
        address: '',
        phone: '',
        registrationNumber: '',
        email: '',
        warehouseNumber: '',
        logo: null,
        showDeletedTransactions: false,
        roundingDecimals: 2,
        displayDecimals: 2,
        roundingEnabled: true,
        roundingDirection: 'standard',
        roundingCustomThreshold: null,
        roundingOrdersEnabled: true,
        roundingContractsEnabled: false,
        roundingWarehouseEnabled: true,
        roundingQuantityDecimals: 2,
        roundingQuantityEnabled: true,
        roundingQuantityDirection: 'standard',
        roundingQuantityCustomThreshold: null,
        skipProjectOrderBalance: true,
        workSchedule: effectiveWorkSchedule(null),
        transactionCategoryBindings: {},
      },
      selectedLogo: null,
      showCropperModal: false,
      tempImageSrc: '',
      croppedFile: null,
      existingLogoCleared: false,
      currentTab: 'info',
      tabs: [
        { name: 'info', label: 'info' },
        { name: 'workSchedule', label: 'workSchedule' },
        { name: 'transactionCategoryBindings', label: 'transactionCategoryBindings' },
        { name: 'settings', label: 'settings' }
      ],
      roundingConfirmDialog: false,
      roundingQuantityConfirmDialog: false,
      skipProjectOrderBalanceConfirmDialog: false
    };
  },
  computed: {
    translatedTabs() {
      let visibleTabs = this.tabs;

      if (!this.editingItem) {
        visibleTabs = visibleTabs.filter(tab => tab.name !== 'settings');
      }

      return visibleTabs.map(tab => ({
        ...tab,
        label: this.$t(tab.label)
      }));
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.editingItem) {
        this.clearForm();
      }
      if (this.saveInitialState) {
        this.saveInitialState();
      }
    });
  },
  methods: {
    applyLogoImageFallback,
    changeTab(tabName) {
      if ((tabName === 'settings' || tabName === 'transactionCategoryBindings') && !this.editingItem) {
        this.currentTab = 'info';
        return;
      }
      this.currentTab = tabName;
    },
    getFormState() {
      return {
        name: this.form.name,
        logo: this.form.logo,
        showDeletedTransactions: this.form.showDeletedTransactions,
        workSchedule: this.form.workSchedule,
        transactionCategoryBindings: this.form.transactionCategoryBindings,
      };
    },
    clearForm() {
      this.form.name = '';
      this.form.fullName = '';
      this.form.address = '';
      this.form.phone = '';
      this.form.registrationNumber = '';
      this.form.email = '';
      this.form.warehouseNumber = '';
      this.form.logo = null;
      this.form.showDeletedTransactions = false;
      this.form.roundingDecimals = 2;
      this.form.displayDecimals = 2;
      this.form.roundingEnabled = true;
      this.form.roundingDirection = 'standard';
      this.form.roundingCustomThreshold = null;
      this.form.roundingOrdersEnabled = true;
      this.form.roundingContractsEnabled = false;
      this.form.roundingWarehouseEnabled = true;
      this.form.roundingQuantityDecimals = 2;
      this.form.roundingQuantityEnabled = true;
      this.form.roundingQuantityDirection = 'standard';
      this.form.roundingQuantityCustomThreshold = null;
      this.form.skipProjectOrderBalance = true;
      this.form.workSchedule = effectiveWorkSchedule(null);
      this.form.transactionCategoryBindings = {};
      this.existingLogoCleared = false;
      this.selectedLogo = null;
      this.croppedFile = null;
      this.showCropperModal = false;
      this.tempImageSrc = '';
      this.currentTab = 'info';
      if (this.$refs.logoInput) {
        this.$refs.logoInput.value = null;
      }
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
    prepareSave() {
      let roundingCustomThreshold = null;
      if (this.form.roundingEnabled && this.form.roundingDirection === 'custom') {
        const value = this.form.roundingCustomThreshold;
        roundingCustomThreshold = value === '' || value == null ? null : value;
      }

      let roundingQuantityCustomThreshold = null;
      if (this.form.roundingQuantityEnabled && this.form.roundingQuantityDirection === 'custom') {
        const value = this.form.roundingQuantityCustomThreshold;
        roundingQuantityCustomThreshold = value === '' || value == null ? null : value;
      }

      const data = {
        name: this.form.name,
        full_name: this.form.fullName?.trim() || null,
        address: this.form.address?.trim() || null,
        phone: this.form.phone?.trim() || null,
        registration_number: this.form.registrationNumber?.trim() || null,
        email: this.form.email?.trim() || null,
        warehouse_number: this.form.warehouseNumber?.trim() || null,
        showDeletedTransactions: this.form.showDeletedTransactions,
        roundingDecimals: this.form.roundingDecimals,
        displayDecimals: this.form.displayDecimals,
        roundingEnabled: this.form.roundingEnabled,
        roundingDirection: this.form.roundingEnabled ? this.form.roundingDirection : null,
        roundingCustomThreshold: roundingCustomThreshold,
        roundingOrdersEnabled: this.form.roundingEnabled ? this.form.roundingOrdersEnabled : false,
        roundingContractsEnabled: this.form.roundingEnabled ? this.form.roundingContractsEnabled : false,
        roundingWarehouseEnabled: this.form.roundingEnabled ? this.form.roundingWarehouseEnabled : false,
        roundingQuantityDecimals: this.form.roundingQuantityDecimals,
        roundingQuantityEnabled: this.form.roundingQuantityEnabled,
        roundingQuantityDirection: this.form.roundingQuantityEnabled ? this.form.roundingQuantityDirection : null,
        roundingQuantityCustomThreshold: roundingQuantityCustomThreshold,
        skipProjectOrderBalance: Boolean(this.form.skipProjectOrderBalance),
        workSchedule: cloneWorkSchedule(this.form.workSchedule),
        transactionCategoryBindings: flattenBindingsForPayload(this.form.transactionCategoryBindings),
      };
      if (this.editingItemId && this.existingLogoCleared) {
        data.logo = '';
      }
      return data;
    },
    async performSave(data) {
      const fileToUpload = this.croppedFile || this.$refs.logoInput?.files[0];

      let response;
      if (this.editingItemId) {
        response = await CompaniesController.updateItem(this.editingItemId, data, fileToUpload);
      } else {
        response = await CompaniesController.storeItem(data, fileToUpload);
      }

      this.lastSaveResponse = response;
      return response;
    },
    async performDelete() {
      const resp = await CompaniesController.deleteItem(this.editingItemId);
      if (!resp) {
        throw new Error('Failed to delete company');
      }
      return resp;
    },
    async onSaveSuccess() {
      if (this.lastSaveResponse?.data) {
        this.$emit('update:editingItem', new CompanyDto(this.lastSaveResponse.data));
      }

      const currentCompanyId = this.$store.state.currentCompany?.id;
      const savedCompanyId = this.lastSaveResponse?.data?.id;

      if (this.editingItemId && Number(currentCompanyId) === Number(savedCompanyId)) {
        eventBus.emit('company-updated');
      }

      this.lastSaveResponse = null;
      this.clearForm();
    },
    onEditingItemChanged(newEditingItem) {
      if (newEditingItem) {
        this.loadCompanyData(newEditingItem);
      }
    },
    closeModal() {
      this.closeForm();
    },

    handleLogoChange(event) {
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
    onRoundingEnabledUpdate(nextValue) {
      if (nextValue) {
        this.roundingConfirmDialog = true;
        return;
      }
      this.form.roundingEnabled = false;
      this.form.roundingOrdersEnabled = false;
      this.form.roundingContractsEnabled = false;
      this.form.roundingWarehouseEnabled = false;
    },
    onRoundingQuantityEnabledUpdate(nextValue) {
      if (nextValue) {
        this.roundingQuantityConfirmDialog = true;
        return;
      }
      this.form.roundingQuantityEnabled = false;
    },
    onSkipProjectOrderBalanceUpdate(nextValue) {
      if (nextValue) {
        this.skipProjectOrderBalanceConfirmDialog = true;
        return;
      }
      this.form.skipProjectOrderBalance = false;
    },

    closeCropperModal() {
      this.showCropperModal = false;
      this.tempImageSrc = '';

      if (this.$refs.logoInput) {
        this.$refs.logoInput.value = '';
      }
    },

    handleCroppedImage(blob) {

      const fileName = `cropped_logo_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Сохраняем обрезанный файл
      this.croppedFile = file;
      this.selectedLogo = URL.createObjectURL(blob);
      this.form.logo = file;
      this.existingLogoCleared = false;

      this.closeCropperModal();
    },

    getCompanyLogoSrc(item) {
      if (!item) return '';
      const logoUrl = item.logoUrl?.();
      if (logoUrl) {
        return logoUrl;
      }
      if (item.logo) {
        const timestamp = item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now();
        return import.meta.env.VITE_APP_BASE_URL + '/storage/' + item.logo + '?v=' + timestamp;
      }
      return '';
    },
    loadCompanyData(company) {
      this.existingLogoCleared = false;
      this.currentTab = 'info';
      this.form.workSchedule = effectiveWorkSchedule(company.workSchedule);
      this.form.name = company.name;
      this.form.fullName = company.fullName || '';
      this.form.address = company.address || '';
      this.form.phone = company.phone || '';
      this.form.registrationNumber = company.registrationNumber || '';
      this.form.email = company.email || '';
      this.form.warehouseNumber = company.warehouseNumber || '';
      this.form.showDeletedTransactions = company.showDeletedTransactions || false;
      this.form.roundingDecimals = company.roundingDecimals;
      this.form.displayDecimals = company.displayDecimals;
      this.form.roundingEnabled = company.roundingEnabled;
      this.form.roundingDirection = company.roundingDirection || 'standard';
      this.form.roundingCustomThreshold = company.roundingCustomThreshold;
      this.form.roundingOrdersEnabled = company.roundingOrdersEnabled;
      this.form.roundingContractsEnabled = company.roundingContractsEnabled;
      this.form.roundingWarehouseEnabled = company.roundingWarehouseEnabled;
      this.form.roundingQuantityDecimals = company.roundingQuantityDecimals;
      this.form.roundingQuantityEnabled = company.roundingQuantityEnabled;
      this.form.roundingQuantityDirection = company.roundingQuantityDirection || 'standard';
      this.form.roundingQuantityCustomThreshold = company.roundingQuantityCustomThreshold;
      this.form.skipProjectOrderBalance = company.skipProjectOrderBalance;
      this.form.transactionCategoryBindings = { ...(company.transactionCategoryBindings || {}) };
      this.selectedLogo = null;
      if (this.$refs.logoInput) {
        this.$refs.logoInput.value = null;
      }
    },
    confirmRoundingEnable() {
      this.roundingConfirmDialog = false;
      this.form.roundingEnabled = true;
      if (!this.editingItem) {
        this.form.roundingOrdersEnabled = true;
        this.form.roundingContractsEnabled = false;
        this.form.roundingWarehouseEnabled = true;
      }
    },
    cancelRoundingEnable() {
      this.roundingConfirmDialog = false;
    },
    confirmQuantityRoundingEnable() {
      this.roundingQuantityConfirmDialog = false;
      this.form.roundingQuantityEnabled = true;
    },
    cancelQuantityRoundingEnable() {
      this.roundingQuantityConfirmDialog = false;
    },
    confirmSkipProjectOrderBalance() {
      this.skipProjectOrderBalanceConfirmDialog = false;
      this.form.skipProjectOrderBalance = true;
    },
    cancelSkipProjectOrderBalance() {
      this.skipProjectOrderBalanceConfirmDialog = false;
    }
  }
}
</script>
