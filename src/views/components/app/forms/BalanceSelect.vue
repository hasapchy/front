<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-[var(--input-bg)] p-2 text-left text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[var(--input-border)] dark:text-[var(--text-primary)] dark:disabled:bg-[var(--surface-muted)]"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span
        v-if="selectedBalance"
        class="flex min-w-0 flex-1 items-center gap-2"
      >
        <span
          :class="balanceColorClass(selectedBalance.balance)"
          class="min-w-0 truncate"
        >
          {{ formatBalance(selectedBalance.balance) }} {{ selectedBalance.currency?.symbol }}
        </span>
        <span class="inline-flex shrink-0 items-center gap-0.5">
          <i
            v-if="selectedBalance.isDefault"
            class="fas fa-star shrink-0 text-[10px] text-amber-500"
            :title="$t('default')"
          />
          <i
            :class="balanceTypeIconClass(selectedBalance)"
            class="text-xs"
          />
        </span>
      </span>
      <span
        v-else
        class="min-w-0 flex-1 truncate text-gray-500 dark:text-[var(--text-secondary)]"
      >
        {{ placeholder || $t('selectBalance') }}
      </span>
      <i
        class="fas fa-chevron-down text-[10px] opacity-70 shrink-0"
        :class="open ? 'rotate-180' : ''"
      />
    </button>
    <input
      v-if="required"
      :value="selectedIdString"
      required
      class="absolute opacity-0 pointer-events-none h-0 w-0"
      tabindex="-1"
    >
    <transition name="appear">
      <ul
        v-show="open"
        class="absolute left-0 top-full z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-[var(--surface-elevated)] py-1 shadow-lg dark:border-[var(--border-subtle)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
      >
        <li
          v-for="balance in balances"
          :key="balance.id"
          class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
          @click="selectBalance(balance)"
        >
          <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
            <span :class="balanceColorClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
            <span>{{ balance.currency?.symbol }}</span>
          </span>
          <span class="inline-flex shrink-0 items-center gap-0.5">
            <i
              v-if="balance.isDefault"
              class="fas fa-star shrink-0 text-[10px] text-amber-500"
              :title="$t('default')"
            />
            <i
              :class="balanceTypeIconClass(balance)"
              class="text-xs"
            />
          </span>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
export default {
    name: 'BalanceSelect',
    props: {
        modelValue: { type: [String, Number, null], default: null },
        balances: { type: Array, default: () => [] },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
    },
    emits: ['update:modelValue', 'change'],
    data() {
        return {
            open: false,
        };
    },
    computed: {
        selectedBalance() {
            if (this.modelValue == null || this.modelValue === '') {
                return null;
            }
            return this.balances.find((b) => Number(b.id) === Number(this.modelValue)) || null;
        },
        selectedIdString() {
            if (this.modelValue == null) {
                return '';
            }
            return String(this.modelValue);
        },
    },
    mounted() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
    },
    methods: {
        toggleOpen() {
            if (this.disabled) {
                return;
            }
            this.open = !this.open;
        },
        handleOutsideClick(event) {
            if (!this.$refs.root?.contains(event.target)) {
                this.open = false;
            }
        },
        selectBalance(balance) {
            const nextValue = balance?.id ?? null;
            this.$emit('update:modelValue', nextValue);
            this.$emit('change', nextValue);
            this.open = false;
        },
        formatBalance(balance) {
            return this.$formatNumber ? this.$formatNumber(balance, null, true) : String(balance ?? 0);
        },
        balanceTypeIconClass(balance) {
            return Number(balance?.type) === 1 ? 'fas fa-receipt text-emerald-600' : 'fas fa-cash-register text-indigo-600';
        },
        balanceColorClass(value) {
            const v = value == null ? 0 : Number(value);
            return v === 0 ? 'text-[#337AB7]' : v > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]';
        },
    },
};
</script>
