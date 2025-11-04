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
                        {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
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
                        {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                    </option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label>{{ $t('amount') }}</label>
            <input type="number" v-model="origAmount" step="0.01" min="0.01" :disabled="!!editingItemId">
            <span v-if="cashFromCurrency" class="text-gray-500 ml-2">{{ cashFromCurrency.symbol || cashFromCurrency.code }}</span>
        </div>
        <div v-if="showExchangeRate" class="mt-2">
            <label>{{ $t('exchangeRate') }}</label>
            <input type="number" v-model="exchangeRate" step="0.000001" min="0.000001" :disabled="!!editingItemId">
            <small class="text-gray-500 block mt-1">
                {{ $t('exchangeRateHelp') }}
            </small>
        </div>
        <div v-if="showExchangeRate && calculatedAmount" class="mt-2 p-2 bg-blue-50 rounded">
            <label class="text-sm font-semibold">{{ $t('receiverAmount') }}:</label>
            <span class="text-lg font-bold text-blue-700">
                {{ formatCurrency(calculatedAmount, cashToCurrency?.symbol || cashToCurrency?.code || '') }}
            </span>
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
import CashRegisterController from '@/api/CashRegisterController';
import TransferDto from '@/dto/transfer/TransferDto';
import TransferController from '@/api/TransferController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import { formatCurrency } from '@/utils/numberUtils';


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: TransferDto, required: false, default: null }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : "income",
            cashIdFrom: this.editingItem ? this.editingItem.cashFromId : '',
            cashIdTo: this.editingItem ? this.editingItem.cashToId : '',
            origAmount: this.editingItem ? this.editingItem.amount : 0,
            note: this.editingItem ? this.editingItem.note : '',
            cashAmount: this.editingItem ? this.editingItem.cashAmount : null,
            cashCurrencyId: this.editingItem ? this.editingItem.cashCurrencyId : null,
            currencyId: this.editingItem ? this.editingItem.origCurrencyId : '',
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            editingItemId: this.editingItem ? this.editingItem.id : null,
            currencies: [],
            allCashRegisters: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            exchangeRate: null,
            isExchangeRateManual: false,
            isSettingExchangeRate: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCashRegisters()
            ]);
            
            if (!this.editingItem) {
                if (this.allCashRegisters.length > 0) {
                    if (!this.cashIdFrom) {
                        this.cashIdFrom = this.allCashRegisters[0].id;
                    }
                    if (!this.cashIdTo && this.allCashRegisters.length > 1) {
                        this.cashIdTo = this.allCashRegisters[1].id;
                    }
                }
            }
            
            // Рассчитываем курс после загрузки данных
            await this.calculateExchangeRate();
            
            this.saveInitialState();
        });
    },
    computed: {
        cashFromCurrency() {
            if (!this.cashIdFrom || !this.allCashRegisters.length) return null;
            const cashRegister = this.allCashRegisters.find(cr => cr.id === this.cashIdFrom);
            if (!cashRegister) return null;
            const currency = this.currencies.find(c => c.id === cashRegister.currency_id) || null;
            if (!currency && cashRegister.currency_id) {
                console.warn('Currency not found for cash register:', { 
                    cashRegister: cashRegister.id, 
                    currencyId: cashRegister.currency_id,
                    availableCurrencies: this.currencies.map(c => ({ id: c.id, name: c.name }))
                });
            }
            return currency;
        },
        cashToCurrency() {
            if (!this.cashIdTo || !this.allCashRegisters.length) return null;
            const cashRegister = this.allCashRegisters.find(cr => cr.id === this.cashIdTo);
            if (!cashRegister) return null;
            const currency = this.currencies.find(c => c.id === cashRegister.currency_id) || null;
            if (!currency && cashRegister.currency_id) {
                console.warn('Currency not found for cash register:', { 
                    cashRegister: cashRegister.id, 
                    currencyId: cashRegister.currency_id,
                    availableCurrencies: this.currencies.map(c => ({ id: c.id, name: c.name }))
                });
            }
            return currency;
        },
        showExchangeRate() {
            const hasFrom = this.cashFromCurrency !== null;
            const hasTo = this.cashToCurrency !== null;
            
            if (!hasFrom || !hasTo) {
                return false;
            }
            
            const different = this.cashFromCurrency.id !== this.cashToCurrency.id;
            
            if (!different) {
                // Валюты одинаковые, поле курса не показываем
                return false;
            }
            
            // Логируем для отладки
            if (different) {
                console.log('showExchangeRate: true', {
                    fromCurrency: this.cashFromCurrency?.name,
                    toCurrency: this.cashToCurrency?.name,
                    fromId: this.cashFromCurrency?.id,
                    toId: this.cashToCurrency?.id
                });
            }
            
            return different;
        },
        calculatedAmount() {
            if (!this.showExchangeRate || !this.exchangeRate || !this.origAmount) return null;
            // Расчет суммы получателя: amount * exchange_rate
            // exchange_rate показывает, сколько единиц целевой валюты за 1 единицу исходной
            return parseFloat(this.origAmount) * parseFloat(this.exchangeRate);
        }
    },
    methods: {
        formatCurrency,
        getFormState() {
            return {
                cashIdFrom: this.cashIdFrom,
                cashIdTo: this.cashIdTo,
                origAmount: this.origAmount,
                date: this.date,
                note: this.note,
                currencyId: this.currencyId,
                exchangeRate: this.exchangeRate
            };
        },
        handleCashRegisterChange() {
            console.log('handleCashRegisterChange called', {
                cashIdFrom: this.cashIdFrom,
                cashIdTo: this.cashIdTo,
                showExchangeRate: this.showExchangeRate,
                cashFromCurrency: this.cashFromCurrency?.name,
                cashToCurrency: this.cashToCurrency?.name
            });
            // Сбрасываем флаг ручного изменения при изменении касс
            this.isExchangeRateManual = false;
            this.$nextTick(() => {
                // Проверяем, что валюты действительно разные
                if (this.showExchangeRate) {
                    console.log('Calculating exchange rate after cash register change');
                    this.calculateExchangeRate();
                } else {
                    // Если валюты одинаковые, очищаем курс
                    this.exchangeRate = null;
                }
            });
        },
        async calculateExchangeRate() {
            if (!this.showExchangeRate) {
                this.exchangeRate = null;
                return;
            }
            
            // Если курс был изменен вручную, не пересчитываем автоматически
            if (this.isExchangeRateManual) return;
            
            try {
                // Получаем курсы валют
                const fromCurrency = this.cashFromCurrency;
                const toCurrency = this.cashToCurrency;
                
                if (!fromCurrency || !toCurrency) {
                    console.warn('Currency not found:', { fromCurrency, toCurrency, cashIdFrom: this.cashIdFrom, cashIdTo: this.cashIdTo });
                    this.exchangeRate = null;
                    return;
                }
                
                // Получаем курсы валют к базовой валюте (манат)
                const fromRateData = await AppController.getCurrencyExchangeRate(fromCurrency.id);
                const toRateData = await AppController.getCurrencyExchangeRate(toCurrency.id);
                
                // Проверяем, что данные получены
                if (!fromRateData || !toRateData || !fromRateData.exchange_rate || !toRateData.exchange_rate) {
                    console.error('Exchange rate data is missing:', { fromRateData, toRateData });
                    this.exchangeRate = null;
                    return;
                }
                
                // Преобразуем в числа, убеждаясь что это валидные числа
                // Используем Number() вместо parseFloat для более строгого преобразования
                let fromRate = Number(fromRateData.exchange_rate);
                let toRate = Number(toRateData.exchange_rate);
                
                // Если Number() вернул NaN, пробуем parseFloat
                if (isNaN(fromRate)) {
                    fromRate = parseFloat(fromRateData.exchange_rate);
                }
                if (isNaN(toRate)) {
                    toRate = parseFloat(toRateData.exchange_rate);
                }
                
                // Проверяем, что курсы валидны
                if (isNaN(fromRate) || isNaN(toRate) || fromRate <= 0 || toRate <= 0) {
                    console.error('Invalid exchange rates:', { 
                        fromRate, 
                        toRate, 
                        fromRateOriginal: fromRateData.exchange_rate,
                        toRateOriginal: toRateData.exchange_rate,
                        fromRateType: typeof fromRateData.exchange_rate,
                        toRateType: typeof toRateData.exchange_rate,
                        fromRateData, 
                        toRateData 
                    });
                    this.exchangeRate = null;
                    return;
                }
                
                // Убеждаемся, что это действительно числа (не строки)
                if (typeof fromRate !== 'number' || typeof toRate !== 'number') {
                    console.error('Exchange rates are not numbers:', { 
                        fromRate, 
                        toRate, 
                        fromRateType: typeof fromRate,
                        toRateType: typeof toRate
                    });
                    this.exchangeRate = null;
                    return;
                }
                
                // Расчет курса конвертации соответствует логике CurrencyConverter::convert
                // Курс показывает, сколько единиц целевой валюты за 1 единицу исходной
                // Это соответствует: amountInTargetCurrency = amount * exchange_rate
                
                const defaultCurrency = this.currencies.find(c => c.is_default);
                
                if (!defaultCurrency) {
                    console.error('Default currency not found!');
                    this.exchangeRate = null;
                    return;
                }
                
                let calculatedRate;
                
                if (fromCurrency.id === defaultCurrency.id) {
                    // Исходная валюта - базовая (манат)
                    // CurrencyConverter: amount / toCurrency->exchange_rate
                    // Для 1 единицы: 1 / toRate = курс
                    calculatedRate = (1 / toRate).toFixed(6);
                    console.log('From base currency:', { fromCurrency: fromCurrency.name, toCurrency: toCurrency.name, toRate, calculatedRate });
                } else if (toCurrency.id === defaultCurrency.id) {
                    // Целевая валюта - базовая (манат)
                    // CurrencyConverter: amount * fromCurrency->exchange_rate
                    // Для 1 единицы: fromRate = курс
                    // fromRate уже проверено выше и является числом
                    calculatedRate = fromRate.toFixed(6);
                    console.log('To base currency:', { fromCurrency: fromCurrency.name, toCurrency: toCurrency.name, fromRate, calculatedRate });
                } else {
                    // Обе валюты не базовые
                    // CurrencyConverter: (amount * fromRate) / toRate
                    // Для 1 единицы: fromRate / toRate = курс
                    calculatedRate = (fromRate / toRate).toFixed(6);
                    console.log('Both non-base currencies:', { fromCurrency: fromCurrency.name, toCurrency: toCurrency.name, fromRate, toRate, calculatedRate });
                }
                
                // Устанавливаем флаг, чтобы watcher не сработал
                this.isSettingExchangeRate = true;
                this.exchangeRate = calculatedRate;
                this.$nextTick(() => {
                    this.isSettingExchangeRate = false;
                });
            } catch (error) {
                console.error('Error calculating exchange rate:', error);
                this.isSettingExchangeRate = true;
                this.exchangeRate = null;
                this.$nextTick(() => {
                    this.isSettingExchangeRate = false;
                });
            }
        },
        async fetchCurrencies() {
            // Используем данные из store
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCashRegisters() {
            // Используем данные из store
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters;
        },
        async save() {
            this.saveLoading = true;
            try {
                const data = {
                    cash_id_from: this.cashIdFrom,
                    cash_id_to: this.cashIdTo,
                    amount: this.origAmount,
                    note: this.note
                };
                
                // Если валюты разные, передаем курс
                if (this.showExchangeRate && this.exchangeRate) {
                    data.exchange_rate = parseFloat(this.exchangeRate);
                }
                
                var resp = await TransferController.storeItem(data);
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                const resp = await TransferController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.type = "income";
            this.cashIdFrom = '';
            this.cashIdTo = '';
            this.origAmount = 0;
            this.note = '';
            this.currencyId = '';
            this.editingItemId = null;
            this.exchangeRate = null;
            this.isExchangeRateManual = false;
            this.isSettingExchangeRate = false;
            this.resetFormChanges();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.cashIdFrom = newEditingItem.cashFromId;
                    this.cashIdTo = newEditingItem.cashToId;
                    this.origAmount = newEditingItem.amount;
                    this.note = newEditingItem.note;
                    this.cashAmount = newEditingItem.cashAmount;
                    this.cashCurrencyId = newEditingItem.cashCurrencyId;
                    this.currencyId = newEditingItem.origCurrencyId;
                    this.editingItemId = newEditingItem.id;
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
        // Отслеживаем изменения в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
        },
        // Автоматически рассчитываем курс при изменении касс
        cashIdFrom() {
            this.handleCashRegisterChange();
        },
        cashIdTo() {
            this.handleCashRegisterChange();
        },
        // Отслеживаем ручное изменение курса
        exchangeRate(newVal, oldVal) {
            // Если курс был изменен программно (через calculateExchangeRate), не помечаем как ручной
            if (this.isSettingExchangeRate) return;
            
            // Если курс был изменен вручную пользователем, помечаем как ручной
            if (newVal && oldVal && Math.abs(parseFloat(newVal) - parseFloat(oldVal)) > 0.000001) {
                this.isExchangeRateManual = true;
            }
        },
        // Сбрасываем флаг ручного изменения при изменении касс
        showExchangeRate(newVal, oldVal) {
            console.log('showExchangeRate watcher:', { newVal, oldVal, exchangeRate: this.exchangeRate });
            if (newVal) {
                // Если курс еще не установлен или валюты изменились, сбрасываем флаг ручного изменения
                // Но не вызываем calculateExchangeRate здесь, т.к. он уже вызывается в handleCashRegisterChange
                if (!this.exchangeRate || oldVal !== newVal) {
                    this.isExchangeRateManual = false;
                    // Не вызываем calculateExchangeRate здесь, чтобы избежать дублирования
                    // handleCashRegisterChange уже вызовет его
                }
            } else {
                this.exchangeRate = null;
                this.isExchangeRateManual = false;
            }
        }
    }
}
</script>