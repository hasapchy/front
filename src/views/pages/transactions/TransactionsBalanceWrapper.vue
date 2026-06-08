<template>
  <div class="mb-4">
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="data && !loading && sortedBalanceCards.length > 0"
        key="table"
      >
        <div class="mb-2 flex items-center justify-end gap-2">
          <button
            class="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white hover:bg-gray-50 dark:bg-[var(--surface-elevated)] dark:border-white/15 dark:hover:bg-[var(--surface-muted)] transition-colors flex items-center gap-2"
            :title="rowsCount === 1 ? 'Переключить на 2 ряда' : 'Переключить на 1 ряд'"
            @click="toggleRowsCount"
          >
            <i
              :class="rowsCount === 1 ? 'fas fa-th-large' : 'fas fa-th'"
              class="text-gray-600 dark:text-[var(--text-secondary)]"
            />
            <span class="text-gray-600 dark:text-[var(--text-secondary)]">{{ rowsCount === 1 ? '1 ряд' : '2 ряда' }}</span>
          </button>
        </div>
        <div :class="rowsCount === 1 ? 'overflow-x-auto' : ''">
          <draggable
            :list="sortedBalanceCards"
            group="balance-cards"
            :animation="200"
            ghost-class="ghost-balance-card"
            drag-class="dragging-balance-card"
            handle=".balance-drag-handle"
            :class="['pb-1 items-stretch', rowsCount === 2 ? 'flex flex-wrap gap-4' : 'flex space-x-4']"
            :style="rowsCount === 1 ? 'min-width: max-content;' : ''"
            @change="handleBalanceReorder"
          >
            <div
              v-for="(card, index) in sortedBalanceCards"
              :key="card.id"
              class="balance-card-wrapper flex h-full min-h-0 shrink-0 flex-col"
            >
              <div
                v-if="card.type === 'cash_register'"
                class="transactions-balance-card transactions-balance-card-cash relative flex h-full min-h-0 flex-col rounded-lg border border-gray-100 bg-white p-3 shadow-md dark:border-white/10 dark:border-l-4 dark:bg-[var(--surface-elevated)]"
                :class="cashRegisterCardDarkLeftBorderClass(card)"
                :style="getCardStyle(card)"
              >
                <div class="cash-register-title mb-2 flex shrink-0 items-center justify-center gap-2">
                  <i
                    class="fas fa-grip-vertical balance-drag-handle text-gray-400 hover:text-gray-600 dark:text-white/65 dark:hover:text-white cursor-move"
                  />
                  <button
                    type="button"
                    class="cursor-pointer transition-opacity hover:opacity-80"
                    :title="$t('cashRegisterColorPickHint')"
                    @click.stop="openColorModal(card)"
                  >
                    <CashRegisterIconBadge
                      :cash-register="card"
                      size="lg"
                    />
                  </button>
                  <span class="min-w-0 text-center">
                    <span class="block truncate text-sm font-bold text-gray-900 dark:text-white">
                      {{ cashRegisterTitle(card) }}
                    </span>
                    <span class="block truncate text-xs text-gray-500 dark:text-white/70">
                      {{ cashRegisterSubtitle(card) }}
                    </span>
                  </span>
                </div>
                <span
                  v-if="card.visible"
                  class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-[color-mix(in_srgb,var(--color-info)_40%,transparent)] dark:hover:bg-white/25"
                  @mousedown.prevent="startResize($event, index)"
                />
                <div
                  v-if="canViewCashBalance"
                  :class="[getGridClass(card.balance), 'min-h-0 flex-1 content-center']"
                >
                  <div
                    v-for="balance in card.balance"
                    :key="balance.title"
                    class="balance-item text-center"
                    :class="{
                      'clickable-balance': isClickable(balance.type),
                      'hover-income': balance.type === 'income',
                      'hover-outcome': balance.type === 'outcome',
                      [`balance-${balance.type}`]: true
                    }"
                    :title="isClickable(balance.type) ? $t('clickToFilterTransactions') : ''"
                    @click="handleBalanceClick(card, balance)"
                  >
                    <div class="balance-header flex items-center justify-center gap-1 mb-1">
                      <span class="balance-title">{{ translateTitle(balance.title) }}</span>
                      <i :class="getBalanceIconClass(balance.type)" />
                    </div>
                    <div
                      class="balance-value"
                      :class="`balance-value-${balance.type}`"
                    >
                      <div
                        class="balance-amount"
                        :title="formatBalanceValue(balance)"
                      >
                        {{ formatBalanceValue(balance) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-else-if="card.type === 'client_debts'"
                class="transactions-balance-card transactions-balance-card-debts relative flex h-full min-h-0 flex-col rounded-lg border border-gray-100 bg-white p-3 shadow-md dark:border-white/10 dark:bg-[var(--surface-muted)]"
                :style="getCardStyle(card)"
              >
                <div class="cash-register-title mb-2 flex shrink-0 items-center justify-center gap-2">
                  <i
                    class="fas fa-grip-vertical balance-drag-handle text-gray-400 hover:text-gray-600 dark:text-white/65 dark:hover:text-white cursor-move"
                  />
                  <span
                    class="inline-flex shrink-0 items-center justify-center"
                  >
                    <button
                      type="button"
                      class="cursor-pointer transition-opacity hover:opacity-80"
                      :title="$t('cashRegisterColorPickHint')"
                      @click.stop="openColorModal(card)"
                    >
                      <CashRegisterIconBadge
                        :cash-register="card"
                        size="lg"
                      />
                    </button>
                  </span>
                  <span class="flex min-w-0 flex-1 items-center justify-center gap-2">
                    <span class="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {{ $t('clientDebts') }}
                    </span>
                    <CurrencySelect
                      v-if="currencies.length"
                      :model-value="clientBalancesEffectiveCurrencyId"
                      :currencies="currencies"
                      :default-currency-id="defaultCurrencyId"
                      inline
                      @update:model-value="(id) => $store.dispatch('setClientBalancesCurrencyId', id)"
                    />
                  </span>
                </div>
                <span
                  v-if="card.visible"
                  class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-[color-mix(in_srgb,var(--color-info)_40%,transparent)] dark:hover:bg-white/25"
                  @mousedown.prevent="startResize($event, index)"
                />
                <div class="grid min-h-0 flex-1 grid-cols-2 content-center gap-2">
                  <div
                    v-for="debt in displayDebts"
                    :key="debt.id"
                    class="balance-item debt-item text-center"
                  >
                    <div class="balance-header flex items-center justify-center gap-1 mb-1">
                      <span class="balance-title">{{ debt.title }}</span>
                      <i :class="debt.iconClass" />
                    </div>
                    <div
                      class="balance-value"
                      :class="debt.valueClass"
                    >
                      <div
                        class="balance-amount"
                        :title="debt.value"
                      >
                        {{ debt.value }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </draggable>
        </div>
      </div>
      <div
        v-else
        key="loader"
      >
        <BalanceCardsSkeleton />
      </div>
    </transition>
    <CashRegisterColorModal
      :show="colorModalOpen"
      :cash-register="colorModalCard"
      @close="closeColorModal"
    />
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import CashRegisterController from '@/api/CashRegisterController';
import ClientController from '@/api/ClientController';
import BalanceCardsSkeleton from '@/views/components/app/BalanceCardsSkeleton.vue';
import CashRegisterColorModal from '@/views/components/app/CashRegisterColorModal.vue';
import CashRegisterIconBadge from '@/views/components/app/forms/CashRegisterIconBadge.vue';
import CurrencySelect from '@/views/components/app/forms/CurrencySelect.vue';
import { getCashRegisterTypeLabel } from '@/utils/cashRegisterUtils';
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
    'Итого': 'grandTotal',
    'Главная касса': 'mainCashRegister'
};

const DEFAULT_CARD_SIZE = {
    cash_register: 400,
    client_debts: 360,
};

const getDefaultCardSize = (type) => DEFAULT_CARD_SIZE[type] ?? DEFAULT_CARD_SIZE.cash_register;

export default {
    components: {
        draggable: VueDraggableNext,
        BalanceCardsSkeleton,
        CashRegisterColorModal,
        CashRegisterIconBadge,
        CurrencySelect
    },
    props: {
        cashRegisterId: { type: String, default: '' },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        dateFilter: { type: String, default: 'all_time' },
        transactionTypeFilter: { type: String, default: '' },
        sourceFilter: { type: String, default: '' },
    },
    data() {
        return {
            data: null,
            loading: false,
            settlementsByCurrency: [],
            cardSizes: {},
            sortedBalanceCards: [],
            resizing: false,
            resizingCard: null,
            startX: 0,
            startWidth: 0,
            rowsCount: 1,
            colorModalOpen: false,
            colorModalCard: null,
        };
    },
    computed: {
        canViewCashBalance() {
            return this.$store.getters.hasPermission('settings_cash_balance_view');
        },
        canViewClientBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view');
        },
        currencies() {
            return this.$store.state.currencies || [];
        },
        clientDebts() {
            const currencyId = this.clientBalancesEffectiveCurrencyId;
            if (currencyId == null) {
                return { positive: 0, negative: 0 };
            }
            const row = (this.settlementsByCurrency || []).find(
                (r) => r.currency_id === currencyId
            );
            if (!row) {
                return { positive: 0, negative: 0 };
            }
            return {
                positive: parseFloat(row.they_owe_us) || 0,
                negative: parseFloat(row.we_owe_them) || 0
            };
        },
        displayDebts() {
            return [
                {
                    id: 'oweUs',
                    title: this.$t('oweUs'),
                    iconClass: 'fas fa-arrow-trend-up balance-icon-income',
                    valueClass: 'balance-value-income',
                    value: this.formatBalanceValue({ value: this.clientDebts.positive })
                },
                {
                    id: 'weOwe',
                    title: this.$t('weOwe'),
                    iconClass: 'fas fa-arrow-trend-down balance-icon-outcome',
                    valueClass: 'balance-value-outcome',
                    value: this.formatBalanceValue({ value: Math.abs(this.clientDebts.negative) })
                }
            ];
        },
        defaultCurrencyId() {
            const list = this.$store.state.currencies || [];
            const c = list.find(x => x.isDefault === true);
            return c ? c.id : (list[0]?.id ?? null);
        },
        clientBalancesEffectiveCurrencyId() {
            const stored = this.$store.state.clientBalancesCurrencyId;
            return stored != null ? stored : this.defaultCurrencyId;
        },
        allBalanceCards() {
            const cards = [];

            if (this.canViewCashBalance && this.data) {
                this.data.forEach(item => {
                    cards.push({
                        id: `cash_${item.id}`,
                        type: 'cash_register',
                        name: item.name,
                        displayName: item.displayName,
                        currencyCode: item.currencyCode,
                        balance: item.balance,
                        cashRegisterId: item.id,
                        isCash: item.isCash,
                        icon: item.icon,
                        color: item.color
                    });
                });
            }

            if (this.canViewClientBalance) {
                cards.push({
                    id: 'client_debts',
                    type: 'client_debts',
                    icon: 'fas fa-scale-balanced',
                    color: '#3571A4',
                    colorPreferenceKey: 'client_debts'
                });
            }

            return cards;
        },
    },
    watch: {
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
                this.settlementsByCurrency = [];
                if (savedData) {
                    if (savedData.cards) {
                        savedData.cards.forEach(card => {
                            this.cardSizes[card.id] = card.size || getDefaultCardSize(card.id === 'client_debts' ? 'client_debts' : 'cash_register');
                        });
                    }
                    if (savedData.rowsCount !== undefined) {
                        this.rowsCount = savedData.rowsCount;
                    }
                }
                this.updateSortedBalanceCards();
            }
        },
    },
    mounted() {
        const savedData = this.getSavedData();
        if (savedData) {
            if (savedData.cards) {
                savedData.cards.forEach(card => {
                    const type = card.id === 'client_debts' ? 'client_debts' : 'cash_register';
                    this.cardSizes[card.id] = card.size || getDefaultCardSize(type);
                });
            }
            if (savedData.rowsCount !== undefined) {
                this.rowsCount = savedData.rowsCount;
            }
        }
        this.updateSortedBalanceCards();
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.stopResize);
    },
    methods: {
        updateSortedBalanceCards() {
            const savedData = this.getSavedData();
            const allCards = this.allBalanceCards;

            const applySize = (card) => {
                const defaultSize = getDefaultCardSize(card.type);
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
                    size: getDefaultCardSize(card.type),
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
            return this.$formatNumber(balance.value, true);
        },
        isClickable(type) {
            return type === 'income' || type === 'outcome';
        },
        handleBalanceClick(cashRegister, balance) {
            this.$emit('balance-click', {
                cashRegisterId: String(cashRegister.cashRegisterId),
                transactionType: balance.type
            });
        },
        cashRegisterCardDarkLeftBorderClass(card) {
            const rows = card.balance;
            if (!Array.isArray(rows)) {
                return 'dark:border-l-[var(--nav-accent)]';
            }
            const totalRow = rows.find((b) => b.title === 'Итого' || b.type === 'default' || b.type === 'grandTotal');
            if (!totalRow || totalRow.value === undefined || totalRow.value === null) {
                return 'dark:border-l-[var(--nav-accent)]';
            }
            const v = Number(totalRow.value);
            if (!Number.isFinite(v)) {
                return 'dark:border-l-[var(--nav-accent)]';
            }
            if (v > 0) {
                return 'dark:border-l-[var(--color-success)]';
            }
            if (v < 0) {
                return 'dark:border-l-[var(--color-danger)]';
            }
            return 'dark:border-l-[var(--nav-accent)]';
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
        translateName(card) {
            if (card.name === 'Главная касса') {
                return this.$t('mainCashRegister');
            }
            return card.displayName || card.name;
        },
        cashRegisterTypeLabel(card) {
            return getCashRegisterTypeLabel(card.isCash, this.$t);
        },
        cashRegisterTitle(card) {
            const currency = typeof card.currencyCode === 'string' ? card.currencyCode.trim() : '';
            return currency ? `${this.cashRegisterTypeLabel(card)} (${currency})` : this.cashRegisterTypeLabel(card);
        },
        cashRegisterSubtitle(card) {
            return this.translateName(card);
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
        buildParams() {
            const params = {};
            if (this.transactionTypeFilter) params.transactionType = this.transactionTypeFilter;
            if (this.sourceFilter) params.source = this.sourceFilter;
            return params;
        },
        async loadClientDebts() {
            if (!this.canViewClientBalance) {
                this.settlementsByCurrency = [];
                return;
            }

            try {
                this.settlementsByCurrency = await ClientController.getSettlementsSummary();
            } catch (error) {
                console.error('Ошибка при загрузке сводки взаиморасчётов:', error);
                this.settlementsByCurrency = [];
            }
        },
        getLocalStorageKey() {
            return this.$storageUi.transactionsBalanceCardsLayoutKey(
                this.$store.state.currentCompany?.id
            );
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
            } catch {
                return null;
            }
        },
        saveData() {
            try {
                const data = {
                    order: this.sortedBalanceCards.map(card => card.id),
                    cards: this.sortedBalanceCards.map(card => {
                        const defaultSize = getDefaultCardSize(card.type);
                        return {
                            id: card.id,
                            size: this.cardSizes[card.id] || card.size || defaultSize,
                            visible: card.visible
                        };
                    }),
                    rowsCount: this.rowsCount
                };
                localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(data));
            } catch {
                return;
            }
        },
        handleBalanceReorder() {
            this.saveData();
        },
        toggleRowsCount() {
            this.rowsCount = this.rowsCount === 1 ? 2 : 1;
            this.saveData();
        },
        openColorModal(card) {
            this.colorModalCard = card;
            this.colorModalOpen = true;
        },
        closeColorModal() {
            this.colorModalOpen = false;
            this.colorModalCard = null;
        },
        getCardStyle(card) {
            const defaultSize = getDefaultCardSize(card.type);
            const size = Math.max(this.cardSizes[card.id] || card.size || defaultSize, defaultSize);
            return {
                width: `${size}px`,
                minWidth: `${size}px`,
            };
        },
        startResize(e, index) {
            e.preventDefault();
            e.stopPropagation();
            this.resizing = true;
            this.resizingCard = index;
            this.startX = e.clientX;
            const cardElement = e.target.closest('.balance-card-wrapper');
            const cardEl = cardElement?.querySelector('.transactions-balance-card');
            this.startWidth = cardEl?.offsetWidth || 200;
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
        async fetchItems(silent = false) {
            if (!this.canViewCashBalance && !this.canViewClientBalance) {
                this.data = [];
                this.settlementsByCurrency = [];
                this.updateSortedBalanceCards();
                return;
            }

            if (!silent) {
                this.loading = true;
            }
            try {
                if (this.canViewCashBalance) {
                    const { start, end } = this.getDateRange();
                    const cashIds = this.cashRegisterId ? [this.cashRegisterId] : [];
                    const params = this.buildParams();
                    this.data = await CashRegisterController.getCashBalance(cashIds, start, end, params);
                } else {
                    this.data = [];
                }
                await this.loadClientDebts();
                this.updateSortedBalanceCards();
            } finally {
                this.loading = false;
            }
        },
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
    align-self: stretch;
}

.transactions-balance-card {
    box-sizing: border-box;
}

.cash-register-icon {
    line-height: 1;
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

html.dark .resize-handle:hover {
    background-color: rgba(255, 255, 255, 0.25) !important;
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
    background-color: rgba(92, 184, 92, 0.12);
}

.hover-outcome:hover {
    background-color: rgba(238, 79, 71, 0.12);
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

</style>
