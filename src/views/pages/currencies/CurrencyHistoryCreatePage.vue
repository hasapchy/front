<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div v-if="currency">
      <div
        v-if="!editingItem"
        class="mb-4 p-3 bg-blue-50 rounded-lg"
      >
        <p class="text-sm text-blue-700">
          <i class="fas fa-info-circle mr-1" />
          {{ $t('newRateWillClosePrevious') }}
        </p>
      </div>

      <div>
        <label class="required">{{ $t('exchangeRate') }}</label>
        <input
          v-model="exchangeRate"
          type="number"
          :step="exchangeRateInputStep"
          :min="exchangeRateInputMin"
          required
          :placeholder="$t('enterExchangeRate')"
        >
        <small class="text-gray-500">{{ $t('exchangeRateHelp') }}</small>
      </div>

      <div>
        <label class="required">{{ $t('startDate') }}</label>
        <input
          v-model="startDate"
          type="date"
          required
          :max="endDate || maxDate"
        >
      </div>

      <div>
        <label>{{ $t('endDate') }}</label>
        <input
          v-model="endDate"
          type="date"
          :min="startDate"
        >
        <small class="text-gray-500">{{ $t('endDateHelp') }}</small>
      </div>

      <div class="flex items-center">
        <input
          id="isCurrent"
          v-model="isCurrent"
          type="checkbox"
          class="mr-2"
          @change="onCurrentChange"
        >
        <label
          for="isCurrent"
          class="text-sm"
        >{{ $t('setAsCurrentRate') }}</label>
      </div>

      <div
        v-if="!isCurrent && endDate"
        class="p-3 bg-yellow-50 rounded-lg"
      >
        <p class="text-sm text-yellow-700">
          {{ $t('endDateWarning') }}
        </p>
      </div>
    </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('currency_history_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!isFormValid || (editingItemId != null && !$store.getters.hasPermission('currency_history_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('currency_history_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>

  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('confirmDeleteExchangeRate')"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />

  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
</template>

<script>
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { getCurrentServerDate } from '@/utils/dateUtils';
import { EXCHANGE_RATE_DECIMAL_PLACES, EXCHANGE_RATE_INPUT_MIN } from '@/constants/exchangeRateDecimals';
import { getStepForDecimals } from '@/utils/numberUtils';

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, default: null },
        currency: { type: Object, default: null }
    },
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    data() {
        return {
            exchangeRate: this.editingItem ? this.editingItem.exchangeRate : '',
            startDate: this.editingItem ? (this.editingItem.startDate ? this.editingItem.startDate.split('T')[0] : '') : getCurrentServerDate(),
            endDate: this.editingItem ? (this.editingItem.endDate ? this.editingItem.endDate.split('T')[0] : '') : '',
            isCurrent: this.editingItem ? !this.editingItem.endDate : true,
        }
    },
    computed: {
        exchangeRateInputStep() {
            return getStepForDecimals(EXCHANGE_RATE_DECIMAL_PLACES);
        },
        exchangeRateInputMin() {
            return EXCHANGE_RATE_INPUT_MIN;
        },
        isFormValid() {
            return this.currency && this.exchangeRate && this.startDate && this.exchangeRate > 0;
        },
        maxDate() {
            return getCurrentServerDate();
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                exchangeRate: this.exchangeRate,
                startDate: this.startDate,
                endDate: this.endDate,
                isCurrent: this.isCurrent,
            };
        },

        onCurrentChange() {
            if (this.isCurrent) {
                this.endDate = '';
            }
        },

        prepareSave() {
            return {
                exchangeRate: parseFloat(this.exchangeRate),
                startDate: this.startDate,
                endDate: this.isCurrent ? null : this.endDate
            };
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await CurrencyHistoryController.updateItem(
                    this.currency.id,
                    this.editingItemId,
                    data
                );
            } else {
                return await CurrencyHistoryController.storeItem(
                    this.currency.id,
                    data
                );
            }
        },
        async performDelete() {
            const resp = await CurrencyHistoryController.deleteItem(
                this.currency.id,
                this.editingItemId
            );
            if (!resp.message) {
                throw new Error('Failed to delete currency history');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.$emit("saved", response.history || response);
                this.clearForm();
            }
        },
        clearForm() {
            this.exchangeRate = '';
            this.startDate = getCurrentServerDate();
            this.endDate = '';
            this.isCurrent = true;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.exchangeRate = newEditingItem.exchangeRate ;
            this.startDate = newEditingItem.startDate ? newEditingItem.startDate.split('T')[0] : getCurrentServerDate();
            this.endDate = newEditingItem.endDate ? newEditingItem.endDate.split('T')[0] : '';
            this.isCurrent = !newEditingItem.endDate;
        },

        handleCloseRequest() {
            if (this.checkForChanges()) {
                this.closeConfirmDialog = true;
            } else {
                this.closeModal();
            }
        },

        confirmClose() {
            this.closeConfirmDialog = false;
            this.closeModal();
        },

        cancelClose() {
            this.closeConfirmDialog = false;
        },

        closeModal() {
            this.$emit('close-request');
        }
    },
}
</script>
