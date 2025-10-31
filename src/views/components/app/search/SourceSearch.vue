<template>
    <div>
        <label v-if="showLabel" class="block mb-1">{{ $t('source') }}</label>
        
        <!-- Выбор типа источника -->
        <div class="mb-2">
            <select :value="sourceType" @change="handleSourceTypeSelect" :disabled="disabled" class="w-full p-2 border rounded">
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
        <div v-if="selectedSource && sourceType" class="mt-2">
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
import debounce from 'lodash.debounce';

export default {
    name: 'SourceSearch',
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
        sourceTypeLabel() {
            const labels = {
                'order': this.$t('order'),
                'sale': this.$t('sale'),
                'warehouse_receipt': this.$t('warehouseReceipt'),
            };
            return labels[this.sourceType || ''] || '';
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
                return `${this.$formatNumber(num, null, true)} ${symbol}`.trim();
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
        handleSourceTypeSelect(event) {
            const newType = event.target.value;
            this.$emit('update:sourceType', newType);
            // Сбрасываем выбранный источник при смене типа
            this.$emit('update:selectedSource', null);
            this.sourceSearch = '';
            this.sourceResults = [];
        },
        searchSource: debounce(async function () {
            if (!this.sourceType || !this.isNumeric(this.sourceSearch)) {
                this.sourceResults = [];
                return;
            }

            this.sourceSearchLoading = true;
            try {
                const id = parseInt(this.sourceSearch);
                let result = null;

                // Ленивая загрузка контроллеров - только при необходимости
                switch (this.sourceType) {
                    case 'order': {
                        const OrderController = (await import('@/api/OrderController')).default;
                        result = await OrderController.getItem(id);
                        break;
                    }
                    case 'sale': {
                        const SaleController = (await import('@/api/SaleController')).default;
                        result = await SaleController.getItem(id);
                        break;
                    }
                    case 'warehouse_receipt': {
                        const WarehouseReceiptController = (await import('@/api/WarehouseReceiptController')).default;
                        result = await WarehouseReceiptController.getItem(id);
                        break;
                    }
                }

                this.sourceResults = result ? [result] : [];
            } catch (error) {
                this.sourceResults = [];
            } finally {
                this.sourceSearchLoading = false;
            }
        }, 300),
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
            handler: 'searchSource',
            immediate: false,
        },
    },
};
</script>

