<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div class="space-y-4">
      <div>
        <label class="required">{{ $t('startDate') }}</label>
        <input 
          v-model="form.startDate" 
          type="date"
          required
        >
      </div>

      <div>
        <label>{{ $t('endDate') }}</label>
        <input 
          v-model="form.endDate" 
          type="date"
        >
      </div>

      <div>
        <label class="required">{{ $t('amount') }}</label>
        <input 
          v-model.number="form.amount" 
          type="number"
          step="0.01"
          min="0"
          required
        >
      </div>

      <div>
        <label class="required">{{ $t('currency') }}</label>
        <select 
          v-model.number="form.currencyId"
          required
        >
          <option :value="null">
            {{ $t('selectCurrency') }}
          </option>
          <option 
            v-for="currency in currencies" 
            :key="currency.id" 
            :value="currency.id"
          >
            {{ translateCurrency(currency.name, $t) }} ({{ currency.symbol  }})
          </option>
        </select>
      </div>

      <div>
        <label class="required">{{ $t('salaryPaymentType') }}</label>
        <select 
          v-model="form.paymentType"
          required
        >
          <option :value="false">
            {{ $t('salaryPaymentTypeNonCash') }}
          </option>
          <option :value="true">
            {{ $t('salaryPaymentTypeCash') }}
          </option>
        </select>
      </div>

      <div>
        <label>{{ $t('note') }}</label>
        <textarea 
          v-model="form.note"
          rows="3"
          class="w-full"
        />
      </div>
    </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItemId != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!canDelete"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!canSave || saveLoading"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog 
    :dialog="deleteDialog" 
    :descr="$t('confirmDelete')"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />
  <AlertDialog 
    :dialog="overlapDialog" 
    :descr="overlapDialogDescr"
    :confirm-text="$t('create')"
    :leave-text="$t('cancel')"
    :confirm-loading="saveLoading"
    @confirm="confirmOverlapAndSave"
    @leave="closeOverlapDialog"
  />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { translateCurrency } from '@/utils/translationUtils';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
    },
    mixins: [notificationMixin, getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
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
                startDate: '',
                endDate: '',
                amount: 0,
                currencyId: null,
                paymentType: false,
                note: '',
            },
            currencies: [],
            overlapDialog: false,
            pendingSaveData: null,
        };
    },
    computed: {
        overlapDialogDescr() {
            return this.$t('salaryOverlapConfirm');
        },
        controller() {
            return this.usersController || UsersController;
        },
        canSave() {
            const hasFormData = this.form.startDate && this.form.amount && this.form.currencyId && [true, false].includes(this.form.paymentType);
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
                
                if (!this.editingItemId && !this.form.currencyId && this.currencies.length > 0) {
                    const defaultCurrency = this.currencies.find(c => c.isDefault);
                    if (defaultCurrency) {
                        this.form.currencyId = defaultCurrency.id;
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
                startDate: '',
                endDate: '',
                amount: 0,
                currencyId: defaultCurrency ? defaultCurrency.id : null,
                paymentType: false,
                note: '',
            };
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        prepareSave() {
            if (!this.canSave) {
                throw new Error(this.$t('fillRequiredFields'));
            }
            return {
                startDate: this.form.startDate,
                endDate: this.form.endDate === '' ? null : this.form.endDate,
                amount: this.form.amount,
                currencyId: this.form.currencyId,
                paymentType: this.form.paymentType,
                note: this.form.note,
            };
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
        async save() {
            if (this.saveLoading) return;
            this.saveLoading = true;
            let payload = null;
            try {
                payload = this.prepareSave();
                const response = await this.performSave(payload);
                this.$emit('saved', response);
                this.onSaveSuccess(response);
            } catch (error) {
                const data = error?.response?.data || {};
                const message = data?.error || data?.message || String(data );
                const isOverlap = !this.editingItemId
                    && error?.response?.status === 422
                    && (message.includes('активная зарплата') || message.includes('пересекается по датам'));
                if (isOverlap && payload) {
                    this.pendingSaveData = payload;
                    this.overlapDialog = true;
                } else {
                    const errorMessages = this.getApiErrorMessage ? this.getApiErrorMessage(error) : [error?.message || 'Ошибка'];
                    this.showNotification(errorMessages.join('. '), '', true);
                    this.emitSavedError(errorMessages);
                    this.onSaveError(error);
                }
            } finally {
                this.saveLoading = false;
            }
        },
        closeOverlapDialog() {
            this.overlapDialog = false;
            this.pendingSaveData = null;
        },
        async confirmOverlapAndSave() {
            if (!this.pendingSaveData) {
                this.closeOverlapDialog();
                return;
            }
            this.saveLoading = true;
            try {
                const data = { ...this.pendingSaveData, isClose: true };
                const response = await this.controller.createSalary(this.userId, data);
                this.closeOverlapDialog();
                this.$emit('saved', response);
                this.onSaveSuccess(response);
            } catch (error) {
                this.emitSavedError(error);
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async performDelete() {
            return await this.controller.deleteSalary(this.userId, this.editingItemId);
        },
        onSaveSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('salarySaved'),
                false
            );
            this.clearForm();
        },
        onDeleteSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('salaryDeleted'),
                false
            );
            this.clearForm();
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.form.startDate = newEditingItem.startDate ? new Date(newEditingItem.startDate).toISOString().split('T')[0] : '';
                this.form.endDate = newEditingItem.endDate ? new Date(newEditingItem.endDate).toISOString().split('T')[0] : '';
                this.form.amount = newEditingItem.amount || 0;
                this.form.currencyId = newEditingItem.currencyId || null;
                this.form.paymentType = Number(newEditingItem.paymentType) === 1;
                this.form.note = newEditingItem.note ;
            }
        },
    }
};
</script>

