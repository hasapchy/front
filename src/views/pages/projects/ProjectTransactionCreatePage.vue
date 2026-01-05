<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTransaction') : $t('addProjectTransaction') }}</h2>

        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg relative group">
            <div class="flex items-center gap-2 cursor-help">
                <i class="fas fa-question-circle text-blue-500"></i>
                <span class="text-sm text-blue-700 font-semibold">{{ $t('projectTransactionInfo') }}</span>
            </div>
        </div>

        <div>
            <div class="mt-2">
                <label class="block mb-1 required">{{ $t('type') }}</label>
                <select v-model="type" :disabled="!!editingItemId" required>
                    <option value="">{{ $t('selectType') }}</option>
                    <option value="income">✅ {{ $t('income') }}</option>
                    <option value="outcome">🔺 {{ $t('outcome') }}</option>
                </select>
            </div>
            <div class="mt-2">
                <label class="required">{{ $t('date') }}</label>
                <input type="datetime-local" v-model="date" required>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-full mt-2">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="amount" step="0.01" min="0" required>
                </div>
                <div class="w-full mt-2">
                    <label class="block mb-1 required">{{ $t('currency') }}</label>
                    <select v-model="currencyId" required>
                        <option value="">{{ $t('selectCurrency') }}</option>
                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                            {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="mt-2">
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" :placeholder="$t('enterNote')" rows="3"></textarea>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItemId && $store.getters.hasPermission('transactions_delete')"
            :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteTransaction')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
</template>

<script>
import ProjectTransactionController from '@/api/ProjectTransactionController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { translateCurrency } from '@/utils/translationUtils';
import { roundValue } from '@/utils/numberUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, notificationMixin],
    components: { PrimaryButton, AlertDialog },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        projectId: {
            type: [String, Number],
            required: true
        }
    },
    data() {
        return {
            type: this.editingItem ? (this.editingItem.type ? 'income' : 'outcome') : 'income',
            amount: this.editingItem ? this.editingItem.amount : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            note: this.editingItem ? this.editingItem.note : '',
            date: this.editingItem && this.editingItem.date
                ? new Date(this.editingItem.date).toISOString().substring(0, 16)
                : new Date().toISOString().substring(0, 16),
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
        translateCurrency,
        clearForm() {
            this.type = 'income';
            this.amount = '';
            this.currencyId = '';
            this.note = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.editingItemId = null;
        },
        getFormState() {
            return {
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                note: this.note,
                date: this.date
            };
        },
        async fetchCurrencies() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const response = this.$store.getters.currencies;
                this.currencies = response;
                if (!this.currencyId && this.currencies.length > 0) {
                    const defaultCurrency = this.currencies.find(c => c.isDefault);
                    if (defaultCurrency) {
                        this.currencyId = defaultCurrency.id;
                    } else {
                        this.currencyId = this.currencies[0].id;
                    }
                }
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

            this.type = this.editingItem.type ? 'income' : 'outcome';
            this.amount = this.editingItem.amount || '';
            this.currencyId = this.editingItem.currencyId || '';
            this.date = formattedDate;
            this.note = this.editingItem.note || '';
            this.editingItemId = this.editingItem.id || null;
        },
        async save() {
            if (!this.projectId) {
                this.showNotification('Ошибка', 'Не указан ID проекта', true);
                return;
            }

            this.saveLoading = true;
            try {
                const roundedAmount = roundValue(this.amount);
                const typeValue = this.type == "income" ? 1 : 0;

                const formData = {
                    type: typeValue,
                    amount: roundedAmount,
                    currencyId: this.currencyId,
                    note: this.note,
                    date: this.date,
                    userId: this.$store.getters.currentUser?.id || null,
                };

                let response;
                if (this.editingItemId) {
                    response = await ProjectTransactionController.updateItem(this.editingItemId, formData);
                } else {
                    response = await ProjectTransactionController.storeItem(this.projectId, formData);
                }

                this.$emit('saved', response.item);
                this.showNotification('Успех', response.message || 'Транзакция успешно сохранена', false);
                if (!this.editingItemId) {
                    this.clearForm();
                }
                this.resetFormChanges();
            } catch (error) {
                console.error('Error saving project transaction:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении транзакции';
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
                const response = await ProjectTransactionController.deleteItem(this.editingItemId);

                this.showNotification('Успех', response.message || 'Транзакция успешно удалена', false);
                this.$emit('deleted');
                this.closeDeleteDialog();
                this.clearForm();
            } catch (error) {
                console.error('Error deleting project transaction:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении транзакции';
                this.showNotification('Ошибка', errorMessage, true);
            } finally {
                this.deleteLoading = false;
            }
        },
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

