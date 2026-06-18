<template>
  <TableFilterButton
    v-if="cardFields.length"
    :on-reset="onReset"
  >
    <div
      v-if="dateFields.length"
      class="mb-2 border-b border-gray-200 pb-2 dark:border-[var(--border-subtle)]"
    >
      <TableDateDisplayModeHint />
      <div
        v-for="field in dateFields"
        :key="`card-date-mode-${field.name}`"
        class="mb-1 rounded bg-gray-50 px-2 py-1.5 dark:bg-[var(--surface-muted)]"
      >
        <div class="flex w-full items-center gap-1">
          <button
            type="button"
            class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
            :class="resolveDateMode(field) === 'date'
              ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
              : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
            @click.stop="$emit('toggle', { action: 'setDateDisplayMode', name: field.name, value: 'date' })"
          >
            {{ $t('dateOnly') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
            :class="resolveDateMode(field) === 'datetime'
              ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
              : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
            @click.stop="$emit('toggle', { action: 'setDateDisplayMode', name: field.name, value: 'datetime' })"
          >
            {{ $t('dateTime') }}
          </button>
        </div>
      </div>
    </div>
    <BalanceCardsRowsSection
      v-if="resolvedShowBalanceCardsRows"
      :model-value="balanceCardsRows"
      @update:model-value="$emit('balance-cards-rows-change', $event)"
    />
    <div
      v-if="resolvedShowCardsPerRow"
      class="mb-2 border-b border-gray-200 px-2 pb-2 dark:border-[var(--border-subtle)]"
    >
      <div class="mb-2 text-xs text-[var(--text-secondary)]">
        {{ $t('cardsPerRow') }}
      </div>
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="option in gridColumnOptions"
          :key="option"
          type="button"
          class="rounded border px-2 py-1 text-sm font-medium transition select-none"
          :class="option === selectedGridColumns
            ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
            : 'border-gray-200 bg-white text-[var(--text-primary)] hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:hover:bg-[var(--surface-elevated)]'"
          @click.stop="selectGridColumns(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>
    <ul>
      <li
        v-for="element in cardFields"
        :key="element.name"
        class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded cursor-pointer"
        @click="$emit('toggle', { action: 'toggleVisibility', name: element.name })"
      >
        <div class="space-x-2 flex flex-row justify-between w-full select-none items-center">
          <div class="min-w-0">
            <i
              class="text-sm mr-2 text-[var(--color-info)]"
              :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
            />
            {{ fieldLabel(element) }}
          </div>
        </div>
      </li>
    </ul>
  </TableFilterButton>
</template>

<script>
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableDateDisplayModeHint from '@/views/components/app/forms/TableDateDisplayModeHint.vue';
import BalanceCardsRowsSection from '@/views/components/app/forms/BalanceCardsRowsSection.vue';
import { unref } from 'vue';
import { CARD_GRID_COLUMN_OPTIONS } from '@/utils/cardGridUtils';
import { normalizeDateDisplayMode } from '@/utils/dateUtils';

export default {
    name: 'CardFieldsGearMenu',
    components: { TableFilterButton, TableDateDisplayModeHint, BalanceCardsRowsSection },
    inject: {
        cardGearShowCardsPerRow: {
            from: 'cardGearShowCardsPerRow',
            default: false,
        },
    },
    props: {
        cardFields: { type: Array, default: () => [] },
        onReset: { type: Function, default: null },
        showCardsPerRow: {
            type: Boolean,
            default: null,
        },
        showBalanceCardsRows: {
            type: Boolean,
            default: null,
        },
        balanceCardsRows: {
            type: Number,
            default: 1,
        },
    },
    emits: ['toggle', 'balance-cards-rows-change'],
    computed: {
        resolvedShowCardsPerRow() {
            if (this.showCardsPerRow !== null) {
                return this.showCardsPerRow;
            }
            return unref(this.cardGearShowCardsPerRow);
        },
        resolvedShowBalanceCardsRows() {
            return this.showBalanceCardsRows === true;
        },
        gridColumnOptions() {
            return CARD_GRID_COLUMN_OPTIONS;
        },
        selectedGridColumns() {
            return this.$store.getters.cardGridColumns;
        },
        dateFields() {
            return (this.cardFields || []).filter((field) => this.isDateField(field));
        },
    },
    methods: {
        isDateField(element) {
            return element?.type === 'date' || element?.type === 'datetime';
        },
        resolveDateMode(element) {
            return normalizeDateDisplayMode(element?.type, element?.dateDisplayMode);
        },
        fieldLabel(element) {
            const key = element?.label || element?.name;
            if (!key) {
                return '';
            }
            return this.$te(key) ? this.$t(key) : key;
        },
        selectGridColumns(columns) {
            this.$store.dispatch('setCardGridColumns', {
                companyId: this.$store.state.currentCompany?.id,
                columns,
            });
        },
    },
};
</script>
