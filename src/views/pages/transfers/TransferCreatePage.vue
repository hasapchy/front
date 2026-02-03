<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTransfer') : $t('createTransfer') }}</h2>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('senderCashRegister') }}</label>
            <select v-model="cashIdFrom" :disabled="!!editingItemId">
                <option value="">{{ $t('selectCashRegister') }}</option>
                <template v-if="allCashRegisters.length">
                    <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id"
                        :disabled="parent.id === cashIdTo">
                        {{ parent.name }} ({{ parent.currencySymbol || '' }})
                    </option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('receiverCashRegister') }}</label>
            <select v-model="cashIdTo" :disabled="!!editingItemId">
                <option value="">{{ $t('selectCashRegister') }}</option>
                <template v-if="allCashRegisters.length">
                    <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id"
                        :disabled="parent.id === cashIdFrom">
                        {{ parent.name }} ({{ parent.currencySymbol || '' }})
                    </option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label>{{ $t('amount') }}</label>
            <input type="number" v-model="origAmount" step="0.01" min="0.01" :disabled="!!editingItemId">
            <span v-if="cashFromCurrency" class="text-gray-500 ml-2">{{ cashFromCurrency.symbol || '' }}</span>
        </div>
        <div v-if="showExchangeRate" class="mt-2">
            <label>{{ $t('exchangeRate') }}</label>
            <input type="number" v-model="exchangeRate" step="0.000001" min="0.000001" :disabled="!!editingItemId">
            <small class="text-gray-500 block mt-1">
                {{ $t('exchangeRateHelp') }}
            </small>
        </div>
        <div v-if="showCalculatedAmount" class="mt-2 p-2 bg-blue-50 rounded">
            <div class="text-sm text-gray-600 mb-1">
                {{ formatCurrency(origAmount, cashFromCurrency?.symbol || '', 2, true) }} 
                {{ $t('atExchangeRate') || 'по курсу' }} 
                {{ exchangeRate }} = 
                <span class="text-lg font-bold text-black inline-flex items-center gap-1">
                    <input
                        type="number"
                        v-model="calculatedAmountInput"
                        step="0.01"
                        min="0.01"
                        :disabled="!!editingItemId"
                        class="w-16 bg-transparent border-b border-black focus:outline-none text-lg font-bold"
                    >
                    <span>{{ cashToCurrency?.symbol || '' }}</span>
                </span>
            </div>
        </div>
        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" :disabled="!!editingItemId">
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('transfers_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('transfers_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('transfers_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteTransfer')" :confirm-text="$t('deleteTransfer')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import AppController from '@/api/AppController';
import TransferDto from '@/dto/transfer/TransferDto';
import TransferController from '@/api/TransferController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { formatCurrency } from '@/utils/numberUtils';


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: TransferDto, required: false, default: null }
    },
    data() {
        return {
            cashIdFrom: this.editingItem ? this.editingItem.cashFromId : '',
            cashIdTo: this.editingItem ? this.editingItem.cashToId : '',
            origAmount: this.editingItem ? this.editingItem.amount : 0,
            note: this.editingItem ? this.editingItem.note : '',
            currencies: [],
            allCashRegisters: [],
            exchangeRate: this.editingItem ? this.editingItem.exchangeRate : null
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCashRegisters()
            ]);
            
            if (this.showExchangeRate && !this.exchangeRate) {
                await this.calculateExchangeRate();
            }

            await this.$nextTick();
            this.saveInitialState();
        });
    },
    computed: {
        cashFromCurrency() {
            const cashRegister = this.allCashRegisters.find(cr => cr.id == this.cashIdFrom);
            if (!cashRegister) return null;
            const currencyId = cashRegister.currencyId || cashRegister.currency_id;
            return this.currencies.find(c => c.id == currencyId);
        },
        cashToCurrency() {
            const cashRegister = this.allCashRegisters.find(cr => cr.id == this.cashIdTo);
            if (!cashRegister) return null;
            const currencyId = cashRegister.currencyId || cashRegister.currency_id;
            return this.currencies.find(c => c.id == currencyId);
        },
        showExchangeRate() {
            return !!(this.cashIdFrom && this.cashIdTo && this.cashFromCurrency && this.cashToCurrency);
        },
        calculatedAmount() {
            if (!this.exchangeRate || !this.origAmount) return null;
            const rate = this.cashFromCurrency?.id == this.cashToCurrency?.id ? 1.0 : parseFloat(this.exchangeRate);
            const result = parseFloat(this.origAmount) * rate;
            return Math.round(result * 100) / 100;
        },
        calculatedAmountInput: {
            get() {
                return this.calculatedAmount;
            },
            set(value) {
                const amount = parseFloat(value);
                const orig = parseFloat(this.origAmount);
                if (!orig || isNaN(amount) || amount <= 0) {
                    return;
                }
                const rate = amount / orig;
                this.exchangeRate = rate.toFixed(6);
            }
        },
        showCalculatedAmount() {
            return this.calculatedAmount && this.cashFromCurrency?.id !== this.cashToCurrency?.id;
        }
    },
    methods: {
        formatCurrency,
        getFormState() {
            return {
                cashIdFrom: this.cashIdFrom,
                cashIdTo: this.cashIdTo,
                origAmount: this.origAmount,
                note: this.note,
                exchangeRate: this.exchangeRate
            };
        },
        handleCashRegisterChange() {
            // При редактировании существующего трансфера курс не пересчитываем автоматически
            if (this.editingItemId) {
                return;
            }
            this.$nextTick(async () => {
                if (this.showExchangeRate) {
                    await this.calculateExchangeRate();
                } else {
                    this.exchangeRate = null;
                }
            });
        },
        async calculateExchangeRate() {
            if (!this.showExchangeRate) return;
            
            const fromCurrency = this.cashFromCurrency;
            const toCurrency = this.cashToCurrency;
            if (!fromCurrency || !toCurrency) return;

            if (fromCurrency.id == toCurrency.id) {
                this.exchangeRate = '1.0';
                return;
            }
            
            try {
                const fromRateData = await AppController.getCurrencyExchangeRate(fromCurrency.id);
                const toRateData = await AppController.getCurrencyExchangeRate(toCurrency.id);
                
                if (!fromRateData?.exchange_rate || !toRateData?.exchange_rate) return;
                
                const fromRate = parseFloat(fromRateData.exchange_rate);
                const toRate = parseFloat(toRateData.exchange_rate);
                if (isNaN(fromRate) || isNaN(toRate) || fromRate <= 0 || toRate <= 0) return;
                
                const defaultCurrency = this.currencies.find(c => c.isDefault);
                if (!defaultCurrency) return;
                
                let calculatedRate;
                if (fromCurrency.id == defaultCurrency.id) {
                    calculatedRate = (1 / toRate).toFixed(6);
                } else if (toCurrency.id == defaultCurrency.id) {
                    calculatedRate = fromRate.toFixed(6);
                } else {
                    calculatedRate = (fromRate / toRate).toFixed(6);
                }
                
                this.exchangeRate = calculatedRate;
            } catch (error) {
                console.error('[calculateExchangeRate] Error:', error);
            }
        },
        async fetchCurrencies() {
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCashRegisters() {
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters;
        },
        prepareSave() {
            const data = {
                cash_id_from: this.cashIdFrom,
                cash_id_to: this.cashIdTo,
                amount: this.origAmount,
                note: this.note
            };
            
            if (this.exchangeRate) {
                data.exchange_rate = parseFloat(this.exchangeRate);
            }
            
            return data;
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await TransferController.updateItem(this.editingItemId, data);
            } else {
                return await TransferController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await TransferController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete transfer');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.clearForm();
            }
        },
        clearForm() {
            this.cashIdFrom = '';
            this.cashIdTo = '';
            this.origAmount = 0;
            this.note = '';
            this.exchangeRate = null;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.cashIdFrom = newEditingItem.cashFromId;
            this.cashIdTo = newEditingItem.cashToId;
            this.origAmount = newEditingItem.amount;
            this.note = newEditingItem.note;
            this.exchangeRate = newEditingItem.exchangeRate || null;
        }
    },
    watch: {
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
        },
        cashIdFrom() {
            this.handleCashRegisterChange();
        },
        cashIdTo() {
            this.handleCashRegisterChange();
        },
        showExchangeRate(newVal) {
            if (!newVal) {
                this.exchangeRate = null;
                return;
            }
            // Для существующих трансферов используем сохранённый курс, не трогаем его
            if (this.editingItemId || this.exchangeRate) {
                return;
            }
            this.$nextTick(() => {
                this.calculateExchangeRate();
            });
        }
    }
}
</script>