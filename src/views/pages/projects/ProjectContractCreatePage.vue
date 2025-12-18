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
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')"
            :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteContract')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import notificationMixin from "@/mixins/notificationMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin, notificationMixin],
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
            deleteDialog: false,
            deleteLoading: false,

        };
    },
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
        },
        async save() {
            if (!this.projectId && !this.editingItem) {
                this.showNotification('Ошибка', 'Не указан ID проекта', true);
                return;
            }

            this.saveLoading = true;
            try {
                const formData = {
                    projectId: this.editingItem ? this.editingItem.projectId : this.projectId,
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
                    formData.currencySymbol = selectedCurrency.symbol;
                }

                let response;
                if (this.editingItem) {
                    response = await ProjectContractController.updateItem(this.editingItem.id, formData);
                } else {
                    response = await ProjectContractController.storeItem(this.projectId, formData);
                }

                this.$emit('saved', response.item);
                this.showNotification('Успех', response.message || 'Контракт успешно сохранен', false);
                if (!this.editingItem) {
                    this.clearForm();
                }
                this.resetFormChanges();
            } catch (error) {
                console.error('Error saving contract:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении контракта';
                this.$emit('saved-error', errorMessage);
                this.showNotification('Ошибка', errorMessage, true);
            } finally {
                this.saveLoading = false;
            }
        },

        showDeleteDialog() {
            this.deleteDialog = true;
        },

        closeDeleteDialog() {
            this.deleteDialog = false;
        },

        async deleteItem() {
            if (!this.editingItemId) return;

            this.deleteLoading = true;
            try {
                const response = await ProjectContractController.deleteItem(this.editingItemId);

                this.showNotification('Успех', response.message || 'Контракт успешно удален', false);
                this.$emit('saved'); // Используем тот же эмит, что и при сохранении, чтобы обновить список
                this.closeDeleteDialog();
                this.clearForm();
            } catch (error) {
                console.error('Error deleting contract:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении контракта';
                this.showNotification('Ошибка', errorMessage, true);
            } finally {
                this.deleteLoading = false;
            }
        },

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
