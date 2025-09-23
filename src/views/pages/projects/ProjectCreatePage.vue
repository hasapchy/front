<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editProject') : $t('createProject') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div v-show="currentTab === 'info'">
            <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
            <div>
                <label class="required">{{ $t('name') }}</label>
                <input type="text" v-model="name">
            </div>
            <div>
                <label>{{ $t('description') }}</label>
                <textarea v-model="description" rows="3" placeholder="Введите описание проекта"></textarea>
            </div>
            <div>
                <label>{{ $t('projectDate') }}</label>
                <input type="datetime-local" v-model="date" 
                    :disabled="!!editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                    :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
            </div>
            <div v-if="$store.getters.hasPermission('settings_project_budget_view')" class="flex items-center space-x-2">
                <div class="w-full">
                    <label class="required">{{ $t('projectBudget') }}</label>
                    <input type="number" v-model="budget" step="0.01" min="0">
                </div>
                <div class="w-full">
                    <label class="required">{{ $t('projectCurrency') }}</label>
                    <select v-model="currencyId" @change="onCurrencyChange">
                        <option value="">{{ $t('no') }}</option>
                        <template v-if="currencies.length">
                            <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                                {{ currency.symbol }} - {{ currency.name }}
                            </option>
                        </template>
                    </select>
                </div>
            </div>
            <div v-if="currencyId && $store.getters.hasPermission('settings_project_budget_view')" class="mt-2">
                <label class="required">{{ $t('projectExchangeRate') }}</label>
                <input type="number" v-model="exchangeRate" step="0.000001" min="0.000001" 
                       :placeholder="defaultExchangeRate" class="w-full">
                <small class="text-gray-500">{{ $t('exchangeRateHelp') }}</small>
            </div>
            
            <div>
                <div class="flex justify-between items-center mb-2">
                    <label class="required">{{ $t('assignUsers') }}</label>
                    <div v-if="users != null && users.length > 0" class="flex gap-2">
                        <button type="button" @click="selectAllUsers" 
                                class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Выбрать всех
                        </button>
                        <button type="button" @click="deselectAllUsers" 
                                class="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                            Снять всех
                        </button>
                    </div>
                </div>
                <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                    <label v-for="user in users" :key="user.id"
                        class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" :value="user.id.toString()" v-model="selectedUsers"
                            :id="'user-' + user.id" />
                        <span class="text-black">{{ user.name }}</span>
                    </label>
                </div>
                <!-- Показываем информацию о том, что все пользователи выбраны по умолчанию -->
                <div v-if="!editingItem && selectedUsers.length === users.length && users.length > 0" 
                     class="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <i class="fas fa-info-circle mr-1"></i>
                    Все пользователи выбраны по умолчанию для нового проекта
                </div>
            </div>
        </div>
        <div v-show="currentTab === 'files' && editingItem">
            <FileUploader
                :files="editingItem ? editingItem.getFormattedFiles() : []"
                :uploading="uploading"
                :upload-progress="uploadProgress"
                :disabled="!editingItemId"
                @file-change="handleFileChange"
                @delete-file="showDeleteFileDialog"
                @delete-multiple-files="showDeleteMultipleFilesDialog"
            />
        </div>
        <div v-show="currentTab === 'balance' && editingItem">
            <ProjectBalanceTab :editing-item="editingItem" />
        </div>
        <div v-show="currentTab === 'contracts' && editingItem">
            <ProjectContractsTab :editing-item="editingItem" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('projects_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('projects_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteProject')" :confirm-text="$t('deleteProject')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <AlertDialog :dialog="deleteFileDialog" @confirm="confirmDeleteFile" @leave="closeDeleteFileDialog"
        :descr="deleteFileIndex === 'multiple' ? 
            `${$t('confirmDeleteSelected')} (${selectedFileIds.length})?` : 
            `${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`"
                  :confirm-text="$t('deleteFile')" :leave-text="$t('cancel')" />
</template>

<script>
import UsersController from '@/api/UsersController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProjectDto from '@/dto/project/ProjectDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import AppController from '@/api/AppController';

import ProjectBalanceTab from '@/views/pages/projects/ProjectBalanceTab.vue';
import ProjectContractsTab from '@/views/pages/projects/ProjectContractsTab.vue';
import FileUploader from '@/views/components/app/forms/FileUploader.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar, ClientSearch, ProjectBalanceTab, ProjectContractsTab, FileUploader },
    props: {
        editingItem: { type: ProjectDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            budget: this.editingItem ? this.editingItem.budget : 0,
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            exchangeRate: this.editingItem ? this.editingItem.exchangeRate : null,
            date: this.editingItem && this.editingItem.date
                ? new Date(this.editingItem.date).toISOString().substring(0, 16)
                : new Date().toISOString().substring(0, 16),
            description: this.editingItem ? this.editingItem.description : '',
            selectedUsers: [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            users: [],
            currencies: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,

            uploading: false,
            uploadProgress: 0,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            selectedFileIds: [],
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'files', label: 'files' },
                { name: "balance", label: "balance" },
                { name: "contracts", label: "contracts" },
            ],
            

        }
    },
    computed: {
        translatedTabs() {
            const availableTabs = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name === 'info');
            
            return availableTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        defaultExchangeRate() {
            if (!this.currencyId) return '1.000000';
            const currency = this.currencies.find(c => c.id === this.currencyId);
            if (!currency) return '1.000000';
            
            // Если валюта не дефолтная (не манат), показываем 1/курс
            if (!currency.is_default && currency.exchange_rate) {
                return (1 / currency.exchange_rate).toFixed(6);
            }
            
            return currency.exchange_rate?.toFixed(6) || '1.000000';
        }
    },
    created() {
        window.deleteFile = (filePath) => {
            this.showDeleteFileDialog(filePath);
        };
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUsers(),
                this.fetchCurrencies()
            ]);
            
            
            this.saveInitialState();
        });
    },
    methods: {
        clearForm() {
            // Сбрасываем форму и таб на первый (info)
            this.name = '';
            this.budget = 0;
            this.currencyId = '';
            this.exchangeRate = null;
            this.date = new Date().toISOString().substring(0, 16);
            this.description = '';
            this.selectedClient = null;
            this.selectedUsers = [];
            this.editingItemId = null;
            this.currentTab = 'info';
            this.resetFormChanges(); // Сбрасываем состояние изменений
            
            // После очистки формы выбираем всех пользователей по умолчанию
            this.$nextTick(() => {
                if (this.users && this.users.length > 0) {
                    this.selectedUsers = this.users.map(user => user.id.toString());
                    console.log('После очистки формы выбраны все пользователи:', this.selectedUsers);
                }
            });
        },
        changeTab(tabName) {
            if ((tabName === 'files' || tabName === 'balance' || tabName === 'contracts') && !this.editingItem) {
                return;
            }
            this.currentTab = tabName;
        },
        getFormState() {
            return {
                name: this.name,
                budget: this.budget,
                currencyId: this.currencyId,
                exchangeRate: this.exchangeRate,
                date: this.date,
                description: this.description,
                selectedClient: this.selectedClient?.id || null,
                selectedUsers: [...this.selectedUsers]
            };
        },
        async fetchCurrencies() {
            // Используем данные из store
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async onCurrencyChange() {
            if (this.currencyId) {
                try {
                    const rateData = await AppController.getCurrencyExchangeRate(this.currencyId);
                    // Если выбранная валюта не является дефолтной (манат), 
                    // то курс должен быть 1/курс_валюты для конвертации в манаты
                    const selectedCurrency = this.currencies.find(c => c.id === this.currencyId);
                    if (selectedCurrency && !selectedCurrency.is_default) {
                        // Для не-дефолтной валюты курс = 1/курс_валюты (сколько манат за 1 единицу валюты)
                        this.exchangeRate = 1 / rateData.exchange_rate;
                    } else {
                        // Для дефолтной валюты (манат) курс = 1
                        this.exchangeRate = 1;
                    }
                } catch (error) {
                    console.error('Error fetching exchange rate:', error);
                    this.exchangeRate = null;
                }
            } else {
                this.exchangeRate = null;
            }
        },
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();

            if (this.editingItem && Array.isArray(this.editingItem.users)) {
                // При редактировании существующего проекта - загружаем выбранных пользователей
                this.selectedUsers = this.editingItem.getUserIds();
            } else if (!this.editingItem) {
                // При создании нового проекта - выбираем всех пользователей по умолчанию
                this.selectedUsers = this.users.map(user => user.id.toString());
                console.log('Автоматически выбраны все пользователи:', this.selectedUsers);
            }
        },
        selectAllUsers() {
            if (this.users && this.users.length > 0) {
                this.selectedUsers = this.users.map(user => user.id.toString());
                console.log('Выбраны все пользователи:', this.selectedUsers);
            }
        },
        deselectAllUsers() {
            this.selectedUsers = [];
            console.log('Снят выбор со всех пользователей');
        },
        async save() {
            if (this.uploading) {
                alert(this.$t('waitForFileUpload'));
                return;
            }
            
            // Валидация обязательных полей (только если у пользователя есть права на просмотр бюджета)
            if (this.$store.getters.hasPermission('settings_project_budget_view')) {
                if (!this.currencyId) {
                    alert('Пожалуйста, выберите валюту проекта');
                    return;
                }
                if (!this.exchangeRate || this.exchangeRate <= 0) {
                    alert('Пожалуйста, введите корректный курс обмена');
                    return;
                }
            }
            
            this.saveLoading = true;
            try {
                let resp;
                const formData = {
                    name: this.name,
                    date: new Date(this.date).toISOString(),
                    description: this.description || null,
                    client_id: this.selectedClient?.id,
                    users: this.selectedUsers
                };

                // Добавляем поля бюджета только если у пользователя есть права
                if (this.$store.getters.hasPermission('settings_project_budget_view')) {
                    formData.budget = this.budget;
                    formData.currency_id = this.currencyId || null;
                    formData.exchange_rate = this.exchangeRate || null;
                }

                if (this.editingItemId != null) {
                    resp = await ProjectController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await ProjectController.storeItem(formData);
                }

                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }

            this.saveLoading = false;
        },
        async deleteItem() {
            if (!this.editingItemId) return;
            
            this.deleteLoading = true;
            try {
                await ProjectController.deleteItem(this.editingItemId);
                this.$emit('deleted');
                this.clearForm();
                this.closeDeleteDialog(); // Закрываем диалог после успешного удаления
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async handleFileChange(files) {
            if (!this.editingItemId) {
                alert(this.$t('saveProjectFirstThenAttachFiles'));
                return;
            }
            if (!files || !files.length) return;

            this.uploading = true;
            this.uploadProgress = 0;
            
            try {
                const progressInterval = setInterval(() => {
                    if (this.uploadProgress < 90) {
                        this.uploadProgress += Math.random() * 10;
                    }
                }, 200);

                const uploadedFiles = await ProjectController.uploadFiles(this.editingItemId, files);
                
                clearInterval(progressInterval);
                this.uploadProgress = 100;
                
                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = uploadedFiles;
                }
                
                setTimeout(() => {
                    this.uploading = false;
                    this.uploadProgress = 0;
                }, 1000);
                
            } catch (e) {
                this.uploading = false;
                this.uploadProgress = 0;
                alert('Ошибка загрузки файлов');
            }
        },
        showDeleteFileDialog(filePath) {
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        
        showDeleteMultipleFilesDialog() {
            if (this.selectedFileIds.length === 0) return;
            this.deleteFileIndex = 'multiple';
            this.deleteFileDialog = true;
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1;
        },
        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) return;
            
            try {
                let updatedFiles;
                
                if (this.deleteFileIndex === 'multiple') {
                    for (const filePath of this.selectedFileIds) {
                        updatedFiles = await ProjectController.deleteFile(this.editingItemId, filePath);
                    }
                    this.selectedFileIds = []; // Очищаем выбранные файлы
                } else {
                    updatedFiles = await ProjectController.deleteFile(this.editingItemId, this.deleteFileIndex);
                }
                
                if (this.editingItem && this.editingItem.files && updatedFiles) {
                    this.editingItem.files = updatedFiles;
                }
            } catch (e) {
                alert('Ошибка удаления файла');
            }

            this.closeDeleteFileDialog();
        },




    },
    
    beforeUnmount() {
        if (window.deleteFile) {
            delete window.deleteFile;
        }
    },
    
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    // Заполняем форму данными проекта
                    this.name = newEditingItem.name || '';
                    this.budget = newEditingItem.budget || 0;
                    this.currencyId = newEditingItem.currencyId || '';
                    this.exchangeRate = newEditingItem.exchangeRate || null;
                    this.date = newEditingItem.date
                        ? new Date(newEditingItem.date).toISOString().substring(0, 16)
                        : new Date().toISOString().substring(0, 16);
                    this.description = newEditingItem.description || '';
                    this.selectedClient = newEditingItem.client || null;
                    this.selectedUsers = newEditingItem.getUserIds() || [];
                    this.editingItemId = newEditingItem.id || null;
                    
                    // Всегда сбрасываем таб на info при открытии проекта
                    this.currentTab = 'info';
                } else {
                    // Очищаем форму для создания нового проекта
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                    // Дополнительная проверка: если это создание нового проекта и пользователи загружены, выбираем всех
                    if (!newEditingItem && this.users && this.users.length > 0 && this.selectedUsers.length === 0) {
                        this.selectedUsers = this.users.map(user => user.id.toString());
                        console.log('Watcher: выбраны все пользователи для нового проекта:', this.selectedUsers);
                    }
                });
            },
            deep: true,
            immediate: true
        }
    }

}
</script>