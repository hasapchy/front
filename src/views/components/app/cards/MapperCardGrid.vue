<template>
  <div>
    <CardViewEmptyState
      v-if="!normalizedItems.length"
      :title="emptyTitle"
      :hint="emptyHint"
    />
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <MapperCard
        v-for="item in normalizedItems"
        :key="item.id"
        :item="item"
        :card-config="cardConfig"
        :card-mapper="cardMapper"
        :title-field="titleField"
        :title-prefix="titlePrefix"
        :header-suffix="headerSuffix"
        :title-subtitle-field="titleSubtitleField"
        :is-selected="selectedIds.includes(item.id)"
        :show-checkbox="showCheckbox"
        :footer-color-class="footerColorClass"
        @dblclick="$emit('dblclick', $event)"
        @select-toggle="$emit('select-toggle', $event)"
      />
    </div>
  </div>
</template>

<script>
import MapperCard from './MapperCard.vue';
import CardViewEmptyState from './CardViewEmptyState.vue';

export default {
    name: 'MapperCardGrid',
    components: { MapperCard, CardViewEmptyState },
    props: {
        items: {
            type: Array,
            default: () => []
        },
        cardConfig: {
            type: Array,
            default: () => []
        },
        cardMapper: {
            type: Function,
            required: true
        },
        titleField: {
            type: String,
            default: 'title'
        },
        selectedIds: {
            type: Array,
            default: () => []
        },
        showCheckbox: {
            type: Boolean,
            default: true
        },
        footerColorClass: {
            type: Function,
            default: null
        },
        titlePrefix: {
            type: Function,
            default: null
        },
        headerSuffix: {
            type: Function,
            default: null
        },
        titleSubtitleField: {
            type: String,
            default: ''
        },
        emptyTitle: {
            type: String,
            default: ''
        },
        emptyHint: {
            type: String,
            default: ''
        }
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        normalizedItems() {
            return Array.isArray(this.items) ? this.items : [];
        }
    }
};
</script>
