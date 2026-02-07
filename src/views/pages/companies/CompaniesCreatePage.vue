<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCompany') : $t('addCompany') }}</h2>
        <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
            changeTab(t);
        }" />
        <div>
            <div v-show="currentTab === 'info'">
                <div class="mb-4">
                    <label class="required">{{ $t('companyName') }}</label>
                    <input type="text" v-model="form.name" :placeholder="$t('enterCompanyName')" required />
                </div>

                <div class="mb-4">
                    <label class="block mb-1">{{ $t('companyLogo') }}</label>
                    <input type="file" @change="handleLogoChange" ref="logoInput" class="hidden" accept="image/*">

                    <div v-if="selected_logo"
                        class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden">
                        <img :src="selected_logo" alt="Selected Logo"
                            class="max-w-full max-h-full object-contain rounded">
                        <button @click="() => { this.selected_logo = null; this.form.logo = null }"
                            class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div v-else-if="editingItem?.logo"
                        class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden">
                        <img :src="getCompanyLogoSrc(editingItem)" alt="Company Logo"
                            class="max-w-full max-h-full object-contain rounded">
                        <button @click="() => { this.editingItem.logo = '' }"
                            class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div v-else @click="$refs.logoInput.click()"
                        class="h-40 p-3 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <div class="w-full h-full flex flex-col items-center justify-center bg-white rounded">
                            <img src="/logo.png" alt="Placeholder" class="w-16 h-16 object-contain opacity-50">
                            <span class="text-xs text-gray-500 mt-2 text-center">{{ $t('clickToUploadImage') }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-show="currentTab === 'holidays'" class="mt-4">
                <HolidayManager v-model="form.holidays" :company-id="editingItemId" />
            </div>
            <div v-show="currentTab === 'workSchedule'" class="mt-4">
                <WorkScheduleEditor v-model="form.work_schedule" />
            </div>
            <div v-show="currentTab === 'settings' && editingItem" class="mt-4">
                <!-- Настройка отображения удаленных транзакций -->
                <div class="mb-6 p-4 bg-white border rounded">
                    <h3 class="text-md font-semibold mb-3">{{ $t('displaySettings') }}</h3>
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" v-model="form.show_deleted_transactions" />
                        <span>{{ $t('showDeletedTransactions') }}</span>
                    </label>
                    <label class="flex items-center space-x-2 mt-3">
                        <input type="checkbox" :checked="form.skip_project_order_balance"
                            @change="handleSkipProjectOrderBalanceChange" />
                        <span>{{ $t('skipProjectOrderBalance') }}</span>
                    </label>
                    <div class="text-xs text-red-600 mt-1">
                        {{ $t('skipProjectOrderBalanceWarningNote') }}
                    </div>
                </div>

                <!-- Настройки округления -->
                <div class="mb-6 p-4 bg-white border rounded">
                    <h3 class="text-md font-semibold mb-3">{{ $t('roundingSettings') }}</h3>

                    <div class="mb-3">
                        <label class="block mb-1">{{ $t('decimalPlaces') }}</label>
                        <select v-model.number="form.rounding_decimals">
                            <option :value="0">0</option>
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                            <option :value="4">4</option>
                            <option :value="5">5</option>
                        </select>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ $t('decimalPlacesHint') }}
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" :checked="form.rounding_enabled"
                                @change="handleRoundingEnableChange" />
                            <span>{{ $t('enableRounding') }}</span>
                        </label>
                        <div class="text-xs text-red-600 mt-1">
                            {{ $t('roundingWarningNote') }}
                        </div>
                    </div>

                    <div v-if="form.rounding_enabled">
                        <div class="mb-3">
                            <label class="block mb-1">{{ $t('roundingDirection') }}</label>
                            <select v-model="form.rounding_direction">
                                <option value="standard">{{ $t('roundingStandard') }}</option>
                                <option value="up">{{ $t('roundingUp') }}</option>
                                <option value="down">{{ $t('roundingDown') }}</option>
                                <option value="custom">{{ $t('roundingCustom') }}</option>
                            </select>
                        </div>

                        <div v-if="form.rounding_direction === 'custom'">
                            <label class="block mb-1">{{ $t('roundingThreshold') }}</label>
                            <input type="number" step="0.01" min="0" max="1"
                                v-model.number="form.rounding_custom_threshold" />
                            <div class="text-xs text-gray-500 mt-1">
                                {{ $t('roundingThresholdHint') }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Настройки округления количества товара -->
                <div class="mb-6 p-4 bg-white border rounded">
                    <h3 class="text-md font-semibold mb-3">{{ $t('quantityRoundingSettings') }}</h3>

                    <div class="mb-3">
                        <label class="block mb-1">{{ $t('decimalPlaces') }} ({{ $t('forQuantity') }})</label>
                        <select v-model.number="form.rounding_quantity_decimals">
                            <option :value="0">0</option>
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                            <option :value="4">4</option>
                            <option :value="5">5</option>
                        </select>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ $t('decimalPlacesHint') }}
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" :checked="form.rounding_quantity_enabled"
                                @change="handleQuantityRoundingEnableChange" />
                            <span>{{ $t('enableRounding') }} ({{ $t('forQuantity') }})</span>
                        </label>
                        <div class="text-xs text-red-600 mt-1">
                            {{ $t('roundingQuantityWarningNote') }}
                        </div>
                    </div>

                    <div v-if="form.rounding_quantity_enabled">
                        <div class="mb-3">
                            <label class="block mb-1">{{ $t('roundingDirection') }} ({{ $t('forQuantity') }})</label>
                            <select v-model="form.rounding_quantity_direction">
                                <option value="standard">{{ $t('roundingStandard') }}</option>
                                <option value="up">{{ $t('roundingUp') }}</option>
                                <option value="down">{{ $t('roundingDown') }}</option>
                                <option value="custom">{{ $t('roundingCustom') }}</option>
                            </select>
                        </div>

                        <div v-if="form.rounding_quantity_direction === 'custom'">
                            <label class="block mb-1">{{ $t('roundingThreshold') }} ({{ $t('forQuantity') }})</label>
                            <input type="number" step="0.01" min="0" max="1"
                                v-model.number="form.rounding_quantity_custom_threshold" />
                            <div class="text-xs text-gray-500 mt-1">
                                {{ $t('roundingThresholdHint') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="deleteItem" :is-danger="true" :is-loading="deleteLoading"
            icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('companies_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('companies_create'))" :aria-label="$t('save')">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <AlertDialog :dialog="roundingConfirmDialog" @confirm="confirmRoundingEnable" @leave="cancelRoundingEnable"
        :descr="$t('roundingEnableConfirmDescription') || 'Вы уверены, что хотите включить округление? Суммы будут округляться без сохранения исходного значения.'"
        :confirm-text="$t('enable') || 'Включить'" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="roundingQuantityConfirmDialog" @confirm="confirmQuantityRoundingEnable"
        @leave="cancelQuantityRoundingEnable"
        :descr="$t('roundingQuantityEnableConfirmDescription') || 'Вы уверены, что хотите включить округление количества? Значения будут округляться без сохранения исходных данных.'"
        :confirm-text="$t('enable') || 'Включить'" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="skipProjectOrderBalanceConfirmDialog" @confirm="confirmSkipProjectOrderBalance"
        @leave="cancelSkipProjectOrderBalance"
        :descr="$t('skipProjectOrderBalanceEnableConfirmDescription') || 'Вы уверены, что хотите пропускать баланс заказов проекта? Значения будут изменены без сохранения исходных данных.'"
        :confirm-text="$t('enable') || 'Включить'" :leave-text="$t('cancel')" />

    <!-- Image Cropper Modal -->
    <ImageCropperModal :show="showCropperModal" :imageSrc="tempImageSrc" @close="closeCropperModal"
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
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { eventBus } from '@/eventBus';
import WorkScheduleEditor from '@/views/components/app/WorkScheduleEditor.vue';
import { CompanyDto } from '@/dto/companies/CompanyDto';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin, crudFormMixin],
    components: { PrimaryButton, AlertDialog, ImageCropperModal, TabBar, HolidayManager, WorkScheduleEditor },
    props: {
        editingItem: {
            type: Object,
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            lastSaveResponse: null, // Для передачи response в onSaveSuccess
            form: {
                name: '',
                logo: null,
                show_deleted_transactions: false,
                rounding_decimals: 2,
                rounding_enabled: true,
                rounding_direction: 'standard',
                rounding_custom_threshold: null,
                rounding_quantity_decimals: 2,
                rounding_quantity_enabled: true,
                rounding_quantity_direction: 'standard',
                rounding_quantity_custom_threshold: null,
                skip_project_order_balance: true,
                holidays: [],
                work_schedule: null,
            },
            currentLogo: '',
            selected_logo: null,
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'holidays', label: 'holidays' },
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
                    tab.name !== 'settings' && tab.name !== 'holidays'
                );
            }
            
            // Скрываем вкладку праздников, если нет прав на просмотр
            if (!this.$store.getters.hasPermission('company_holidays_view_all')) {
                visibleTabs = visibleTabs.filter(tab => tab.name !== 'holidays');
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
        changeTab(tabName) {
            // Предотвращаем переход на вкладки настроек и праздников при создании новой компании
            if ((tabName === 'settings' || tabName === 'holidays') && !this.editingItem) {
                this.currentTab = 'info';
                return;
            }
            this.currentTab = tabName;
        },
        getFormState() {
            return {
                name: this.form.name,
                logo: this.form.logo,
                show_deleted_transactions: this.form.show_deleted_transactions,
            };
        },
        clearForm() {
            this.form.name = '';
            this.form.logo = null;
            this.form.show_deleted_transactions = false;
            this.form.rounding_decimals = 2;
            this.form.rounding_enabled = true;
            this.form.rounding_direction = 'standard';
            this.form.rounding_custom_threshold = null;
            this.form.rounding_quantity_decimals = 2;
            this.form.rounding_quantity_enabled = true;
            this.form.rounding_quantity_direction = 'standard';
            this.form.rounding_quantity_custom_threshold = null;
            this.form.skip_project_order_balance = true;
            this.form.holidays = [];
            this.form.work_schedule = null;
            this.currentLogo = '';
            this.selected_logo = null;
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
            // Определяем rounding_custom_threshold: null если округление выключено или не custom, иначе значение или null
            let rounding_custom_threshold = null;
            if (this.form.rounding_enabled && this.form.rounding_direction === 'custom') {
                const value = this.form.rounding_custom_threshold;
                rounding_custom_threshold = (value === '' || value === null || value === undefined) ? null : value;
            }

            // Определяем rounding_quantity_custom_threshold: null если округление выключено или не custom, иначе значение или null
            let rounding_quantity_custom_threshold = null;
            if (this.form.rounding_quantity_enabled && this.form.rounding_quantity_direction === 'custom') {
                const value = this.form.rounding_quantity_custom_threshold;
                rounding_quantity_custom_threshold = (value === '' || value === null || value === undefined) ? null : value;
            }

            const data = {
                name: this.form.name,
                show_deleted_transactions: this.form.show_deleted_transactions,
                rounding_decimals: this.form.rounding_decimals,
                rounding_enabled: this.form.rounding_enabled,
                rounding_direction: this.form.rounding_enabled ? this.form.rounding_direction : null,
                rounding_custom_threshold: rounding_custom_threshold,
                rounding_quantity_decimals: this.form.rounding_quantity_decimals,
                rounding_quantity_enabled: this.form.rounding_quantity_enabled,
                rounding_quantity_direction: this.form.rounding_quantity_enabled ? this.form.rounding_quantity_direction : null,
                rounding_quantity_custom_threshold: rounding_quantity_custom_threshold,
                skip_project_order_balance: Boolean(this.form.skip_project_order_balance),
            };
            // Добавляем work_schedule только если он не null и не undefined
            if (this.form.work_schedule !== null && this.form.work_schedule !== undefined) {
                data.work_schedule = this.form.work_schedule;
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
                const existingHolidays = await CompanyHolidayController.getAll({ 
                    company_id: companyId 
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
                        company_id: companyId,
                        name: holiday.name,
                        date: holiday.date,
                        is_recurring: holiday.isRecurring ?? true,
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
        async onSaveSuccess(response) {
            // Сохраняем праздники ТОЛЬКО при редактировании существующей компании
            const companyId = this.lastSaveResponse?.company?.id || this.editingItemId;
            if (this.editingItemId && companyId) {
                await this.saveHolidays(companyId);
            }
            
            // Обновляем editingItem новыми данными после сохранения
            if (this.lastSaveResponse?.company) {
                // Преобразуем данные в CompanyDto для консистентности
                const updatedCompany = new CompanyDto(this.lastSaveResponse.company);
                this.$emit('update:editingItem', updatedCompany);
                // Также обновляем локально для немедленного отображения
                this.editingItem = updatedCompany;
                // Перезагружаем данные формы с обновленными данными
                this.loadCompanyData(updatedCompany);
            }

            // Эмитим company-updated только если редактируем текущую компанию
            const currentCompanyId = this.$store.state.currentCompany?.id;
            const savedCompanyId = this.lastSaveResponse?.company?.id;
            
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
                event.target.checked = this.form.rounding_enabled;
                this.roundingConfirmDialog = true;
                return;
            }
            this.form.rounding_enabled = false;
        },
        handleQuantityRoundingEnableChange(event) {
            const nextValue = event.target.checked;
            if (nextValue) {
                event.target.checked = this.form.rounding_quantity_enabled;
                this.roundingQuantityConfirmDialog = true;
                return;
            }
            this.form.rounding_quantity_enabled = false;
        },
        handleSkipProjectOrderBalanceChange(event) {
            const nextValue = event.target.checked;
            if (nextValue) {
                event.target.checked = this.form.skip_project_order_balance;
                this.skipProjectOrderBalanceConfirmDialog = true;
                return;
            }
            this.form.skip_project_order_balance = false;
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
            this.selected_logo = URL.createObjectURL(blob);
            this.form.logo = file;


            this.closeCropperModal();
        },

        getCompanyLogoSrc(item) {
            if (!item) return '';
            if (item.logoUrl && typeof item.logoUrl === 'function') {
                return item.logoUrl();
            }
            if (item.logo) {
                // Добавляем timestamp для инвалидации кэша браузера
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
            // Всегда начинаем с вкладки "Информация"
            this.currentTab = 'info';
            this.form.work_schedule = company.work_schedule || null;
            this.form.name = company.name || '';
            this.form.show_deleted_transactions = company.show_deleted_transactions || false;
            this.form.rounding_decimals = company.rounding_decimals !== undefined ? company.rounding_decimals : 2;
            this.form.rounding_enabled = company.rounding_enabled !== undefined ? company.rounding_enabled : true;
            this.form.rounding_direction = company.rounding_direction || 'standard';
            this.form.rounding_custom_threshold = company.rounding_custom_threshold || null;
            this.form.rounding_quantity_decimals = company.rounding_quantity_decimals !== undefined ? company.rounding_quantity_decimals : 2;
            this.form.rounding_quantity_enabled = company.rounding_quantity_enabled !== undefined ? company.rounding_quantity_enabled : true;
            this.form.rounding_quantity_direction = company.rounding_quantity_direction || 'standard';
            this.form.rounding_quantity_custom_threshold = company.rounding_quantity_custom_threshold || null;
            this.form.skip_project_order_balance = company.skip_project_order_balance !== undefined ? company.skip_project_order_balance : true;
            this.currentLogo = company.logo || '';
            this.selected_logo = null;
            if (this.$refs.logoInput) {
                this.$refs.logoInput.value = null;
            }

            // Загружаем праздники для любой компании (передаём company_id)
            if (company.id) {
                try {
                    const holidays = await CompanyHolidayController.getAll({ 
                        company_id: company.id 
                    });
                    this.form.holidays = holidays.map(h => ({
                        id: h.id,
                        name: h.name,
                        date: this.formatDateForInput(h.date),
                        isRecurring: h.is_recurring ?? true,
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
            this.form.rounding_enabled = true;
        },
        cancelRoundingEnable() {
            this.roundingConfirmDialog = false;
        },
        confirmQuantityRoundingEnable() {
            this.roundingQuantityConfirmDialog = false;
            this.form.rounding_quantity_enabled = true;
        },
        cancelQuantityRoundingEnable() {
            this.roundingQuantityConfirmDialog = false;
        },
        confirmSkipProjectOrderBalance() {
            this.skipProjectOrderBalanceConfirmDialog = false;
            this.form.skip_project_order_balance = true;
        },
        cancelSkipProjectOrderBalance() {
            this.skipProjectOrderBalanceConfirmDialog = false;
        }
    }
}
</script>
