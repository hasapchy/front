<template>
  <div
    ref="root"
    class="currency-select"
    :class="{ 'currency-select--inline': inline }"
  >
    <div
      v-if="useToggle"
      class="currency-select__toggle"
      role="group"
      :aria-label="$t('currency')"
    >
      <button
        v-for="currency in currencies"
        :key="currency.id"
        type="button"
        class="currency-select__toggle-btn"
        :class="{ 'currency-select__toggle-btn--active': isSelected(currency.id) }"
        :disabled="disabled"
        :title="currency.name"
        @click="selectCurrency(currency.id)"
      >
        {{ currency.symbol }}
      </button>
    </div>
    <template v-else>
      <button
        type="button"
        class="custom-dropdown-button gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        :class="{ 'currency-select__dropdown-trigger': inline }"
        :disabled="disabled"
        @click="toggleOpen"
      >
        <span
          v-if="selectedCurrency"
          class="min-w-0 flex-1 truncate font-semibold"
        >
          {{ selectedCurrency.symbol }}
        </span>
        <span
          v-else
          class="min-w-0 flex-1 truncate text-gray-500 dark:text-[var(--text-secondary)]"
        >
          {{ placeholder || $t('currency') }}
        </span>
        <i
          class="fas fa-chevron-down shrink-0 text-[10px] opacity-70"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
      <transition name="appear">
        <ul
          v-show="open"
          class="currency-select__dropdown absolute left-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-[var(--surface-elevated)] py-1 shadow-lg dark:border-[var(--border-subtle)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
          :class="inline ? 'min-w-[4.5rem]' : 'w-full'"
        >
          <li
            v-for="currency in currencies"
            :key="currency.id"
            class="flex cursor-pointer items-center px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
            :class="{ 'bg-gray-50 dark:bg-[var(--surface-muted)]': isSelected(currency.id) }"
            :title="currency.name"
            @click="selectCurrency(currency.id)"
          >
            {{ currency.symbol }}
          </li>
        </ul>
      </transition>
    </template>
  </div>
</template>

<script>
export default {
    name: 'CurrencySelect',
    props: {
        modelValue: { type: [String, Number, null], default: null },
        currencies: { type: Array, default: () => [] },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        inline: { type: Boolean, default: false },
        toggleMaxCount: { type: Number, default: 3 },
        defaultCurrencyId: { type: [String, Number, null], default: null },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            open: false,
        };
    },
    computed: {
        useToggle() {
            const count = this.currencies?.length ?? 0;
            return count > 0 && count <= this.toggleMaxCount;
        },
        selectedCurrency() {
            if (this.modelValue == null || this.modelValue === '') {
                return null;
            }
            return this.currencies.find((c) => Number(c.id) === Number(this.modelValue)) || null;
        },
    },
    mounted() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
    },
    methods: {
        isSelected(id) {
            return Number(this.modelValue) === Number(id);
        },
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
        selectCurrency(id) {
            const numId = id == null ? null : Number(id);
            const nextValue =
                this.defaultCurrencyId != null && numId === Number(this.defaultCurrencyId)
                    ? null
                    : numId;
            this.$emit('update:modelValue', nextValue);
            this.open = false;
        },
    },
};
</script>

<style scoped>
.currency-select {
    position: relative;
    width: 100%;
}

.currency-select--inline {
    width: auto;
}

.currency-select__toggle {
    display: inline-flex;
    overflow: hidden;
    border-radius: 0.375rem;
    border: 2px solid #9ca3af;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.currency-select__toggle-btn {
    min-width: 2rem;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.25;
    color: #374151;
    background-color: transparent;
    border: none;
    border-right: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.currency-select__toggle-btn:last-child {
    border-right: none;
}

.currency-select__toggle-btn:hover:not(:disabled) {
    background-color: #f3f4f6;
}

.currency-select__toggle-btn--active {
    color: #ffffff;
    background-color: var(--label-accent, #3571a4);
}

.currency-select__toggle-btn--active:hover:not(:disabled) {
    background-color: var(--label-accent, #3571a4);
}

.currency-select__toggle-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.currency-select__dropdown-trigger {
    width: auto;
    min-width: 3.5rem;
    padding: 4px 8px;
}

html.dark .currency-select__toggle {
    border-color: rgba(255, 255, 255, 0.15);
    background-color: var(--surface-elevated);
}

html.dark .currency-select__toggle-btn {
    color: var(--text-primary);
    border-right-color: rgba(255, 255, 255, 0.1);
}

html.dark .currency-select__toggle-btn:hover:not(:disabled) {
    background-color: var(--surface-muted);
}

html.dark .currency-select__toggle-btn--active {
    color: #ffffff;
    background-color: var(--nav-accent, var(--label-accent));
}

.appear-enter-active,
.appear-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.appear-enter-from,
.appear-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.appear-enter-to,
.appear-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
