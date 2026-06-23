<template>
  <TableFilterButton
    v-if="columns && columns.length"
    :on-reset="resetColumns"
  >
    <slot />
    <ul>
      <draggable
        v-if="columns.length"
        class="dragArea list-group w-full"
        :list="columns"
        @change="log"
      >
        <li
          v-for="(element, index) in columns"
          v-show="element.name !== 'select'"
          :key="element.name"
          class="flex items-center rounded p-2 hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
          @click="toggleVisible(index)"
        >
          <div class="flex w-full select-none flex-row justify-between space-x-2">
            <div>
              <i
                class="mr-2 text-sm text-[var(--color-info)]"
                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
              />
              {{ $te(element.label) ? $t(element.label) : element.label }}
            </div>
            <div>
              <i class="fas fa-grip-vertical cursor-grab text-sm text-gray-300" />
            </div>
          </div>
        </li>
      </draggable>
    </ul>
  </TableFilterButton>
</template>

<script>
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';

export default {
    name: 'TableColumnsGearMenu',
    components: {
        TableFilterButton,
        draggable: VueDraggableNext,
    },
    props: {
        resetColumns: {
            type: Function,
            default: null,
        },
        columns: {
            type: Array,
            default: () => [],
        },
        toggleVisible: {
            type: Function,
            default: null,
        },
        log: {
            type: Function,
            default: null,
        },
    },
};
</script>
