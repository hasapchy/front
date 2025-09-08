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
        </div>

        <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
            <PrimaryButton v-if="editingItem != null" :onclick="deleteItem" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-remove">
                {{ $t('delete') }}
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
                {{ $t('save') }}
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
            },
            editingItemId: null,
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
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
            };
        },
        clearForm() {
            this.form.name = '';
            this.editingItemId = null;
            this.resetFormChanges();
            this.$nextTick(() => {
                this.saveInitialState();
            });
        },
        async save() {
            this.saveLoading = true;
            try {
                const updateData = {
                    name: this.form.name,
                };

                if (this.editingItem) {
                    await CompaniesController.updateItem(this.editingItemId, updateData);
                } else {
                    await CompaniesController.storeItem(updateData);
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
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.form.name = newEditingItem.name || '';
                    this.editingItemId = newEditingItem.id || null;
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
