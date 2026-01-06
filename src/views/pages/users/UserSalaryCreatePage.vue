<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItemId ? ($t('editSalary') || 'Редактировать зарплату') : ($t('addSalary') || 'Добавить зарплату') }}
        </h2>
        
        <div class="space-y-4 flex-1">
            <div>
                <label class="required">{{ $t('startDate') || 'Дата начала' }}</label>
                <input 
                    type="date" 
                    v-model="form.start_date"
                    required />
            </div>

            <div>
                <label>{{ $t('endDate') || 'Дата окончания' }}</label>
                <input 
                    type="date" 
                    v-model="form.end_date" />
            </div>

            <div>
                <label class="required">{{ $t('amount') || 'Сумма' }}</label>
                <input 
                    type="number" 
                    v-model.number="form.amount"
                    step="0.01"
                    min="0"
                    required />
            </div>

            <div>
                <label class="required">{{ $t('currency') || 'Валюта' }}</label>
                <select 
                    v-model.number="form.currency_id"
                    required>
                    <option :value="null">{{ $t('selectCurrency') || 'Выберите валюту' }}</option>
                    <option 
                        v-for="currency in currencies" 
                        :key="currency.id" 
                        :value="currency.id">
                        {{ translateCurrency(currency.name, $t) }} ({{ currency.symbol || '' }})
                    </option>
                </select>
            </div>

            <div>
                <label class="required">{{ $t('salaryPaymentType') || 'Тип оплаты' }}</label>
                <select 
                    v-model="form.payment_type"
                    required>
                    <option :value="false">{{ $t('salaryPaymentTypeNonCash') || 'Безналичный' }}</option>
                    <option :value="true">{{ $t('salaryPaymentTypeCash') || 'Наличный' }}</option>
                </select>
            </div>

            <div>
                <label>{{ $t('note') || 'Примечание' }}</label>
                <textarea 
                    v-model="form.note"
                    rows="3"
                    class="w-full"></textarea>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton 
            v-if="editingItemId != null" 
            :onclick="showDeleteDialog" 
            :is-danger="true"
            :is-loading="deleteLoading" 
            icon="fas fa-trash"
            :disabled="!canDelete">
        </PrimaryButton>
        <PrimaryButton 
            icon="fas fa-save" 
            :onclick="save" 
            :is-loading="saveLoading"
            :disabled="!canSave || saveLoading">
        </PrimaryButton>
    </div>
    <AlertDialog 
        :dialog="deleteDialog" 
            @confirm="deleteItem"
        @leave="closeDeleteDialog"
        :descr="$t('confirmDelete') || 'Вы уверены, что хотите удалить эту зарплату?'"
        :confirm-text="$t('delete') || 'Удалить'"
        :leave-text="$t('cancel') || 'Отмена'" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import formChangesMixin from '@/mixins/formChangesMixin';
import { translateCurrency } from '@/utils/translationUtils';

export default {
    mixins: [notificationMixin, getApiErrorMessage, crudFormMixin, formChangesMixin],
    components: {
        PrimaryButton,
        AlertDialog,
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        userId: {
            type: [Number, String],
            required: true
        },
        usersController: {
            type: Object,
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            form: {
                start_date: '',
                end_date: '',
                amount: 0,
                currency_id: null,
                payment_type: false,
                note: '',
            },
            currencies: [],
        };
    },
    computed: {
        controller() {
            return this.usersController || UsersController;
        },
        canSave() {
            const hasFormData = this.form.start_date && this.form.amount && this.form.currency_id && typeof this.form.payment_type === 'boolean';
            if (this.editingItemId) {
                return hasFormData && (
                    this.$store.getters.hasPermission('employee_salaries_update_all') ||
                    this.$store.getters.hasPermission('employee_salaries_update_own')
                );
            }
            return hasFormData && this.$store.getters.hasPermission('employee_salaries_create');
        },
        canDelete() {
            return this.editingItemId != null && (
                this.$store.getters.hasPermission('employee_salaries_delete_all') ||
                this.$store.getters.hasPermission('employee_salaries_delete_own')
            );
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchCurrencies();
            if (this.saveInitialState) {
                this.saveInitialState();
            }
        });
    },
    methods: {
        translateCurrency,
        async fetchCurrencies() {
            try {
                if (this.$store.getters.currencies && this.$store.getters.currencies.length > 0) {
                    this.currencies = this.$store.getters.currencies;
                } else {
                    await this.$store.dispatch('loadCurrencies');
                    this.currencies = this.$store.getters.currencies || [];
                }
                
                if (!this.editingItemId && !this.form.currency_id && this.currencies.length > 0) {
                    const defaultCurrency = this.currencies.find(c => c.isDefault);
                    if (defaultCurrency) {
                        this.form.currency_id = defaultCurrency.id;
                    }
                }
            } catch (error) {
                console.error('Error fetching currencies:', error);
                this.currencies = [];
            }
        },
        clearForm() {
            const defaultCurrency = this.currencies.find(c => c.isDefault);
            this.form = {
                start_date: '',
                end_date: '',
                amount: 0,
                currency_id: defaultCurrency ? defaultCurrency.id : null,
                payment_type: false,
                note: '',
            };
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        prepareSave() {
            if (!this.canSave) {
                throw new Error(this.$t('fillRequiredFields') || 'Заполните все обязательные поля');
            }
            const payload = { ...this.form };
            if (payload.end_date === '') {
                payload.end_date = null;
            }
            return payload;
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await this.controller.updateSalary(
                    this.userId,
                    this.editingItemId,
                    data
                );
            } else {
                return await this.controller.createSalary(this.userId, data);
            }
        },
        async performDelete() {
            return await this.controller.deleteSalary(this.userId, this.editingItemId);
        },
        onSaveSuccess(response) {
            this.showNotification(
                this.$t('success') || 'Успешно',
                this.$t('salarySaved') || 'Зарплата сохранена',
                false
            );
            this.clearForm();
        },
        onDeleteSuccess() {
            this.showNotification(
                this.$t('success') || 'Успешно',
                this.$t('salaryDeleted') || 'Зарплата удалена',
                false
            );
            this.clearForm();
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.form.start_date = newEditingItem.start_date ? new Date(newEditingItem.start_date).toISOString().split('T')[0] : '';
                this.form.end_date = newEditingItem.end_date ? new Date(newEditingItem.end_date).toISOString().split('T')[0] : '';
                this.form.amount = newEditingItem.amount || 0;
                this.form.currency_id = newEditingItem.currency_id || null;
                this.form.payment_type = newEditingItem.payment_type !== undefined ? Boolean(newEditingItem.payment_type) : false;
                this.form.note = newEditingItem.note || '';
            }
        },
    }
};
</script>

