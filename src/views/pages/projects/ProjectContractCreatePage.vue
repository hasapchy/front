<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editContract') : $t('addContract') }}</h2>
        
        <div>
            <div>
                <label class="required">{{ $t('contractNumber') }}</label>
                <input type="text" v-model="number" :placeholder="$t('enterContractNumber')" required>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-full">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="amount" step="0.01" min="0" :placeholder="$t('enterAmount')" required>
                </div>
                <div class="w-full">
                    <label class="required">{{ $t('currency') }}</label>
                    <select v-model="currencyId">
                        <option value="">{{ $t('selectCurrency') }}</option>
                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                            {{ currency.symbol }} - {{ currency.name }}
                        </option>
                    </select>
                </div>
            </div>
            <div>
                <label class="required">{{ $t('date') }}</label>
                <input type="datetime-local" v-model="date" required>
            </div>
            <div>
                <label>
                    <input type="checkbox" v-model="returned">
                    <span>{{ $t('contractReturned') }}</span>
                </label>
            </div>
            <div>
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" :placeholder="$t('enterNote')" rows="3"></textarea>
            </div>
            
            <!-- Файлы -->
            <!-- <div class="mt-4">
                <FileUploader
                    :files="formattedFiles"
                    :uploading="uploading"
                    :upload-progress="uploadProgress"
                    :disabled="false"
                    accepted-file-types=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    @file-change="handleFileUpload"
                    @delete-file="removeFileByPath"
                    @delete-multiple-files="removeMultipleFiles"
                />
            </div> -->
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import AppController from '@/api/AppController';
// import FileUploader from '@/views/components/app/forms/FileUploader.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    components: { /* FileUploader, */ PrimaryButton, AlertDialog },
    emits: ['saved', 'saved-error', 'close-request'],
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        projectId: {
            type: [String, Number],
            required: false,
            default: null
        }
    },
    data() {
        return {
            number: this.editingItem ? this.editingItem.number : '',
            amount: this.editingItem ? this.editingItem.amount : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            date: this.editingItem && this.editingItem.date
                ? new Date(this.editingItem.date).toISOString().substring(0, 16)
                : new Date().toISOString().substring(0, 16),
            returned: this.editingItem ? this.editingItem.returned : false,
            note: this.editingItem ? this.editingItem.note : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            currencies: [],
            saveLoading: false,
            // uploading: false,
            // uploadProgress: 0,
            // files: []
        };
    },
    // computed: {
    //     formattedFiles() {
    //         if (!Array.isArray(this.form.files)) {
    //             return [];
    //         }
    //         return this.form.files.map((file, index) => {
    //             if (typeof file === 'string') {
    //                 return {
    //                     name: file,
    //                     path: file,
    //                     size: 0,
    //                     url: '#',
    //                     icon: 'fas fa-file'
    //                 };
    //             }
    //             return {
    //                 name: file.name,
    //                 path: file.name,
    //                 size: file.size || 0,
    //                 url: URL.createObjectURL(file.file || file),
    //                 icon: this.getFileIcon(file.name)
    //             };
    //         });
    //     }
    // },
    async mounted() {
        await this.fetchCurrencies();
        if (this.editingItem) {
            this.populateForm();
        } else {
            this.clearForm();
        }
        this.saveInitialState();
    },
    methods: {
        clearForm() {
            this.number = '';
            this.amount = '';
            this.currencyId = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.returned = false;
            this.note = '';
            this.editingItemId = null;
        },
        getFormState() {
            return {
                number: this.number,
                amount: this.amount,
                currencyId: this.currencyId,
                date: this.date,
                returned: this.returned,
                note: this.note
            };
        },
        async fetchCurrencies() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadCurrencies');
                const response = this.$store.getters.currencies;
                this.currencies = response;
            } catch (error) {
                console.error('Error fetching currencies:', error);
            }
        },
        populateForm() {
            // Форматируем дату для input type="datetime-local"
            let formattedDate = new Date().toISOString().substring(0, 16);
            if (this.editingItem.date) {
                const date = new Date(this.editingItem.date);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString().substring(0, 16);
                }
            }
            
            this.number = this.editingItem.number || '';
            this.amount = this.editingItem.amount || '';
            this.currencyId = this.editingItem.currencyId || '';
            this.date = formattedDate;
            this.returned = this.editingItem.returned || false;
            this.note = this.editingItem.note || '';
            this.editingItemId = this.editingItem.id || null;
            // this.files = this.editingItem.files || [];
        },
        async save() {
            if (!this.projectId && !this.editingItem) {
                this.$notify?.({ type: 'error', text: 'Ошибка: не указан ID проекта' });
                return;
            }
            
            this.saveLoading = true;
            try {
                const formData = {
                    number: this.number,
                    amount: this.amount,
                    currencyId: this.currencyId,
                    date: this.date,
                    returned: this.returned,
                    note: this.note
                };
                
                // Получаем информацию о валюте
                const selectedCurrency = this.currencies.find(c => c.id == formData.currencyId);
                if (selectedCurrency) {
                    formData.currencyName = selectedCurrency.name;
                    formData.currencyCode = selectedCurrency.code;
                    formData.currencySymbol = selectedCurrency.symbol;
                }

                let response;
                if (this.editingItem) {
                    response = await ProjectContractController.updateItem(this.editingItem.id, formData);
                } else {
                    response = await ProjectContractController.createItem(this.projectId, formData);
                }

                if (response.success) {
                    this.$emit('saved', response.item);
                    this.$notify?.({ type: 'success', text: response.message });
                    this.resetFormChanges();
                } else {
                    this.$emit('saved-error', response.error);
                    this.$notify?.({ type: 'error', text: response.error });
                }
            } catch (error) {
                console.error('Error saving contract:', error);
                this.$emit('saved-error', error);
                this.$notify?.({ type: 'error', text: 'Ошибка при сохранении контракта' });
            } finally {
                this.saveLoading = false;
            }
        },
        // handleFileUpload(files) {
        //     if (!files || !files.length) return;
            
        //     this.uploading = true;
        //     this.uploadProgress = 0;
            
        //     // Симуляция прогресса загрузки
        //     const progressInterval = setInterval(() => {
        //         if (this.uploadProgress < 90) {
        //             this.uploadProgress += Math.random() * 10;
        //         }
        //     }, 200);
            
        //     setTimeout(() => {
        //         clearInterval(progressInterval);
        //         this.uploadProgress = 100;
                
        //         // Добавляем файлы в форму
        //         const newFiles = files.map(file => ({
        //             name: file.name,
        //             file: file
        //         }));
        //         this.form.files = [...this.form.files, ...newFiles];
                
        //         setTimeout(() => {
        //             this.uploading = false;
        //             this.uploadProgress = 0;
        //         }, 500);
        //     }, 1000);
        // },
        // removeFileByPath(filePath) {
        //     const index = this.form.files.findIndex(file => 
        //         (typeof file === 'string' ? file : file.name) === filePath
        //     );
        //     if (index !== -1) {
        //         this.form.files.splice(index, 1);
        //     }
        // },
        // removeMultipleFiles(filePaths) {
        //     this.form.files = this.form.files.filter(file => 
        //         !filePaths.includes(typeof file === 'string' ? file : file.name)
        //     );
        // },
        // getFileIcon(filename) {
        //     if (!filename) return 'fas fa-file';
        //     const ext = filename.split('.').pop().toLowerCase();
        //     const iconMap = {
        //         'pdf': 'fas fa-file-pdf',
        //         'doc': 'fas fa-file-word',
        //         'docx': 'fas fa-file-word',
        //         'jpg': 'fas fa-file-image',
        //         'jpeg': 'fas fa-file-image',
        //         'png': 'fas fa-file-image',
        //         'gif': 'fas fa-file-image'
        //     };
        //     return iconMap[ext] || 'fas fa-file';
        // },
        handleCloseRequest() {
            this.$emit('close-request');
        }
    },
    watch: {
        editingItem: {
            handler(newValue) {
                if (newValue) {
                    this.populateForm();
                } else {
                    this.clearForm();
                }
            },
            immediate: false
        }
    }
};
</script>
