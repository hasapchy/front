<template>
  <div
    v-if="displayViewMode === 'table'"
    class="w-full"
  >
    <slot name="table" />
  </div>
  <div
    v-else-if="displayViewMode === 'cards'"
    :class="cardsRootClass || undefined"
  >
    <TableControlsBar v-bind="cardsToolbar">
      <template #left>
        <slot name="card-bar-left" />
      </template>
      <template #filters-desktop>
        <slot name="card-bar-filters-desktop" />
      </template>
      <template #right-before>
        <slot name="card-bar-right-before" />
      </template>
      <template #right-after>
        <slot name="card-bar-right-after" />
      </template>
      <template #gear>
        <slot name="card-bar-gear" />
      </template>
    </TableControlsBar>
    <slot name="cards" />
  </div>
</template>

<script>
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';

export default {
    name: 'CardListViewShell',
    components: { TableControlsBar },
    props: {
        displayViewMode: {
            type: String,
            required: true
        },
        cardsToolbar: {
            type: Object,
            default: () => ({})
        },
        cardsRootClass: {
            type: String,
            default: ''
        }
    }
};
</script>
