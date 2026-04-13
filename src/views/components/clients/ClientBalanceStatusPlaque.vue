<template>
  <div class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-[var(--surface-muted)]">
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <i class="fas fa-wallet shrink-0 text-blue-500 dark:text-[var(--label-accent)]" />
        <span class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">{{ statusText }}:</span>
      </div>
      <span
        v-if="showBalanceDropdown"
        class="relative z-40 inline-block balance-dropdown-wrap"
      >
        <button
          type="button"
          :class="['text-lg', 'font-bold', 'cursor-pointer', 'flex', 'items-center', 'gap-1', 'pr-1', 'border-0', 'bg-transparent', 'hover:opacity-80', balanceColorClass]"
          @mousedown.prevent="showDropdown = !showDropdown"
        >
          {{ displayText }}
          <i
            v-if="selectedBalanceTypeIconClass"
            :class="selectedBalanceTypeIconClass"
            class="text-xs"
          />
          <i class="fas fa-chevron-down text-[10px] opacity-70" />
        </button>
        <transition name="appear">
          <ul
            v-show="showDropdown"
            class="absolute right-0 top-full z-40 mt-1 max-h-40 min-w-[120px] w-max max-w-[min(100vw-1.5rem,20rem)] overflow-y-auto rounded-lg border border-gray-200 bg-[var(--surface-elevated)] py-1 shadow-lg dark:border-[var(--border-subtle)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
          >
            <li
              v-for="balance in balances"
              :key="balance.id"
              class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="onSelectBalance(balance)"
            >
              <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
                <span :class="balanceItemClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
                <span>{{ balance.currency?.symbol }}</span>
              </span>
              <span class="inline-flex shrink-0 items-center gap-0.5">
                <i
                  v-if="balance.isDefault"
                  class="fas fa-star shrink-0 text-[10px] text-amber-500"
                  :title="$t('default')"
                />
                <i
                  v-if="balanceTypeIconClass(balance)"
                  :class="balanceTypeIconClass(balance)"
                  class="text-xs"
                />
              </span>
            </li>
          </ul>
        </transition>
      </span>
      <b
        v-else
        :class="['text-lg', balanceColorClass]"
      >{{ displayText }}
        <i
          v-if="selectedBalanceTypeIconClass"
          :class="selectedBalanceTypeIconClass"
          class="text-xs ml-1"
        />
      </b>
    </div>
  </div>
</template>

<script>
export default {
    name: 'ClientBalanceStatusPlaque',
    props: {
        statusText: { type: String, default: '' },
        totalBalance: { type: [Number, String], default: 0 },
        currencySymbol: { type: String, default: '' },
        balances: { type: Array, default: () => [] },
    },
    emits: ['selectBalance'],
    data() {
        return {
            showDropdown: false,
        };
    },
    computed: {
        balanceColorClass() {
            const v = Number(this.totalBalance) || 0;
            return v === 0 ? 'text-[#337AB7]' : v > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]';
        },
        displayText() {
            const n = Number(this.totalBalance) || 0;
            const formatted = this.$formatNumber ? this.$formatNumber(n, null, true) : String(n);
            return `${formatted} ${this.currencySymbol}`.trim();
        },
        showBalanceDropdown() {
            return this.balances?.length > 1;
        },
        selectedBalanceTypeIconClass() {
            const selected = this.balances.find((b) => Number(b.balance) === Number(this.totalBalance))
                || this.balances.find((b) => b.isDefault)
                || this.balances[0];
            return this.balanceTypeIconClass(selected);
        },
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        formatBalance(balance) {
            return this.$formatNumber ? this.$formatNumber(balance, null, true) : String(balance ?? 0);
        },
        balanceItemClass(value) {
            const v = Number(value) || 0;
            return v === 0 ? 'text-[#337AB7]' : v > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]';
        },
        balanceTypeIconClass(balance) {
            if (!balance) {
                return '';
            }
            return Number(balance.type) === 1 ? 'fas fa-receipt text-emerald-600' : 'fas fa-cash-register text-indigo-600';
        },
        onSelectBalance(balance) {
            this.showDropdown = false;
            this.$emit('selectBalance', balance);
        },
        handleClickOutside(event) {
            if (!event.target.closest('.balance-dropdown-wrap')) {
                this.showDropdown = false;
            }
        },
    },
};
</script>
