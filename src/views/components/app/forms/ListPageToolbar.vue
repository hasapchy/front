<template>
  <div class="mb-4 flex flex-col gap-2">
    <TableControlsBar
      v-bind="toolbarBind"
      class="!mb-0"
      :reset-columns="resetColumns"
      :columns="columns"
      :toggle-visible="toggleVisible"
      :log="log"
    >
      <template #left>
        <slot name="actions" />
        <slot name="presets-filters" />
        <slot name="extras" />
      </template>
      <template #right-before>
        <slot name="right-before" />
      </template>
      <template #right-after>
        <slot name="right-after" />
      </template>
      <template #gear>
        <slot
          name="gear"
          :reset-columns="resetColumns"
          :columns="columns"
          :toggle-visible="toggleVisible"
          :log="log"
        />
      </template>
    </TableControlsBar>
  </div>
</template>

<script>
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';

export default {
  name: 'ListPageToolbar',
  components: { TableControlsBar },
  props: {
    toolbarBind: {
      type: Object,
      default: () => ({}),
    },
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
