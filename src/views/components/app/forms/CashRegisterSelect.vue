<template>
  <AppFieldPicker
    ref="root"
    :has-selection="false"
    :searchable="false"
    :show-label="showLabel"
    :label="$t('cashRegister')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="false"
    :dropdown-open="open"
  >
    <template #trigger>
      <button
        type="button"
        class="custom-dropdown-button gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click="toggleOpen"
      >
        <span
          v-if="selectedCashRegister"
          class="flex min-w-0 flex-1 items-center gap-2"
        >
          <CashRegisterIconBadge
            :cash-register="selectedCashRegister"
            size="sm"
          />
          <span class="min-w-0 truncate">
            {{ getLabel(selectedCashRegister) }}
          </span>
        </span>
        <span
          v-else
          class="min-w-0 flex-1 truncate text-[#6b7280] dark:text-[var(--text-secondary)]"
        >
          {{ placeholder || $t('selectCashRegister') }}
        </span>
        <i
          class="fas fa-chevron-down shrink-0 text-[10px] opacity-70"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
      <input
        v-if="required"
        :value="selectedIdString"
        required
        class="pointer-events-none absolute h-0 w-0 opacity-0"
        tabindex="-1"
      >
    </template>
    <template #dropdown>
      <AppFieldPickerOption
        v-for="cash in cashRegisters"
        :key="cash.id"
        stacked
        :disabled="isExcluded(cash.id)"
        @select="selectCash(cash)"
      >
        <template #leading>
          <CashRegisterIconBadge
            :cash-register="cash"
            size="sm"
          />
        </template>
        <div class="app-field-picker__option-stack">
          <span class="app-field-picker__option-primary">{{ getPrimaryLabel(cash) }}</span>
          <span
            v-if="getSecondaryLabel(cash)"
            class="app-field-picker__option-sub"
          >{{ getSecondaryLabel(cash) }}</span>
        </div>
      </AppFieldPickerOption>
    </template>
  </AppFieldPicker>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';
import CashRegisterIconBadge from '@/views/components/app/forms/CashRegisterIconBadge.vue';
import {
    getCashRegisterSelectLabel,
    getCashRegisterSelectPrimaryLabel,
    getCashRegisterSelectSecondaryLabel,
    normalizeCashRegisterModelValue,
} from '@/utils/cashRegisterUtils';

export default {
    name: 'CashRegisterSelect',
    components: { AppFieldPicker, AppFieldPickerOption, CashRegisterIconBadge },
    props: {
        modelValue: { type: [String, Number, null], default: null },
        cashRegisters: { type: Array, default: () => [] },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
        showLabel: { type: Boolean, default: true },
        excludeIds: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            open: false,
        };
    },
    computed: {
        selectedCashRegister() {
            if (this.modelValue == null || this.modelValue === '') {
                return null;
            }
            return this.cashRegisters.find((c) => Number(c.id) === Number(this.modelValue)) || null;
        },
        selectedIdString() {
            if (this.modelValue == null || this.modelValue === '') {
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
        getLabel(cash) {
            return getCashRegisterSelectLabel(cash, this.$t);
        },
        getPrimaryLabel(cash) {
            return getCashRegisterSelectPrimaryLabel(cash, this.$t);
        },
        getSecondaryLabel(cash) {
            return getCashRegisterSelectSecondaryLabel(cash);
        },
        isExcluded(id) {
            return this.excludeIds.some((excludedId) => Number(excludedId) === Number(id));
        },
        toggleOpen() {
            if (this.disabled) {
                return;
            }
            this.open = !this.open;
        },
        handleOutsideClick(event) {
            const root = this.$refs.root?.$el ?? this.$refs.root;
            if (!root?.contains(event.target)) {
                this.open = false;
            }
        },
        selectCash(cash) {
            if (cash && this.isExcluded(cash.id)) {
                return;
            }
            this.$emit('update:modelValue', normalizeCashRegisterModelValue(cash?.id));
            this.open = false;
        },
    },
};
</script>
