<template>
  <TableFilterButton
    v-if="columns && columns.length"
    :on-reset="resetColumns"
  >
    <slot name="prepend" />
    <ul>
      <draggable
        v-if="columns.length"
        class="dragArea list-group w-full"
        :list="columns"
        item-key="name"
        handle=".column-gear-drag-handle"
        @change="onColumnsChange"
      >
        <li
          v-for="(element, index) in columns"
          v-show="element.name !== 'select'"
          :key="element.name"
          class="flex items-center rounded p-2 text-gray-800 hover:bg-gray-100 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
          @click="toggleVisible(index)"
        >
          <div class="flex w-full select-none flex-row items-center justify-between space-x-2">
            <div class="min-w-0">
              <i
                class="mr-2 text-sm text-[var(--color-info)] dark:text-[var(--label-accent)]"
                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
              />
              {{ resolveLabel(element.label) }}
            </div>
            <div
              class="flex items-center gap-1"
              @click.stop
            >
              <i class="column-gear-drag-handle fas fa-grip-vertical cursor-grab text-sm text-gray-300 dark:text-[#8d98a6]" />
            </div>
          </div>
        </li>
      </draggable>
    </ul>
  </TableFilterButton>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';

export default {
    name: 'TableColumnsGearMenu',
    components: {
        TableFilterButton,
        draggable: VueDraggableNext,
    },
    props: {
        columns: {
            type: Array,
            default: () => [],
        },
        resetColumns: {
            type: Function,
            default: null,
        },
        toggleVisible: {
            type: Function,
            default: null,
        },
        onColumnsChange: {
            type: Function,
            default: null,
        },
        columnLabelFn: {
            type: Function,
            default: null,
        },
    },
    methods: {
        resolveLabel(label) {
            if (this.columnLabelFn) {
                return this.columnLabelFn(label);
            }
            if (this.$te(label)) {
                return this.$t(label);
            }
            return label;
        },
    },
};
</script>
