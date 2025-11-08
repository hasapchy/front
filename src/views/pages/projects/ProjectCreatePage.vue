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
            <div v-if="$store.getters.hasPermission('settings_project_budget_view')"
                class="flex items-center space-x-2">
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
                    <div v-if="users != null && users.length > 0">
                        <PrimaryButton :onclick="toggleAllUsers" :is-info="!allUsersSelected"
                            :is-light="allUsersSelected"
                            :icon="allUsersSelected ? 'fas fa-times' : 'fas fa-check-double'" class="text-xs py-1 px-2"
                            :title="allUsersSelected ? $t('deselectAll') : $t('selectAll')">
                        </PrimaryButton>
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

            </div>
        </div>
        <div v-show="currentTab === 'files' && editingItem">
            <FileUploader ref="fileUploader" :files="editingItem ? editingItem.getFormattedFiles() : []"
                :uploading="uploading" :upload-progress="uploadProgress" :disabled="!editingItemId"
                :deleting="deletingFiles" @file-change="handleFileChange" @delete-file="showDeleteFileDialog"
                @delete-multiple-files="showDeleteMultipleFilesDialog" />
        </div>
        <div v-show="currentTab === 'balance' && editingItem">
            <ProjectBalanceTab :editing-item="editingItem" />
        </div>
        <div v-show="currentTab === 'contracts' && editingItem">
            <ProjectContractsTab :editing-item="editingItem" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')"
            :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('projects_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('projects_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteProject')"
        :confirm-text="$t('deleteProject')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <AlertDialog :dialog="deleteFileDialog" @confirm="confirmDeleteFile" @leave="closeDeleteFileDialog"
        :descr="deleteFileIndex === 'multiple' ?
            `${$t('confirmDeleteSelected')} (${selectedFileIds.length})?` :
            `${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`" :confirm-text="$t('deleteFile')" :leave-text="$t('cancel')"
        :confirm-loading="deletingFiles" />
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
import companyChangeMixin from '@/mixins/companyChangeMixin';
import AppController from '@/api/AppController';

import ProjectBalanceTab from '@/views/pages/projects/ProjectBalanceTab.vue';
import ProjectContractsTab from '@/views/pages/projects/ProjectContractsTab.vue';
import FileUploader from '@/views/components/app/forms/FileUploader.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, companyChangeMixin],
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
            deletingFiles: false,
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
            if (!currency.isDefault && currency.exchange_rate) {
                return (1 / currency.exchange_rate).toFixed(6);
            }

            return currency.exchange_rate?.toFixed(6) || '1.000000';
        },
        allUsersSelected() {
            return this.users && this.users.length > 0 && this.selectedUsers.length === this.users.length;
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
            
            // ✅ При создании нового проекта устанавливаем дефолтную валюту
            if (!this.editingItem && !this.currencyId) {
                const defaultCurrency = this.currencies.find(c => c.isDefault);
                if (defaultCurrency) {
                    this.currencyId = defaultCurrency.id;
                    // Для дефолтной валюты курс всегда 1
                    this.exchangeRate = 1;
                }
            }
        },
        async onCurrencyChange() {
            if (this.currencyId) {
                try {
                    const rateData = await AppController.getCurrencyExchangeRate(this.currencyId);
                    // Если выбранная валюта не является дефолтной (манат), 
                    // то курс должен быть 1/курс_валюты для конвертации в манаты
                    const selectedCurrency = this.currencies.find(c => c.id === this.currencyId);
                    if (selectedCurrency && !selectedCurrency.isDefault) {
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
            // ✅ Используем данные из store (кэшированные!)
            await this.$store.dispatch('loadUsers');
            
            // ✅ Используем геттер usersForCurrentCompany - автоматически фильтрует по текущей компании
            this.users = this.$store.getters.usersForCurrentCompany;

            if (this.editingItem && Array.isArray(this.editingItem.users)) {
                // При редактировании существующего проекта - загружаем выбранных пользователей
                // Фильтруем выбранных пользователей, оставляя только тех, кто доступен в текущей компании
                const availableUserIds = this.users.map(u => u.id.toString());
                this.selectedUsers = this.editingItem.getUserIds().filter(id => availableUserIds.includes(id));
            } else if (!this.editingItem) {
                // При создании нового проекта - выбираем всех доступных пользователей по умолчанию
                this.selectAllUsers();
            }
        },
        selectAllUsers() {
            if (this.users && this.users.length > 0) {
                this.selectedUsers = this.users.map(user => user.id.toString());
            }
        },
        deselectAllUsers() {
            this.selectedUsers = [];
        },
        toggleAllUsers() {
            if (this.allUsersSelected) {
                this.deselectAllUsers();
            } else {
                this.selectAllUsers();
            }
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
                    // ✅ Очищаем Store проектов, чтобы они перезагрузились
                    this.$store.commit('SET_PROJECTS', []);
                    this.$store.commit('SET_PROJECTS_DATA', []);
                    
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

            const fileArray = Array.from(files);

            // Создаем массив файлов для отслеживания прогресса
            const uploadingFileIds = fileArray.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                progress: 0,
                error: null
            }));

            // Устанавливаем массив файлов в компонент
            this.$refs.fileUploader.uploadingFiles = uploadingFileIds;

            try {
                // Симулируем прогресс загрузки для всех файлов
                const progressIntervals = uploadingFileIds.map(fileInfo => {
                    return setInterval(() => {
                        const currentProgress = this.$refs.fileUploader.uploadingFiles.find(f => f.id === fileInfo.id)?.progress || 0;
                        if (currentProgress < 90) {
                            this.$refs.fileUploader.updateUploadProgress(fileInfo.id, currentProgress + Math.random() * 10);
                        }
                    }, 200);
                });

                // Загружаем все файлы одновременно
                const uploadedFiles = await ProjectController.uploadFiles(this.editingItemId, fileArray);

                // Останавливаем все интервалы прогресса
                progressIntervals.forEach(interval => clearInterval(interval));

                // Устанавливаем 100% для всех файлов
                uploadingFileIds.forEach(fileInfo => {
                    this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 100);
                });

                // Обновляем список файлов проекта
                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = uploadedFiles;
                }

                // Очищаем список загружающихся файлов через 2 секунды
                setTimeout(() => {
                    this.$refs.fileUploader.uploadingFiles = [];
                }, 2000);

            } catch (error) {
                console.error('Ошибка при загрузке файлов:', error);

                // Устанавливаем ошибку для всех файлов
                uploadingFileIds.forEach(fileInfo => {
                    this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 0, 'Ошибка загрузки файла');
                });

                alert('Произошла ошибка при загрузке файлов');

                // Очищаем список загружающихся файлов при ошибке
                setTimeout(() => {
                    this.$refs.fileUploader.uploadingFiles = [];
                }, 3000);
            }
        },
        showDeleteFileDialog(filePath) {
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },

        showDeleteMultipleFilesDialog(selectedFileIds) {
            if (!selectedFileIds || selectedFileIds.length === 0) return;
            this.selectedFileIds = selectedFileIds;
            this.deleteFileIndex = 'multiple';
            this.deleteFileDialog = true;
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1;
        },
        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) return;

            this.deletingFiles = true;

            try {
                let updatedFiles;

                if (this.deleteFileIndex === 'multiple') {
                    for (const filePath of this.selectedFileIds) {
                        updatedFiles = await ProjectController.deleteFile(this.editingItemId, filePath);
                    }
                    // Очищаем выбранные файлы в FileUploader компоненте
                    if (this.$refs.fileUploader) {
                        this.$refs.fileUploader.selectedFileIds = [];
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
            } finally {
                this.deletingFiles = false;
                this.closeDeleteFileDialog();
            }
        },
        // ✅ Обработчик смены компании - перезагружаем пользователей с фильтрацией по новой компании
        async handleCompanyChanged(companyId) {
            // Очищаем выбранных пользователей, так как они могут быть из другой компании
            this.selectedUsers = [];
            // Перезагружаем пользователей с новой фильтрацией
            await this.fetchUsers();
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
                    
                    // Всегда открываем вкладку "info" при открытии проекта
                    this.currentTab = 'info';
                } else {
                    // Очищаем форму для создания нового проекта
                    this.clearForm();
                    this.currentTab = 'info'; // Сбрасываем вкладку и при закрытии
                }
                this.$nextTick(async () => {
                    this.saveInitialState();
                    // ✅ Если открываем проект для редактирования, перезагружаем пользователей
                    // чтобы отфильтровать их по текущей компании
                    if (newEditingItem) {
                        await this.fetchUsers();
                    } else if (this.users && this.users.length > 0 && this.selectedUsers.length === 0) {
                        // Дополнительная проверка: если это создание нового проекта и пользователи загружены, выбираем всех
                        this.selectedUsers = this.users.map(user => user.id.toString());
                    }
                });
            },
            deep: true,
            immediate: true
        }
    }

}
</script>