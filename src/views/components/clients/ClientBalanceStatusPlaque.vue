<template>
  <div class="mb-4 p-4 bg-gray-50 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fas fa-wallet text-blue-500" />
        <span class="text-sm text-gray-600">{{ statusText }}:</span>
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
            class="absolute right-0 top-full mt-1 min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40 max-h-40 overflow-y-auto"
          >
            <li
              v-for="balance in balances"
              :key="balance.id"
              class="px-3 py-2 cursor-pointer text-sm hover:bg-gray-50"
              @mousedown.prevent="onSelectBalance(balance)"
            >
              <span :class="balanceItemClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
              {{ balance.currency?.symbol  }}
              <i
                v-if="balanceTypeIconClass(balance)"
                :class="balanceTypeIconClass(balance)"
                class="text-xs ml-1"
              />
              <i
                v-if="balance.isDefault"
                class="fas fa-star text-amber-500 ml-1"
                :title="$t('default')"
              />
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
            return `${formatted} ${this.currencySymbol }`.trim();
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
