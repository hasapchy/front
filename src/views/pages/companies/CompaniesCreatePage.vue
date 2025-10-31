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
                    <input 
                        type="text" 
                        v-model="form.name" 
                        :placeholder="$t('enterCompanyName')"
                        required
                    />
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
                            <img src="/logo.jpg" alt="Placeholder" class="w-16 h-16 object-contain opacity-50">
                            <span class="text-xs text-gray-500 mt-2 text-center">{{ $t('clickToUploadImage') }}</span>
                        </div>
                    </div>
                </div>
      </div>
      <div v-show="currentTab === 'settings' && editingItem" class="mt-4">
                <!-- Настройка отображения удаленных транзакций -->
                <div class="mb-6 p-4 bg-white border rounded">
                  <h3 class="text-md font-semibold mb-3">{{ $t('displaySettings') }}</h3>
                  <label class="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      v-model="form.show_deleted_transactions"
                    />
                    <span>{{ $t('showDeletedTransactions') }}</span>
                  </label>
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
                      <input 
                        type="checkbox" 
                        v-model="form.rounding_enabled"
                      />
                      <span>{{ $t('enableRounding') }}</span>
                    </label>
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
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="1"
                        v-model.number="form.rounding_custom_threshold"
                      />
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
    <PrimaryButton v-if="editingItem != null" :onclick="deleteItem" :is-danger="true"
      :is-loading="deleteLoading" icon="fas fa-trash">
    </PrimaryButton>
    <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading"
      :disabled="(editingItemId != null && !$store.getters.hasPermission('companies_update')) ||
      (editingItemId == null && !$store.getters.hasPermission('companies_create'))">
    </PrimaryButton>
  </div>

    <AlertDialog :dialog="deleteDialog" @confirm="confirmDelete" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
        
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
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import ImageCropperModal from '@/views/components/app/ImageCropperModal.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import CompaniesController from '@/api/CompaniesController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import { eventBus } from '@/eventBus';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    components: { PrimaryButton, AlertDialog, NotificationToast, ImageCropperModal, TabBar },
    props: {
        editingItem: {
            type: Object,
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            form: {
                name: '',
                logo: null,
                show_deleted_transactions: false,
                rounding_decimals: 2,
                rounding_enabled: true,
                rounding_direction: 'standard',
                rounding_custom_threshold: null,
            },
            editingItemId: null,
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            currentLogo: '',
            selected_logo: null,
            showCropperModal: false,
            tempImageSrc: '',
            croppedFile: null,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'settings', label: 'settings' }
            ]
        };
    },
    computed: {
        translatedTabs() {
            // Скрываем вкладку настроек при создании новой компании
            const visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name !== 'settings');
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
            
            this.saveInitialState();
        });
    },
    methods: {
        changeTab(tabName) {
            // Предотвращаем переход на вкладку настроек при создании новой компании
            if (tabName === 'settings' && !this.editingItem) {
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
            this.editingItemId = null;
            this.currentLogo = '';
            this.selected_logo = null;
            this.croppedFile = null;
            this.showCropperModal = false;
            this.tempImageSrc = '';
            this.currentTab = 'info';
            if (this.$refs.logoInput) {
                this.$refs.logoInput.value = null;
            }
            this.resetFormChanges();
            this.$nextTick(() => {
                this.saveInitialState();
            });
        },
        async save() {
            this.saveLoading = true;
            try {
                const item = {
                    name: this.form.name,
                    show_deleted_transactions: this.form.show_deleted_transactions,
                    rounding_decimals: this.form.rounding_decimals,
                    rounding_enabled: this.form.rounding_enabled,
                    rounding_direction: this.form.rounding_direction,
                    rounding_custom_threshold: this.form.rounding_direction === 'custom' ? this.form.rounding_custom_threshold : null,
                };

                // Используем обрезанный файл, если он есть, иначе файл из input
                const fileToUpload = this.croppedFile || this.$refs.logoInput?.files[0];

                if (this.editingItem) {
                    await CompaniesController.updateItem(
                        this.editingItemId,
                        item,
                        fileToUpload
                    );
                } else {
                    await CompaniesController.storeItem(item, fileToUpload);
                }

                this.$emit('saved');
                // Отправляем событие об обновлении компании
                eventBus.emit('company-updated');
                this.clearForm();
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.$emit('saved-error', errorMessage);
            } finally {
                this.saveLoading = false;
            }
        },
        deleteItem() {
            this.deleteDialog = true;
        },
        async confirmDelete() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            
            this.deleteLoading = true;
            try {
                await CompaniesController.deleteItem(this.editingItemId);
                this.$emit('deleted');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.$emit('deleted-error', errorMessage);
            } finally {
                this.deleteLoading = false;
            }
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
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
        
        closeCropperModal() {
            this.showCropperModal = false;
            this.tempImageSrc = '';
            // Очищаем input file
            if (this.$refs.logoInput) {
                this.$refs.logoInput.value = '';
            }
        },
        
        handleCroppedImage(blob) {
            // Создаем File объект из blob
            const fileName = `cropped_logo_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Сохраняем обрезанный файл
            this.croppedFile = file;
            this.selected_logo = URL.createObjectURL(blob);
            this.form.logo = file;
            
            // Закрываем модальное окно
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
        
        loadCompanyData(company) {
            this.form.name = company.name || '';
            this.form.show_deleted_transactions = company.show_deleted_transactions || false;
            this.form.rounding_decimals = company.rounding_decimals !== undefined ? company.rounding_decimals : 2;
            this.form.rounding_enabled = company.rounding_enabled !== undefined ? company.rounding_enabled : true;
            this.form.rounding_direction = company.rounding_direction || 'standard';
            this.form.rounding_custom_threshold = company.rounding_custom_threshold || null;
            this.currentLogo = company.logo || '';
            this.selected_logo = null; // Сбрасываем выбранное изображение при загрузке данных
            if (this.$refs.logoInput) {
                this.$refs.logoInput.value = null;
            }
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.editingItemId = newEditingItem.id || null;
                    this.loadCompanyData(newEditingItem);
                } else {
                    if (oldEditingItem !== undefined) {
                        this.clearForm();
                    }
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            immediate: true
        }
    }
};
</script>
