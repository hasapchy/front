<template>
    <div>
        <label v-if="showLabel" class="block mb-1">{{ $t('source') }}</label>
        
        <!-- Выбор типа источника -->
        <div class="mb-2">
            <select v-model="internalSourceType" @change="handleSourceTypeChange" :disabled="disabled" class="w-full p-2 border rounded">
                <option value="">{{ $t('selectSourceType') }}</option>
                <option value="order">{{ $t('order') }}</option>
                <option value="sale">{{ $t('sale') }}</option>
                <option value="warehouse_receipt">{{ $t('warehouseReceipt') }}</option>
            </select>
        </div>

        <!-- Поле поиска (только если выбран тип) -->
        <div v-if="sourceType && selectedSource == null" class="relative">
            <input 
                type="text" 
                v-model="sourceSearch" 
                :placeholder="$t('enterSourceId')"
                class="w-full p-2 border rounded" 
                @focus="showDropdown = true" 
                @blur="handleBlur"
                :disabled="disabled" 
            />
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10">
                    <li v-if="sourceSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                    <li v-else-if="sourceSearch.length === 0" class="p-2 text-gray-500">{{ $t('enterIdToSearch') }}</li>
                    <li v-else-if="!isNumeric(sourceSearch)" class="p-2 text-gray-500">{{ $t('enterValidId') }}</li>
                    <li v-else-if="sourceResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                    <li v-for="source in sourceResults" :key="source.id" @mousedown.prevent="() => selectSource(source)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-semibold">
                                    {{ sourceTypeLabel }} #{{ source.id }}
                                </div>
                                <div v-if="source.client" class="text-sm text-gray-600">
                                    {{ $t('client') }}: {{ getClientName(source.client) }}
                                </div>
                                <div v-if="source.totalPrice !== undefined" class="text-sm text-gray-600">
                                    {{ $t('totalPrice') }}: {{ formatAmount(source.totalPrice, source) }}
                                </div>
                                <div v-if="source.amount !== undefined" class="text-sm text-gray-600">
                                    {{ $t('amount') }}: {{ formatAmount(source.amount, source) }}
                                </div>
                                <div v-if="source.date" class="text-sm text-gray-500">
                                    {{ formatDateSafe(source) }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </transition>
        </div>

        <!-- Выбранный источник (показывается если источник уже связан или выбран) -->
        <div v-if="selectedSource && internalSourceType" class="mt-2">
            <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label>{{ $t('source') }}</label>
                        <p><span class="text-xs">{{ $t('type') }}:</span> <span class="font-semibold text-sm">{{ sourceTypeLabel }}</span></p>
                        <p><span class="text-xs">{{ $t('id') }}:</span> <span class="font-semibold text-sm">#{{ selectedSource.id }}</span></p>
                        <p v-if="selectedSource.client">
                            <span class="text-xs">{{ $t('client') }}:</span> 
                            <span class="font-semibold text-sm">{{ getClientName(selectedSource.client) }}</span>
                        </p>
                        <p v-if="selectedSource.totalPrice !== undefined">
                            <span class="text-xs">{{ $t('totalPrice') }}:</span> 
                            <span class="font-semibold text-sm">{{ formatAmount(selectedSource.totalPrice, selectedSource) }}</span>
                        </p>
                        <p v-if="selectedSource.amount !== undefined">
                            <span class="text-xs">{{ $t('amount') }}:</span> 
                            <span class="font-semibold text-sm">{{ formatAmount(selectedSource.amount, selectedSource) }}</span>
                        </p>
                        <p v-if="selectedSource.date">
                            <span class="text-xs">{{ $t('date') }}:</span> 
                            <span class="font-semibold text-sm">{{ formatDateSafe(selectedSource) }}</span>
                        </p>
                    </div>
                    <button v-on:click="deselectSource" class="text-red-500 text-2xl cursor-pointer"
                        :disabled="disabled">×</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import OrderController from '@/api/OrderController';
import SaleController from '@/api/SaleController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import debounce from 'lodash.debounce';

export default {
    props: {
        selectedSource: {
            type: Object,
            default: null,
        },
        sourceType: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            sourceSearch: '',
            sourceSearchLoading: false,
            sourceResults: [],
            showDropdown: false,
        };
    },
    computed: {
        internalSourceType: {
            get() {
                return this.sourceType || '';
            },
            set(val) {
                this.$emit('update:sourceType', val);
            }
        },
        sourceTypeLabel() {
            const labels = {
                'order': this.$t('order'),
                'sale': this.$t('sale'),
                'warehouse_receipt': this.$t('warehouseReceipt'),
            };
            return labels[this.internalSourceType] || '';
        }
    },
    emits: ['update:selectedSource', 'update:sourceType'],
    methods: {
        isNumeric(str) {
            return /^\d+$/.test(str);
        },
        getClientName(client) {
            if (!client) return '';
            if (typeof client.fullName === 'function') {
                return client.fullName();
            }
            const firstName = client.firstName || client.first_name || '';
            const lastName = client.lastName || client.last_name || '';
            const contactPerson = client.contactPerson || client.contact_person;
            if (contactPerson) {
                return `${firstName} ${lastName} (${contactPerson})`;
            }
            return `${firstName} ${lastName}`.trim() || this.$t('noName');
        },
        formatAmount(amount, src) {
            if (amount === null || amount === undefined) return '0';
            const symbol = (src && (src.currencySymbol || src.cashCurrencySymbol)) || '';
            const num = parseFloat(amount) || 0;
            // Используем глобальный форматтер если есть
            if (this.$formatNumber) {
                return `${this.$formatNumber(num, 2, true)} ${symbol}`.trim();
            }
            return `${num.toFixed(2)} ${symbol}`.trim();
        },
        formatDateSafe(src) {
            if (src && typeof src.formatDate === 'function') {
                return src.formatDate();
            }
            if (src && src.date) {
                try { return new Date(src.date).toLocaleString(); } catch (_) { return String(src.date); }
            }
            return '';
        },
        handleSourceTypeChange() {
            // Сбрасываем выбранный источник при смене типа
            this.$emit('update:selectedSource', null);
            this.sourceSearch = '';
            this.sourceResults = [];
        },
        async searchSource() {
            if (!this.internalSourceType || this.sourceSearch.length === 0) {
                this.sourceResults = [];
                return;
            }

            // Если введен только номер (ID), ищем напрямую по ID
            if (this.isNumeric(this.sourceSearch) && this.sourceSearch.length > 0) {
                this.sourceSearchLoading = true;
                try {
                    const id = parseInt(this.sourceSearch);
                    let result = null;

                    switch (this.internalSourceType) {
                        case 'order':
                            result = await OrderController.getItem(id);
                            break;
                        case 'sale':
                            result = await SaleController.getItem(id);
                            break;
                        case 'warehouse_receipt':
                            result = await WarehouseReceiptController.getItem(id);
                            break;
                    }

                    if (result) {
                        this.sourceResults = [result];
                    } else {
                        this.sourceResults = [];
                    }
                } catch (error) {
                    // Если не найдено, показываем пустой список
                    this.sourceResults = [];
                } finally {
                    this.sourceSearchLoading = false;
                }
            } else {
                // Если введен текст, используем обычный поиск через список
                this.sourceSearchLoading = true;
                try {
                    let results = [];

                    switch (this.internalSourceType) {
                        case 'order':
                            const orderResponse = await OrderController.getItemsPaginated(1, this.sourceSearch, 'all_time', null, null, '', '', '', 20);
                            results = orderResponse.items || [];
                            break;
                        case 'sale':
                            const saleResponse = await SaleController.getItemsPaginated(1, this.sourceSearch, 'all_time', null, null, 20);
                            results = saleResponse.items || [];
                            break;
                        case 'warehouse_receipt':
                            // Для оприходований поиск по ID обычно, но можно добавить общий поиск через список
                            const receiptResponse = await WarehouseReceiptController.getStocks(1, 20);
                            results = (receiptResponse.items || []).filter(item => 
                                String(item.id).includes(this.sourceSearch)
                            );
                            break;
                    }

                    this.sourceResults = results;
                } catch (error) {
                    console.error('Ошибка при поиске источника:', error);
                    this.sourceResults = [];
                } finally {
                    this.sourceSearchLoading = false;
                }
            }
        },
        async selectSource(source) {
            this.showDropdown = false;
            this.sourceSearch = '';
            this.sourceResults = [];
            this.$emit('update:selectedSource', source);
        },
        deselectSource() {
            this.$emit('update:selectedSource', null);
            this.sourceSearch = '';
            this.sourceResults = [];
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
    },
    watch: {
        sourceSearch: {
            handler: debounce(function () {
                this.searchSource();
            }, 300),
        },
    },
};
</script>

