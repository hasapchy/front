<template>
    <div class="mb-4">
        <transition name="fade" mode="out-in">
            <div v-if="data && !loading && sortedBalanceCards.length > 0" key="table">
                <div class="mb-2 flex items-center justify-end gap-2">
                    <button @click="toggleRowsCount"
                        class="text-xs border rounded px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                        :title="rowsCount === 1 ? 'Переключить на 2 ряда' : 'Переключить на 1 ряд'">
                        <i :class="rowsCount === 1 ? 'fas fa-th-large' : 'fas fa-th'" class="text-gray-600"></i>
                        <span class="text-gray-600">{{ rowsCount === 1 ? '1 ряд' : '2 ряда' }}</span>
                    </button>
                </div>
                <div :class="rowsCount === 1 ? 'overflow-x-auto' : ''">
                    <draggable :list="sortedBalanceCards" group="balance-cards" :animation="200"
                        ghost-class="ghost-balance-card" drag-class="dragging-balance-card"
                        handle=".balance-drag-handle" @change="handleBalanceReorder"
                        :class="['pb-1', rowsCount === 2 ? 'flex flex-wrap gap-4' : 'flex space-x-4']"
                        :style="rowsCount === 1 ? 'min-width: max-content;' : ''">
                        <div v-for="(card, index) in sortedBalanceCards" :key="card.id"
                            class="balance-card-wrapper flex-shrink-0">
                            <div v-if="card.type === 'cash_register'" class="bg-white p-3 rounded-lg shadow-md relative"
                                :style="getCardStyle(card)">
                                <div class="cash-register-title mb-2 flex items-center justify-center gap-2">
                                    <i
                                        class="fas fa-grip-vertical balance-drag-handle text-gray-400 hover:text-gray-600 cursor-move"></i>
                                    <i v-if="card.icon" :class="card.icon" class="text-gray-700"></i>
                                    <span class="cash-register-name text-sm font-semibold text-center">
                                        {{ translateName(card.name) }}
                                        <span class="cash-register-currency">({{ card.currencySymbol || '' }})</span>
                                    </span>
                                </div>
                                <span v-if="card.visible"
                                    class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-300"
                                    @mousedown.prevent="startResize($event, index)"></span>
                                <div v-if="canViewCashBalance" :class="getGridClass(card.balance)">
                                    <div v-for="balance in card.balance" :key="balance.title"
                                        class="balance-item text-center" :class="{
                                            'clickable-balance': isClickable(balance.type),
                                            'hover-income': balance.type === 'income',
                                            'hover-outcome': balance.type === 'outcome',
                                            [`balance-${balance.type}`]: true
                                        }" :title="isClickable(balance.type) ? $t('clickToFilterTransactions') : ''"
                                        @click="handleBalanceClick(card, balance)">
                                        <div class="balance-header flex items-center justify-center gap-1 mb-1">
                                            <span class="balance-title">{{ translateTitle(balance.title) }}</span>
                                            <i :class="getBalanceIconClass(balance.type)"></i>
                                        </div>
                                        <div class="balance-value" :class="`balance-value-${balance.type}`">
                                            <div class="balance-amount">{{ formatBalanceValue(balance) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="card.type === 'client_debts'"
                                class="bg-white p-3 rounded-lg shadow-md relative" :style="getCardStyle(card)">
                                <div class="text-center mb-3 flex items-center justify-center gap-2">
                                    <i
                                        class="fas fa-grip-vertical balance-drag-handle text-gray-400 hover:text-gray-600 cursor-move"></i>
                                    <span class="text-sm font-semibold">{{ clientDebtsTitle }}</span>
                                </div>
                                <span v-if="card.visible"
                                    class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-300"
                                    @mousedown.prevent="startResize($event, index)"></span>
                                <div class="grid grid-cols-2 gap-2">
                                    <div v-for="debt in displayDebts" :key="debt.id"
                                        class="balance-item debt-item text-center">
                                        <div class="balance-header flex items-center justify-center gap-1 mb-1">
                                            <span class="balance-title">{{ debt.title }}</span>
                                            <i :class="debt.iconClass"></i>
                                        </div>
                                        <div class="balance-value" :class="debt.textClass">
                                            <div class="balance-amount">{{ debt.value }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </draggable>
                </div>
            </div>
            <div v-else-if="loading" key="loader" class="flex justify-center items-center h-20">
                <SpinnerIcon />
            </div>
        </transition>
    </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import CashRegisterController from '@/api/CashRegisterController';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const BALANCE_ICONS = {
    income: 'fas fa-arrow-up balance-icon-income',
    outcome: 'fas fa-arrow-down balance-icon-outcome',
    default: 'fas fa-calculator balance-icon-default',
    project_income: 'fas fa-chart-line balance-icon-project'
};

const TITLE_TRANSLATIONS = {
    'Приход': 'income',
    'Расход': 'outcome',
    'Итого': 'итого',
    'Главная касса': 'mainCashRegister'
};

export default {
    components: {
        draggable: VueDraggableNext,
        SpinnerIcon
    },
    props: {
        cashRegisterId: { type: Number, default: null },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        dateFilter: { type: String, default: 'all_time' },
        transactionTypeFilter: { type: String, default: '' },
        sourceFilter: { type: String, default: '' }
    },
    data() {
        return {
            data: null,
            loading: false,
            fetchDebounceTimer: null,
            clientDebts: {
                positive: 0,
                negative: 0
            },
            cardSizes: {},
            sortedBalanceCards: [],
            resizing: false,
            resizingCard: null,
            startX: 0,
            startWidth: 0,
            rowsCount: 1
        };
    },
    computed: {
        filters() {
            return {
                cashRegisterId: this.cashRegisterId,
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                transactionTypeFilter: this.transactionTypeFilter,
                sourceFilter: this.sourceFilter
            };
        },
        canViewCashBalance() {
            return this.$store.getters.hasPermission('settings_cash_balance_view');
        },
        canViewClientBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view');
        },
        displayDebts() {
            return [
                {
                    id: 'oweUs',
                    title: this.$t('oweUs'),
                    iconClass: 'fas fa-arrow-trend-down text-green-500',
                    textClass: 'text-green-600 font-bold text-sm',
                    value: this.formatBalanceValue({ value: this.clientDebts.positive, type: 'debt' })
                },
                {
                    id: 'weOwe',
                    title: this.$t('weOwe'),
                    iconClass: 'fas fa-arrow-trend-up text-red-500',
                    textClass: 'text-red-600 font-bold text-sm',
                    value: this.formatBalanceValue({ value: Math.abs(this.clientDebts.negative), type: 'debt' })
                }
            ];
        },
        allBalanceCards() {
            const cards = [];

            if (this.canViewCashBalance && this.data) {
                this.data.forEach(item => {
                    cards.push({
                        id: `cash_${item.id}`,
                        type: 'cash_register',
                        name: item.name,
                        currencySymbol: item.currencySymbol,
                        balance: item.balance,
                        cashRegisterId: item.id,
                        icon: item.icon
                    });
                });
            }

            if (this.canViewClientBalance && (this.clientDebts.positive !== 0 || this.clientDebts.negative !== 0)) {
                cards.push({
                    id: 'client_debts',
                    type: 'client_debts'
                });
            }

            return cards;
        },
        clientDebtsTitle() {
            const clientTypeFilter = this.$store.getters.clientTypeFilter || [];
            if (!clientTypeFilter.length) {
                return this.$t('clientDebts');
            }

            const typeLabels = {
                individual: this.$t('individual'),
                company: this.$t('company'),
                employee: this.$t('employee'),
                investor: this.$t('investor')
            };

            const selectedTypes = clientTypeFilter
                .map(type => typeLabels[type])
                .filter(Boolean);

            return selectedTypes.length 
                ? `${this.$t('clientDebts')}: ${selectedTypes.join(', ').toLowerCase()}`
                : this.$t('clientDebts');
        }
    },
    methods: {
        updateSortedBalanceCards() {
            const savedData = this.getSavedData();
            const allCards = this.allBalanceCards;

            const getDefaultSize = (type) => type === 'client_debts' ? 300 : 250;
            
            const applySize = (card) => {
                const defaultSize = getDefaultSize(card.type);
                const size = this.cardSizes[card.id] || savedData?.cards?.find(c => c.id === card.id)?.size || defaultSize;
                return {
                    ...card,
                    size,
                    visible: card.visible !== false
                };
            };

            if (!savedData?.order?.length) {
                this.sortedBalanceCards = allCards.map(card => ({
                    ...card,
                    size: getDefaultSize(card.type),
                    visible: card.visible !== false
                }));
                return;
            }

            const cardsMap = new Map(allCards.map(card => [card.id, card]));

            const sorted = savedData.order
                .map(id => {
                    const card = cardsMap.get(id);
                    if (!card) return null;
                    return applySize(card);
                })
                .filter(card => card !== null);

            const savedIds = new Set(savedData.order);
            const newCards = allCards
                .filter(card => !savedIds.has(card.id))
                .map(applySize);

            this.sortedBalanceCards = [...sorted, ...newCards];
        },
        formatBalanceValue(balance) {
            return this.$formatNumberForCompany(balance.value, true);
        },
        isClickable(type) {
            return type === 'income' || type === 'outcome';
        },
        handleBalanceClick(cashRegister, balance) {
            this.$emit('balance-click', {
                cashRegisterId: cashRegister.cashRegisterId,
                transactionType: balance.type
            });
        },
        getGridClass(balanceItems) {
            const count = balanceItems.length;
            return `balance-grid balance-grid-${Math.min(count, 4)}`;
        },
        getBalanceIconClass(type) {
            return BALANCE_ICONS[type] || BALANCE_ICONS.default;
        },
        translateTitle(title) {
            return this.$t(TITLE_TRANSLATIONS[title] || title);
        },
        translateName(name) {
            return name === 'Главная касса' ? this.$t('mainCashRegister') : name;
        },
        getDateRange() {
            const base = dayjs().utc().add(5, 'hour');
            let start = null;
            let end = null;

            switch (this.dateFilter) {
                case 'today':
                    start = end = base.format('DD.MM.YYYY');
                    break;
                case 'yesterday':
                    start = end = base.subtract(1, 'day').format('DD.MM.YYYY');
                    break;
                case 'this_week':
                    start = base.startOf('isoWeek').format('DD.MM.YYYY');
                    end = base.endOf('isoWeek').format('DD.MM.YYYY');
                    break;
                case 'last_week': {
                    const lastWeek = base.subtract(1, 'week');
                    start = lastWeek.startOf('isoWeek').format('DD.MM.YYYY');
                    end = lastWeek.endOf('isoWeek').format('DD.MM.YYYY');
                    break;
                }
                case 'this_month':
                    start = base.startOf('month').format('DD.MM.YYYY');
                    end = base.endOf('month').format('DD.MM.YYYY');
                    break;
                case 'last_month': {
                    const lastMonth = base.subtract(1, 'month');
                    start = lastMonth.startOf('month').format('DD.MM.YYYY');
                    end = lastMonth.endOf('month').format('DD.MM.YYYY');
                    break;
                }
                case 'custom':
                    start = this.startDate ? dayjs(this.startDate).format('DD.MM.YYYY') : null;
                    end = this.endDate ? dayjs(this.endDate).format('DD.MM.YYYY') : null;
                    break;
            }

            return { start, end };
        },
        buildParams(start, end) {
            const params = {};
            if (this.cashRegisterId !== null) {
                params.cash_register_ids = String(this.cashRegisterId);
            }
            if (start) params.start_date = start;
            if (end) params.end_date = end;
            if (this.transactionTypeFilter) params.transaction_type = this.transactionTypeFilter;
            if (this.sourceFilter) params.source = this.sourceFilter;
            return params;
        },
        calculateClientDebts(clients) {
            const clientTypeFilter = this.$store.getters.clientTypeFilter || [];
            const hasFilter = clientTypeFilter.length > 0;

            let positive = 0;
            let negative = 0;

            for (const client of clients) {
                if (hasFilter) {
                    const type = client.clientType || client.client_type || 'individual';
                    if (!clientTypeFilter.includes(type)) continue;
                }
                const balance = parseFloat(client.balance) || 0;
                if (balance > 0) {
                    positive += balance;
                } else if (balance < 0) {
                    negative += Math.abs(balance);
                }
            }

            return { positive, negative };
        },
        async loadClientDebts() {
            if (!this.canViewClientBalance) {
                this.clientDebts = { positive: 0, negative: 0 };
                return;
            }

            try {
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                this.clientDebts = this.calculateClientDebts(clients);
            } catch (error) {
                console.error('Ошибка при загрузке балансов клиентов:', error);
                this.clientDebts = { positive: 0, negative: 0 };
            }
        },
        getLocalStorageKey() {
            const companyId = this.$store.state.currentCompany?.id || 'default';
            return `ui_transactions_balance_cards_layout_${companyId}`;
        },
        getSavedData() {
            try {
                const saved = localStorage.getItem(this.getLocalStorageKey());
                if (!saved) return null;
                const data = JSON.parse(saved);
                if (Array.isArray(data)) {
                    return { order: data, cards: [] };
                }
                return data;
            } catch (error) {
                return null;
            }
        },
        saveData() {
            try {
                const data = {
                    order: this.sortedBalanceCards.map(card => card.id),
                    cards: this.sortedBalanceCards.map(card => {
                        const defaultSize = card.type === 'client_debts' ? 300 : 250;
                        return {
                            id: card.id,
                            size: this.cardSizes[card.id] || card.size || defaultSize,
                            visible: card.visible
                        };
                    }),
                    rowsCount: this.rowsCount
                };
                localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(data));
            } catch (error) {
            }
        },
        handleBalanceReorder() {
            this.saveData();
        },
        toggleRowsCount() {
            this.rowsCount = this.rowsCount === 1 ? 2 : 1;
            this.saveData();
        },
        getCardStyle(card) {
            const defaultSize = card.type === 'client_debts' ? 300 : 250;
            const size = card.size || defaultSize;
            return {
                width: `${size}px`,
                minWidth: `${size}px`
            };
        },
        startResize(e, index) {
            e.preventDefault();
            e.stopPropagation();
            this.resizing = true;
            this.resizingCard = index;
            this.startX = e.clientX;
            const cardElement = e.target.closest('.balance-card-wrapper');
            const whiteCard = cardElement?.querySelector('.bg-white');
            this.startWidth = whiteCard?.offsetWidth || 200;
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.stopResize);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        onMouseMove(e) {
            if (!this.resizing) return;
            e.preventDefault();
            const dx = e.clientX - this.startX;
            const cards = this.sortedBalanceCards;
            const card = cards[this.resizingCard];
            if (!card) return;
            const newWidth = Math.max(150, this.startWidth + dx);
            this.cardSizes[card.id] = newWidth;
        },
        stopResize() {
            if (!this.resizing) return;
            this.resizing = false;
            this.saveData();
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseup', this.stopResize);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        },
        async fetchItems() {
            if (!this.canViewCashBalance) {
                this.data = [];
                this.clientDebts = { positive: 0, negative: 0 };
                this.updateSortedBalanceCards();
                return;
            }

            this.loading = true;
            try {
                const { start, end } = this.getDateRange();
                const cashIds = this.cashRegisterId !== null ? [this.cashRegisterId] : [];
                const params = this.buildParams(start, end);

                this.data = await CashRegisterController.getCashBalance(cashIds, start, end, params);
                await this.loadClientDebts();
                this.updateSortedBalanceCards();
            } finally {
                this.loading = false;
            }
        }
    },
    watch: {
        filters: {
            handler() {
                if (this.fetchDebounceTimer) {
                    clearTimeout(this.fetchDebounceTimer);
                }

                this.fetchDebounceTimer = setTimeout(() => {
                    this.fetchItems();
                }, 100);
            },
            immediate: true,
            deep: true
        },
        allBalanceCards: {
            handler() {
                this.updateSortedBalanceCards();
            },
            deep: true
        },
        cardSizes: {
            handler() {
                this.updateSortedBalanceCards();
            },
            deep: true
        },
        '$store.state.currentCompany.id': {
            handler() {
                const savedData = this.getSavedData();
                this.cardSizes = {};
                if (savedData) {
                    if (savedData.cards) {
                        savedData.cards.forEach(card => {
                            this.cardSizes[card.id] = card.size || 250;
                        });
                    }
                    if (savedData.rowsCount !== undefined) {
                        this.rowsCount = savedData.rowsCount;
                    }
                }
                this.updateSortedBalanceCards();
            }
        }
    },
    mounted() {
        const savedData = this.getSavedData();
        if (savedData) {
            if (savedData.cards) {
                savedData.cards.forEach(card => {
                    this.cardSizes[card.id] = card.size || 250;
                });
            }
            if (savedData.rowsCount !== undefined) {
                this.rowsCount = savedData.rowsCount;
            }
        }
        this.updateSortedBalanceCards();
    },
    beforeUnmount() {
        if (this.fetchDebounceTimer) {
            clearTimeout(this.fetchDebounceTimer);
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.stopResize);
    }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.ghost-balance-card {
    opacity: 0.4;
    background: #e3f2fd;
    border: 2px dashed #2196f3;
}

.dragging-balance-card {
    opacity: 0.8;
    transform: rotate(1deg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.balance-card-wrapper {
    transition: transform 0.2s ease;
    flex-shrink: 0;
}

.balance-drag-handle {
    user-select: none;
    transition: color 0.2s ease;
}

.resize-handle {
    user-select: none;
    transition: background-color 0.2s ease;
}

.resize-handle:hover {
    background-color: rgba(59, 130, 246, 0.5) !important;
}

.balance-item {
    transition: all 0.2s ease;
}

.clickable-balance {
    cursor: pointer;
    border-radius: 4px;
    padding: 4px;
}

.clickable-balance:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.hover-income:hover {
    background-color: rgba(34, 197, 94, 0.1);
}

.hover-outcome:hover {
    background-color: rgba(239, 68, 68, 0.1);
}

.balance-grid {
    display: grid;
    gap: 0.5rem;
}

.balance-grid-1 {
    grid-template-columns: 1fr;
}

.balance-grid-2 {
    grid-template-columns: repeat(2, 1fr);
}

.balance-grid-3 {
    grid-template-columns: repeat(3, 1fr);
}

.balance-grid-4 {
    grid-template-columns: repeat(4, 1fr);
}

.balance-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
}

.balance-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
}

.balance-value {
    font-weight: 700;
    font-size: 0.875rem;
}

.balance-amount {
    white-space: nowrap;
    font-weight: 700;
    font-size: 1.1rem;
    line-height: 1.2;
}

@media (max-width: 768px) {
    .balance-amount {
        font-size: 0.9rem;
    }
}
</style>
