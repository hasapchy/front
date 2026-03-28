<template>
  <div class="flex items-center border border-gray-300 rounded overflow-hidden">
    <button
      class="px-3 py-2 transition-colors cursor-pointer"
      :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
      @click="$emit('change', 'table')"
    >
      <i class="fas fa-table" />
    </button>
    <button
      v-if="shouldShowKanban"
      class="px-3 py-2 transition-colors cursor-pointer"
      :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
      @click="$emit('change', 'kanban')"
    >
      <i class="fas fa-columns" />
    </button>
    <button
      v-if="showCards"
      class="px-3 py-2 transition-colors cursor-pointer"
      :class="viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
      @click="$emit('change', 'cards')"
    >
      <i class="fas fa-th" />
    </button>
  </div>
</template>

<script>
export default {
    props: {
        viewMode: {
            type: String,
            required: true,
            validator: (value) => {
                return ['table', 'kanban', 'cards'].includes(value);
            }
        },
        showKanban: {
            type: Boolean,
            default: null 
        },
        showCards: {
            type: Boolean,
            default: false
        }
    },
    emits: ['change'],
    computed: {
        shouldShowKanban() {
            // Если явно указано - используем значение
            if (this.showKanban !== null) {
                return this.showKanban;
            }
            return !this.showCards;
        }
    }
};
</script>

