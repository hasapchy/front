<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItem ? $t('editExchangeRate') : $t('addExchangeRate') }}
        </h2>
        
        <div v-if="currency" class="mb-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
                <strong>{{ $t('currency') }}:</strong> {{ currency.symbol }} - {{ currency.name }}
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
                <input 
                    type="number" 
                    v-model="exchangeRate" 
                    step="0.000001" 
                    min="0.000001" 
                    required
                    :placeholder="$t('enterExchangeRate')"
                />
                <small class="text-gray-500">{{ $t('exchangeRateHelp') }}</small>
            </div>

            <div>
                <label class="required">{{ $t('startDate') }}</label>
                <input 
                    type="date" 
                    v-model="startDate" 
                    required
                    :max="endDate || new Date().toISOString().split('T')[0]"
                />
            </div>

            <div>
                <label>{{ $t('endDate') }}</label>
                <input 
                    type="date" 
                    v-model="endDate" 
                    :min="startDate"
                />
                <small class="text-gray-500">{{ $t('endDateHelp') }}</small>
            </div>

            <div class="flex items-center">
                <input 
                    type="checkbox" 
                    id="isCurrent" 
                    v-model="isCurrent"
                    @change="onCurrentChange"
                    class="mr-2"
                />
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
        <PrimaryButton 
            v-if="editingItem != null" 
            :onclick="showDeleteDialog" 
            :is-danger="true" 
            :is-loading="deleteLoading"
            icon="fas fa-remove" 
            :disabled="!$store.getters.hasPermission('currency_history_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton 
            icon="fas fa-save" 
            :onclick="save" 
            :is-loading="saveLoading"
            :disabled="!isFormValid || (editingItemId != null && !$store.getters.hasPermission('currency_history_update')) ||
                (editingItemId == null && !$store.getters.hasPermission('currency_history_create'))">
            {{ $t('save') }}
        </PrimaryButton>
    </div>
    
    <AlertDialog 
        :dialog="deleteDialog" 
        @confirm="deleteItem" 
        @leave="closeDeleteDialog"
        :descr="$t('confirmDeleteExchangeRate')" 
        :confirm-text="$t('delete')" 
        :leave-text="$t('cancel')" 
    />
    
    <AlertDialog 
        :dialog="closeConfirmDialog" 
        @confirm="confirmClose" 
        @leave="cancelClose"
        :descr="$t('unsavedChanges')" 
        :confirm-text="$t('closeWithoutSaving')" 
        :leave-text="$t('stay')" 
    />
    
    <NotificationToast 
        :title="notificationTitle" 
        :subtitle="notificationSubtitle" 
        :show="notification"
        :is-danger="notificationIsDanger" 
        @close="closeNotification" 
    />
</template>

<script>
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from '@/mixins/formChangesMixin';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: { PrimaryButton, AlertDialog, NotificationToast },
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
            editingItemId: this.editingItem?.id || null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
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
        
        async save() {
            if (!this.isFormValid) {
                return;
            }
            
            this.saveLoading = true;
            
            try {
                const data = {
                    exchangeRate: parseFloat(this.exchangeRate),
                    startDate: this.startDate,
                    endDate: this.isCurrent ? null : this.endDate
                };
                
                let resp;
                if (this.editingItem) {
                    resp = await CurrencyHistoryController.updateHistoryItem(
                        this.currency.id, 
                        this.editingItem.id, 
                        data
                    );
                } else {
                    resp = await CurrencyHistoryController.createHistoryItem(
                        this.currency.id, 
                        data
                    );
                }
                
                if (resp.message) {
                    this.$emit("saved", resp.history || data);
                    this.clearForm();
                }
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.$emit("saved-error", errorMessage);
            }
            this.saveLoading = false;
        },
        
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItem) {
                return;
            }
            this.deleteLoading = true;
            try {
                const resp = await CurrencyHistoryController.deleteHistoryItem(
                    this.currency.id, 
                    this.editingItem.id
                );
                if (resp.message) {
                    this.$emit("deleted");
                    this.clearForm();
                }
            } catch (error) {
                this.$emit("deleted-error", this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        
        clearForm() {
            this.exchangeRate = '';
            this.startDate = new Date().toISOString().split('T')[0];
            this.endDate = '';
            this.isCurrent = true;
            this.resetFormChanges();
        },
        
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        
        closeDeleteDialog() {
            this.deleteDialog = false;
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
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.exchangeRate = newEditingItem.exchangeRate || '';
                    this.startDate = newEditingItem.startDate ? newEditingItem.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                    this.endDate = newEditingItem.endDate ? newEditingItem.endDate.split('T')[0] : '';
                    this.isCurrent = !newEditingItem.endDate;
                    this.editingItemId = newEditingItem.id;
                } else {
                    this.clearForm();
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true,
        },
    },
}
</script>
