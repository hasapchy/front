<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItem ? $t('editExchangeRate') : $t('addExchangeRate') }}
        </h2>

        <div v-if="currency" class="mb-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
                <strong>{{ $t('currency') }}:</strong> {{ currency.symbol }} - {{ translateCurrency(currency.name, $t)
                }}
            </p>
            <p class="text-sm text-blue-700">
                <strong>{{ $t('currentRate') }}:</strong> {{ currency.current_rate }}
            </p>
        </div>
        <div v-else class="mb-4 p-3 bg-yellow-50 rounded-lg">
            <p class="text-sm text-yellow-700">
                {{ $t('selectCurrencyFirst') }}
            </p>
        </div>

        <div v-if="currency">
            <div v-if="!editingItem" class="mb-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-700">
                    <i class="fas fa-info-circle mr-1"></i>
                    {{ $t('newRateWillClosePrevious') }}
                </p>
            </div>

            <div>
                <label class="required">{{ $t('exchangeRate') }}</label>
                <input type="number" v-model="exchangeRate" step="0.000001" min="0.000001" required
                    :placeholder="$t('enterExchangeRate')" />
                <small class="text-gray-500">{{ $t('exchangeRateHelp') }}</small>
            </div>

            <div>
                <label class="required">{{ $t('startDate') }}</label>
                <input type="date" v-model="startDate" required
                    :max="endDate || new Date().toISOString().split('T')[0]" />
            </div>

            <div>
                <label>{{ $t('endDate') }}</label>
                <input type="date" v-model="endDate" :min="startDate" />
                <small class="text-gray-500">{{ $t('endDateHelp') }}</small>
            </div>

            <div class="flex items-center">
                <input type="checkbox" id="isCurrent" v-model="isCurrent" @change="onCurrentChange" class="mr-2" />
                <label for="isCurrent" class="text-sm">{{ $t('setAsCurrentRate') }}</label>
            </div>

            <div v-if="!isCurrent && endDate" class="p-3 bg-yellow-50 rounded-lg">
                <p class="text-sm text-yellow-700">
                    {{ $t('endDateWarning') }}
                </p>
            </div>
        </div>
    </div>

    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('currency_history_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!isFormValid || (editingItemId != null && !$store.getters.hasPermission('currency_history_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('currency_history_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDeleteExchangeRate')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />

    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

</template>

<script>
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from '@/mixins/formChangesMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { translateCurrency } from '@/utils/translationUtils';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin, crudFormMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: Object, default: null },
        currency: { type: Object, default: null }
    },
    data() {
        return {
            exchangeRate: this.editingItem ? this.editingItem.exchangeRate : '',
            startDate: this.editingItem ? (this.editingItem.startDate ? this.editingItem.startDate.split('T')[0] : '') : new Date().toISOString().split('T')[0],
            endDate: this.editingItem ? (this.editingItem.endDate ? this.editingItem.endDate.split('T')[0] : '') : '',
            isCurrent: this.editingItem ? !this.editingItem.endDate : true,
        }
    },
    computed: {
        isFormValid() {
            return this.currency && this.exchangeRate && this.startDate && this.exchangeRate > 0;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        translateCurrency,
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
            this.startDate = new Date().toISOString().split('T')[0];
            this.endDate = '';
            this.isCurrent = true;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.exchangeRate = newEditingItem.exchangeRate || '';
            this.startDate = newEditingItem.startDate ? newEditingItem.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
            this.endDate = newEditingItem.endDate ? newEditingItem.endDate.split('T')[0] : '';
            this.isCurrent = !newEditingItem.endDate;
        },

        handleCloseRequest() {
            if (this.hasFormChanges()) {
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
