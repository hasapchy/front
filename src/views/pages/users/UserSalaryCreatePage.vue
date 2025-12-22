<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItem ? ($t('editSalary') || 'Редактировать зарплату') : ($t('addSalary') || 'Добавить зарплату') }}
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
            v-if="editingItem != null" 
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
        @confirm="remove" 
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
import { translateCurrency } from '@/utils/translationUtils';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
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
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            form: {
                start_date: '',
                end_date: '',
                amount: 0,
                currency_id: null,
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
            const hasFormData = this.form.start_date && this.form.amount && this.form.currency_id;
            if (this.editingItem) {
                return hasFormData && (
                    this.$store.getters.hasPermission('employee_salaries_update_all') ||
                    this.$store.getters.hasPermission('employee_salaries_update_own')
                );
            }
            return hasFormData && this.$store.getters.hasPermission('employee_salaries_create');
        },
        canDelete() {
            return this.editingItem != null && (
                this.$store.getters.hasPermission('employee_salaries_delete_all') ||
                this.$store.getters.hasPermission('employee_salaries_delete_own')
            );
        }
    },
    watch: {
        editingItem: {
            handler(newItem) {
                if (newItem) {
                    this.form.start_date = newItem.start_date ? new Date(newItem.start_date).toISOString().split('T')[0] : '';
                    this.form.end_date = newItem.end_date ? new Date(newItem.end_date).toISOString().split('T')[0] : '';
                    this.form.amount = newItem.amount || 0;
                    this.form.currency_id = newItem.currency_id || null;
                    this.form.note = newItem.note || '';
                } else {
                    this.clearForm();
                }
            },
            immediate: true,
            deep: true
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchCurrencies();
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
                
                if (!this.editingItem && !this.form.currency_id && this.currencies.length > 0) {
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
                note: '',
            };
        },
        async save() {
            if (!this.canSave) {
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.$t('fillRequiredFields') || 'Заполните все обязательные поля',
                    true
                );
                return;
            }

            this.saveLoading = true;
            try {
                const payload = { ...this.form };
                if (payload.end_date === '') {
                    payload.end_date = null;
                }

                if (this.editingItem) {
                    await this.controller.updateSalary(
                        this.userId,
                        this.editingItem.id,
                        payload
                    );
                    this.showNotification(
                        this.$t('success') || 'Успешно',
                        this.$t('salarySaved') || 'Зарплата сохранена',
                        false
                    );
                } else {
                    await this.controller.createSalary(this.userId, payload);
                    this.showNotification(
                        this.$t('success') || 'Успешно',
                        this.$t('salarySaved') || 'Зарплата сохранена',
                        false
                    );
                }
                
                this.$emit('saved');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    typeof errorMessage === 'string' ? errorMessage : errorMessage.join(', '),
                    true
                );
                this.$emit('saved-error', error);
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
        async remove() {
            if (!this.editingItem) return;

            this.deleteLoading = true;
            try {
                await this.controller.deleteSalary(this.userId, this.editingItem.id);
                this.showNotification(
                    this.$t('success') || 'Успешно',
                    this.$t('salaryDeleted') || 'Зарплата удалена',
                    false
                );
                this.closeDeleteDialog();
                this.$emit('deleted');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    typeof errorMessage === 'string' ? errorMessage : errorMessage.join(', '),
                    true
                );
                this.$emit('deleted-error', error);
            } finally {
                this.deleteLoading = false;
            }
        },
    }
};
</script>

