<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
        changeTab(t);
      }" />
      <div>
        <div v-show="currentTab === 'info'">
          <div class="mb-4">
            <label class="required">{{ $t('companyName') }}</label>
            <input
              v-model="form.name"
              type="text"
              :placeholder="$t('enterCompanyName')"
              required
            >
          </div>

          <div class="mb-4">
            <label class="mb-1 block">{{ $t('companyLogo') }}</label>
            <input ref="logoInput" type="file" class="hidden" accept="image/*" @change="handleLogoChange">

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
        <div v-show="currentTab === 'holidays'" class="mt-4">
          <HolidayManager v-model="form.holidays" />
        </div>
        <div v-show="currentTab === 'productionCalendar'" class="mt-4">
          <ProductionCalendarManager :company-id="editingItemId" />
        </div>
        <div v-show="currentTab === 'workSchedule'" class="mt-4">
          <WorkScheduleEditor v-model="form.workSchedule" />
        </div>
        <div
          v-show="currentTab === 'settings' && editingItem"
          class="mt-4"
        >
          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('displaySettings') }}
            </h3>
            <label class="flex items-center space-x-2">
              <input v-model="form.showDeletedTransactions" type="checkbox">
              <span>{{ $t('showDeletedTransactions') }}</span>
            </label>
            <label class="mt-3 flex items-center space-x-2">
              <input
                type="checkbox"
                :checked="form.skipProjectOrderBalance"
                @change="handleSkipProjectOrderBalanceChange"
              >
              <span>{{ $t('skipProjectOrderBalance') }}</span>
            </label>
            <div class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ $t('skipProjectOrderBalanceWarningNote') }}
            </div>
          </div>

          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('roundingSettings') }}
            </h3>

            <div class="mb-3">
              <label class="mb-1 block">{{ $t('decimalPlaces') }}</label>
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
              <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                {{ $t('decimalPlacesHint') }}
              </div>
            </div>

            <div class="mb-3">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  :checked="form.roundingEnabled"
                  @change="handleRoundingEnableChange"
                >
                <span>{{ $t('enableRounding') }}</span>
              </label>
              <div class="mt-1 text-xs text-red-600 dark:text-red-400">
                {{ $t('roundingWarningNote') }}
              </div>
            </div>

            <div v-if="form.roundingEnabled">
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
                <label class="mb-1 block">{{ $t('roundingThreshold') }}</label>
                <input
                  v-model.number="form.roundingCustomThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                >
                <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  {{ $t('roundingThresholdHint') }}
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
            <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('quantityRoundingSettings') }}
            </h3>

            <div class="mb-3">
              <label class="mb-1 block">{{ $t('decimalPlaces') }} ({{ $t('forQuantity') }})</label>
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
              <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                {{ $t('quantityDecimalPlacesHint') }}
              </div>
            </div>

            <div class="mb-3">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  :checked="form.roundingQuantityEnabled"
                  @change="handleQuantityRoundingEnableChange"
                >
                <span>{{ $t('enableRounding') }} ({{ $t('forQuantity') }})</span>
              </label>
              <div class="mt-1 text-xs text-red-600 dark:text-red-400">
                {{ $t('roundingQuantityWarningNote') }}
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
                <label class="mb-1 block">{{ $t('roundingThreshold') }} ({{ $t('forQuantity') }})</label>
                <input
                  v-model.number="form.roundingQuantityCustomThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                >
                <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  {{ $t('roundingThresholdHint') }}
                </div>
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
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import HolidayManager from '@/views/components/app/HolidayManager.vue';
import CompaniesController from '@/api/CompaniesController';
import CompanyHolidayController from '@/api/CompanyHolidayController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { eventBus } from '@/eventBus';
import WorkScheduleEditor from '@/views/components/app/WorkScheduleEditor.vue';
import ProductionCalendarManager from '@/views/components/app/ProductionCalendarManager.vue';
import { CompanyDto } from '@/dto/companies/CompanyDto';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { applyLogoImageFallback } from '@/constants/imageFallback';

export default {
  components: { PrimaryButton, AlertDialog, ImageCropperModal, TabBar, HolidayManager, WorkScheduleEditor, ProductionCalendarManager },
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
        logo: null,
        showDeletedTransactions: false,
        roundingDecimals: 2,
        roundingEnabled: true,
        roundingDirection: 'standard',
        roundingCustomThreshold: null,
        roundingQuantityDecimals: 2,
        roundingQuantityEnabled: true,
        roundingQuantityDirection: 'standard',
        roundingQuantityCustomThreshold: null,
        skipProjectOrderBalance: true,
        holidays: [],
        workSchedule: null,
      },
      selectedLogo: null,
      showCropperModal: false,
      tempImageSrc: '',
      croppedFile: null,
      existingLogoCleared: false,
      currentTab: 'info',
      tabs: [
        { name: 'info', label: 'info' },
        { name: 'holidays', label: 'holidays' },
        { name: 'productionCalendar', label: 'productionCalendar' },
        { name: 'workSchedule', label: 'workSchedule' },
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

      // Скрываем вкладки настроек и праздников при создании новой компании
      if (!this.editingItem) {
        visibleTabs = visibleTabs.filter(tab =>
          tab.name !== 'settings' && tab.name !== 'holidays' && tab.name !== 'productionCalendar'
        );
      }

      if (!this.$store.getters.hasPermission('company_holidays_view_all')) {
        visibleTabs = visibleTabs.filter(tab => tab.name !== 'holidays');
      }

      if (!this.$store.getters.hasPermission('company_production_calendar_view_all')) {
        visibleTabs = visibleTabs.filter(tab => tab.name !== 'productionCalendar');
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
      // Предотвращаем переход на вкладки настроек и праздников при создании новой компании
      if ((tabName === 'settings' || tabName === 'holidays' || tabName === 'productionCalendar') && !this.editingItem) {
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
      };
    },
    clearForm() {
      this.form.name = '';
      this.form.logo = null;
      this.form.showDeletedTransactions = false;
      this.form.roundingDecimals = 2;
      this.form.roundingEnabled = true;
      this.form.roundingDirection = 'standard';
      this.form.roundingCustomThreshold = null;
      this.form.roundingQuantityDecimals = 2;
      this.form.roundingQuantityEnabled = true;
      this.form.roundingQuantityDirection = 'standard';
      this.form.roundingQuantityCustomThreshold = null;
      this.form.skipProjectOrderBalance = true;
      this.form.holidays = [];
      this.form.workSchedule = null;
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
        roundingCustomThreshold = (value === '' || value === null || value === undefined) ? null : value;
      }

      let roundingQuantityCustomThreshold = null;
      if (this.form.roundingQuantityEnabled && this.form.roundingQuantityDirection === 'custom') {
        const value = this.form.roundingQuantityCustomThreshold;
        roundingQuantityCustomThreshold = (value === '' || value === null || value === undefined) ? null : value;
      }

      const data = {
        name: this.form.name,
        showDeletedTransactions: this.form.showDeletedTransactions,
        roundingDecimals: this.form.roundingDecimals,
        roundingEnabled: this.form.roundingEnabled,
        roundingDirection: this.form.roundingEnabled ? this.form.roundingDirection : null,
        roundingCustomThreshold: roundingCustomThreshold,
        roundingQuantityDecimals: this.form.roundingQuantityDecimals,
        roundingQuantityEnabled: this.form.roundingQuantityEnabled,
        roundingQuantityDirection: this.form.roundingQuantityEnabled ? this.form.roundingQuantityDirection : null,
        roundingQuantityCustomThreshold: roundingQuantityCustomThreshold,
        skipProjectOrderBalance: Boolean(this.form.skipProjectOrderBalance),
      };
      if (this.form.workSchedule !== null && this.form.workSchedule !== undefined) {
        data.workSchedule = this.form.workSchedule;
      }
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
    async saveHolidays(companyId) {
      try {
        // Получаем существующие праздники для этой компании
        const existingHolidays = await this.$store.dispatch('loadCompanyHolidays', {
          companyId: companyId
        });
        const existingIds = new Set(existingHolidays.map(h => h.id));

        if (!this.form.holidays || this.form.holidays.length === 0) {
          // Если праздников нет, удаляем все существующие
          for (const existing of existingHolidays) {
            await CompanyHolidayController.deleteItem(existing.id);
          }
          return;
        }

        // Удаляем праздники, которых больше нет в form.holidays
        for (const existing of existingHolidays) {
          if (!this.form.holidays.some(h => h.id === existing.id)) {
            await CompanyHolidayController.deleteItem(existing.id);
          }
        }

        // Создаём или обновляем праздники
        for (const holiday of this.form.holidays) {
          const data = {
            companyId: companyId,
            name: holiday.name,
            date: holiday.date,
            endDate: holiday.endDate ?? null,
            isRecurring: holiday.isRecurring ?? true,
            color: holiday.color || '#FF5733',
          };

          if (holiday.id && existingIds.has(holiday.id)) {
            // Обновляем существующий
            await CompanyHolidayController.updateItem(holiday.id, data);
          } else {
            // Создаём новый (holiday.id === null или не существует в базе)
            await CompanyHolidayController.storeItem(data);
          }
        }
      } catch (error) {
        console.error('Ошибка сохранения праздников:', error);
        this.showNotification(
          this.$t('warning'),
          'Компания сохранена, но возникла ошибка с праздниками',
          true
        );
      }
    },
    async performDelete() {
      const resp = await CompaniesController.deleteItem(this.editingItemId);
      if (!resp) {
        throw new Error('Failed to delete company');
      }
      return resp;
    },
    async onSaveSuccess() {
      // Сохраняем праздники ТОЛЬКО при редактировании существующей компании
      const companyId = this.lastSaveResponse?.data?.id || this.editingItemId;
      if (this.editingItemId && companyId) {
        await this.saveHolidays(companyId);
      }

      // Обновляем editingItem новыми данными после сохранения
      if (this.lastSaveResponse?.data) {
        const updatedCompany = new CompanyDto(this.lastSaveResponse.data);
        this.$emit('update:editingItem', updatedCompany);
        this.loadCompanyData(updatedCompany);
      }

      // Эмитим company-updated только если редактируем текущую компанию
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
    handleRoundingEnableChange(event) {
      const nextValue = event.target.checked;
      if (nextValue) {
        event.target.checked = this.form.roundingEnabled;
        this.roundingConfirmDialog = true;
        return;
      }
      this.form.roundingEnabled = false;
    },
    handleQuantityRoundingEnableChange(event) {
      const nextValue = event.target.checked;
      if (nextValue) {
        event.target.checked = this.form.roundingQuantityEnabled;
        this.roundingQuantityConfirmDialog = true;
        return;
      }
      this.form.roundingQuantityEnabled = false;
    },
    handleSkipProjectOrderBalanceChange(event) {
      const nextValue = event.target.checked;
      if (nextValue) {
        event.target.checked = this.form.skipProjectOrderBalance;
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
    formatDateForInput(date) {
      // Конвертирует дату из формата "2026-03-13T19:00:00.000000Z" в "2026-03-13"
      if (!date) return '';

      // Если дата уже в правильном формате
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // Если дата в ISO формате или другом формате с временем
      try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error('Ошибка форматирования даты:', date, e);
        return date;
      }
    },

    async loadCompanyData(company) {
      this.existingLogoCleared = false;
      this.currentTab = 'info';
      this.form.workSchedule = company.workSchedule || null;
      this.form.name = company.name;
      this.form.showDeletedTransactions = company.showDeletedTransactions || false;
      this.form.roundingDecimals = Math.min(
        company.roundingDecimals !== undefined ? company.roundingDecimals : 2,
        2
      );
      this.form.roundingEnabled = company.roundingEnabled !== undefined ? company.roundingEnabled : true;
      this.form.roundingDirection = company.roundingDirection || 'standard';
      this.form.roundingCustomThreshold = company.roundingCustomThreshold || null;
      this.form.roundingQuantityDecimals = company.roundingQuantityDecimals !== undefined ? company.roundingQuantityDecimals : 2;
      this.form.roundingQuantityEnabled = company.roundingQuantityEnabled !== undefined ? company.roundingQuantityEnabled : true;
      this.form.roundingQuantityDirection = company.roundingQuantityDirection || 'standard';
      this.form.roundingQuantityCustomThreshold = company.roundingQuantityCustomThreshold || null;
      this.form.skipProjectOrderBalance = company.skipProjectOrderBalance !== undefined ? company.skipProjectOrderBalance : true;
      this.selectedLogo = null;
      if (this.$refs.logoInput) {
        this.$refs.logoInput.value = null;
      }

      // Загружаем праздники для любой компании (передаём company_id)
      if (company.id) {
        try {
          const holidays = await this.$store.dispatch('loadCompanyHolidays', {
            companyId: company.id
          });
          this.form.holidays = holidays.map(h => ({
            id: h.id,
            name: h.name,
            date: this.formatDateForInput(h.date),
            endDate: h.endDate ? this.formatDateForInput(h.endDate) : null,
            isRecurring: h.isRecurring ?? true,
            color: h.color || '#FF5733',
          }));
        } catch (error) {
          console.error('Ошибка загрузки праздников:', error);
          this.form.holidays = [];
        }
      } else {
        this.form.holidays = [];
      }
    },
    confirmRoundingEnable() {
      this.roundingConfirmDialog = false;
      this.form.roundingEnabled = true;
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
