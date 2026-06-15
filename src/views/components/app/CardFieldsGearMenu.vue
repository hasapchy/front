<template>
  <TableFilterButton
    v-if="cardFields.length"
    :on-reset="onReset"
  >
    <div class="mb-2 border-b border-gray-200 px-2 pb-2 dark:border-[var(--border-subtle)]">
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
        @click="$emit('toggle', element.name)"
      >
        <div class="space-x-2 flex flex-row justify-between w-full select-none">
          <div>
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
import { CARD_GRID_COLUMN_OPTIONS } from '@/utils/cardGridUtils';

export default {
    name: 'CardFieldsGearMenu',
    components: { TableFilterButton },
    props: {
        cardFields: { type: Array, default: () => [] },
        onReset: { type: Function, default: null }
    },
    emits: ['toggle'],
    computed: {
        gridColumnOptions() {
            return CARD_GRID_COLUMN_OPTIONS;
        },
        selectedGridColumns() {
            return this.$store.getters.cardGridColumns;
        },
    },
    methods: {
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
