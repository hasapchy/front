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
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import { translateCurrency } from '@/utils/translationUtils';
import { roundValue } from '@/utils/numberUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, notificationMixin, crudFormMixin, dateFormMixin],
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
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            currencies: [],
        };
    },
    async mounted() {
        await this.fetchCurrencies();
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        translateCurrency,
        clearForm() {
            this.type = 'income';
            this.amount = '';
            this.currencyId = '';
            this.note = '';
            this.date = this.getCurrentLocalDateTime();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                let formattedDate = this.getCurrentLocalDateTime();
                if (newEditingItem.date) {
                    formattedDate = this.getFormattedDate(newEditingItem.date);
                }

                this.type = newEditingItem.type ? 'income' : 'outcome';
                this.amount = newEditingItem.amount || '';
                this.currencyId = newEditingItem.currencyId || '';
                this.date = formattedDate;
                this.note = newEditingItem.note || '';
            }
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
                if (!this.currencyId && this.currencies?.length) {
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
        prepareSave() {
            if (!this.projectId) {
                throw new Error('Не указан ID проекта');
            }

            const roundedAmount = roundValue(this.amount);
            const typeValue = this.type == "income" ? 1 : 0;

            return {
                type: typeValue,
                amount: roundedAmount,
                currencyId: this.currencyId,
                note: this.note,
                date: this.date,
                userId: this.$store.getters.currentUser?.id || null,
            };
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await ProjectTransactionController.updateItem(this.editingItemId, data);
            } else {
                return await ProjectTransactionController.storeItem(this.projectId, data);
            }
        },
        onSaveSuccess(response) {
            this.$emit('saved', response.item);
            this.showNotification('Успех', response.message || 'Транзакция успешно сохранена', false);
            if (!this.editingItemId) {
                this.clearForm();
            }
            this.resetFormChanges();
        },
        onSaveError(error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при сохранении транзакции';
            this.showNotification('Ошибка', errorMessage, true);
        },
        async performDelete() {
            return await ProjectTransactionController.deleteItem(this.editingItemId);
        },
        onDeleteSuccess(response) {
            this.showNotification('Успех', response.message || 'Транзакция успешно удалена', false);
            this.$emit('deleted');
            this.clearForm();
        },
        onDeleteError(error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при удалении транзакции';
            this.showNotification('Ошибка', errorMessage, true);
        },
    }
};
</script>

