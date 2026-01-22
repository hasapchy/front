<template>
    <div class="flex items-center border border-gray-300 rounded overflow-hidden">
        <button @click="$emit('change', 'table')" class="px-3 py-2 transition-colors cursor-pointer"
            :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
            <i class="fas fa-table"></i>
        </button>
        <button v-if="shouldShowKanban" @click="$emit('change', 'kanban')" class="px-3 py-2 transition-colors cursor-pointer"
            :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
            <i class="fas fa-columns"></i>
        </button>
        <button v-if="showCards" @click="$emit('change', 'cards')" class="px-3 py-2 transition-colors cursor-pointer"
            :class="viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
            <i class="fas fa-th"></i>
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
                // Разрешаем любые из поддерживаемых режимов
                return ['table', 'kanban', 'cards'].includes(value);
            }
        },
        showKanban: {
            type: Boolean,
            default: null // null означает автоматическое определение
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
            // По умолчанию показываем kanban, если не указан showCards
            // Это позволяет использовать kanban на страницах Orders/Projects/Tasks
            // где kanban нужен, но showCards не указан
            return !this.showCards;
        }
    }
};
</script>

