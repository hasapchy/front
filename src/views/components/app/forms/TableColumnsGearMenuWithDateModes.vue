<template>
  <TableColumnsGearMenu
    :reset-columns="resetColumns"
    :columns="columns"
    :toggle-visible="toggleVisible"
    :log="log"
  >
    <slot />
    <TableColumnDateModeSection
      :items="dateColumnsForSettings(columns)"
      :resolve-mode="resolveColumnDateMode"
      :show-column-label="showColumnLabel"
      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
    />
  </TableColumnsGearMenu>
</template>

<script>
import TableColumnsGearMenu from '@/views/components/app/forms/TableColumnsGearMenu.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';

export default {
    name: 'TableColumnsGearMenuWithDateModes',
    components: {
        TableColumnsGearMenu,
        TableColumnDateModeSection,
    },
    mixins: [tableColumnDateModeMixin],
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
        tableColumnsPersistKey: {
            type: String,
            default: '',
        },
        showColumnLabel: {
            type: Boolean,
            default: true,
        },
    },
};
</script>
