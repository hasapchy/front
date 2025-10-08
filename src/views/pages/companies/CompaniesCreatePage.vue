<template>
    <div class="flex flex-col h-full">
        <div class="flex-1 overflow-auto p-4">
            <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCompany') : $t('addCompany') }}</h2>
            
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

        <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
            <PrimaryButton v-if="editingItem != null" :onclick="deleteItem" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
            </PrimaryButton>
        </div>

    <AlertDialog :dialog="deleteDialog" @confirm="confirmDelete" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import CompaniesController from '@/api/CompaniesController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    components: { PrimaryButton, AlertDialog, NotificationToast },
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
            },
            editingItemId: null,
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            currentLogo: '',
            selected_logo: null,
        };
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
        getFormState() {
            return {
                name: this.form.name,
                logo: this.form.logo,
            };
        },
        clearForm() {
            this.form.name = '';
            this.form.logo = null;
            this.editingItemId = null;
            this.currentLogo = '';
            this.selected_logo = null;
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
                };

                if (this.editingItem) {
                    await CompaniesController.updateItem(
                        this.editingItemId,
                        item,
                        this.$refs.logoInput?.files[0]
                    );
                } else {
                    await CompaniesController.storeItem(item, this.$refs.logoInput?.files[0]);
                }

                this.$emit('saved');
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
                this.selected_logo = URL.createObjectURL(file);
                this.form.logo = file;
            }
        },
        
        getCompanyLogoSrc(item) {
            if (!item) return '';
            if (item.logo)
                return import.meta.env.VITE_APP_BASE_URL + '/storage/' + item.logo;
            return '';
        },
        
        loadCompanyData(company) {
            this.form.name = company.name || '';
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
