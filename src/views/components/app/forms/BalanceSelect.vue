<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      type="button"
      class="w-full p-2 border rounded bg-white text-left flex items-center justify-between gap-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span
        v-if="selectedBalance"
        class="truncate"
      >
        <span :class="balanceColorClass(selectedBalance.balance)">
          {{ formatBalance(selectedBalance.balance) }} {{ selectedBalance.currency?.symbol }}
        </span>
        <i
          :class="balanceTypeIconClass(selectedBalance)"
          class="text-xs ml-1"
        />
        <i
          v-if="selectedBalance.isDefault"
          class="fas fa-star text-amber-500 ml-1"
          :title="$t('default')"
        />
      </span>
      <span
        v-else
        class="text-gray-500 truncate"
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
        class="absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 max-h-56 overflow-y-auto"
      >
        <li
          v-for="balance in balances"
          :key="balance.id"
          class="px-3 py-2 cursor-pointer text-sm hover:bg-gray-50"
          @click="selectBalance(balance)"
        >
          <span :class="balanceColorClass(balance.balance)">
            {{ formatBalance(balance.balance) }} {{ balance.currency?.symbol }}
          </span>
          <i
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
