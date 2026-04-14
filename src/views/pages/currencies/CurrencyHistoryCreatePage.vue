<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <p
        v-if="!showFormBody"
        class="text-sm text-gray-600 p-4"
      >
        {{ $t('noCurrency') }}
      </p>
      <div v-else>
        <div
          v-if="!editingItem"
          class="mb-4"
        >
          <label class="required">{{ $t('currency') }}</label>
          <select
            v-model="formCurrencyId"
            class="w-full"
            required
          >
            <option value="">
              {{ $t('selectCurrency') }}
            </option>
            <option
              v-for="c in currencies"
              :key="c.id"
              :value="c.id"
            >
              {{ c.symbol }} - {{ translateCurrency(c.name, $t) }} ({{ c.current_rate }})
            </option>
          </select>
        </div>

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
            (editingItemId == null && !$store.getters.hasPermission('currency_history_create') && !$store.getters.hasPermission('currency_history_update'))"
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
import { translateCurrency } from '@/utils/translationUtils';

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        formActive: { type: Boolean, default: false },
        editingItem: { type: Object, default: null },
        currency: { type: Object, default: null },
        currencies: { type: Array, default: () => [] },
        defaultCurrencyId: { type: [String, Number], default: '' },
    },
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    data() {
        return {
            formCurrencyId: '',
            exchangeRate: this.editingItem ? this.editingItem.exchangeRate : '',
            startDate: this.editingItem ? (this.editingItem.startDate ? this.editingItem.startDate.split('T')[0] : '') : getCurrentServerDate(),
            endDate: this.editingItem ? (this.editingItem.endDate ? this.editingItem.endDate.split('T')[0] : '') : '',
            isCurrent: this.editingItem ? !this.editingItem.endDate : true,
        };
    },
    computed: {
        showFormBody() {
            return this.editingItem != null || (this.currencies && this.currencies.length > 0);
        },
        historyCurrencyId() {
            if (this.editingItemId) {
                return this.editingItem?.currencyId ?? this.currency?.id ?? null;
            }
            const id = this.formCurrencyId;
            if (id === '' || id === null || id === undefined) {
                return null;
            }
            return id;
        },
        exchangeRateInputStep() {
            return getStepForDecimals(EXCHANGE_RATE_DECIMAL_PLACES);
        },
        exchangeRateInputMin() {
            return EXCHANGE_RATE_INPUT_MIN;
        },
        isFormValid() {
            const rate = Number(this.exchangeRate);
            if (!this.exchangeRate || !this.startDate || !(rate > 0)) {
                return false;
            }
            if (this.editingItemId) {
                return !!this.historyCurrencyId;
            }
            return this.formCurrencyId !== '' && this.formCurrencyId != null;
        },
        maxDate() {
            return getCurrentServerDate();
        },
    },
    watch: {
        formActive(val) {
            if (val && !this.editingItem) {
                this.formCurrencyId = this.resolveDefaultCurrencyIdForForm();
                this.$nextTick(() => {
                    if (this.resetFormChanges) {
                        this.resetFormChanges();
                    }
                });
            }
        },
        currencies: {
            handler(list) {
                if (!this.formActive || this.editingItem || !list?.length) {
                    return;
                }
                if (this.formCurrencyId === '' || this.formCurrencyId == null) {
                    this.formCurrencyId = this.resolveDefaultCurrencyIdForForm();
                }
            },
            deep: true,
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        translateCurrency,
        resolveDefaultCurrencyIdForForm() {
            const d = this.defaultCurrencyId;
            if (d !== '' && d != null) {
                const has = this.currencies.some((c) => c.id == d);
                if (has) {
                    const match = this.currencies.find((c) => c.id == d);
                    return match ? match.id : '';
                }
            }
            return this.currencies[0]?.id ?? '';
        },
        getFormState() {
            const base = {
                exchangeRate: this.exchangeRate,
                startDate: this.startDate,
                endDate: this.endDate,
                isCurrent: this.isCurrent,
            };
            if (!this.editingItemId) {
                return { ...base, formCurrencyId: this.formCurrencyId };
            }
            return base;
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
            const currencyId = this.historyCurrencyId;
            if (!currencyId) {
                throw new Error('Currency is required');
            }
            if (this.editingItemId) {
                return await CurrencyHistoryController.updateItem(
                    currencyId,
                    this.editingItemId,
                    data
                );
            }
            return await CurrencyHistoryController.storeItem(
                currencyId,
                data
            );
        },
        async performDelete() {
            const currencyId = this.historyCurrencyId;
            if (!currencyId) {
                throw new Error('Currency is required');
            }
            const resp = await CurrencyHistoryController.deleteItem(
                currencyId,
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
            this.formCurrencyId = this.resolveDefaultCurrencyIdForForm();
            this.exchangeRate = '';
            this.startDate = getCurrentServerDate();
            this.endDate = '';
            this.isCurrent = true;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.exchangeRate = newEditingItem.exchangeRate;
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
