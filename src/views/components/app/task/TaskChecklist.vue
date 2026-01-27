<template>
    <div class="task-checklist">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">
                <i class="fas fa-tasks mr-2"></i>
                {{ $t('checklist') || 'Чек-лист' }}
                <span v-if="checklistItems.length > 0" class="text-xs text-gray-500 ml-2">
                    ({{ completedCount }}/{{ checklistItems.length }})
                </span>
            </h3>
        </div>

        <!-- Прогресс-бар -->
        <div v-if="checklistItems.length > 0" class="mb-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    :style="{ width: `${progressPercentage}%` }"
                ></div>
            </div>
        </div>

        <!-- Список пунктов чек-листа -->
        <div class="checklist-items space-y-2">
            <div 
                v-for="(item, index) in checklistItems" 
                :key="item.id || index"
                class="checklist-item flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
            >
                <input
                    type="checkbox"
                    :checked="item.completed"
                    @change="toggleItem(index)"
                    class="mt-1 cursor-pointer"
                />
                <input
                    v-if="editingIndex === index"
                    v-model="editingText"
                    @blur="saveEdit(index)"
                    @keyup.enter="saveEdit(index)"
                    @keyup.esc="cancelEdit"
                    class="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    ref="editInput"
                />
                <span
                    v-else
                    @dblclick="startEdit(index)"
                    :class="[
                        'flex-1 text-sm cursor-text',
                        item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                    ]"
                >
                    {{ item.text }}
                </span>
                <button
                    @click="deleteItem(index)"
                    class="text-red-500 hover:text-red-700 text-sm px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        <!-- Добавление нового пункта -->
        <div class="mt-3 flex gap-2">
            <input
                v-model="newItemText"
                @keyup.enter="addItem"
                @keyup.esc="newItemText = ''"
                :placeholder="$t('addChecklistItem') || 'Добавить пункт...'"
                class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
            <button
                @click="addItem"
                :disabled="!newItemText.trim()"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
                <i class="fas fa-plus"></i>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TaskChecklist',
    props: {
        items: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:items'],
    data() {
        return {
            checklistItems: [],
            newItemText: '',
            editingIndex: -1,
            editingText: ''
        };
    },
    computed: {
        completedCount() {
            return this.checklistItems.filter(item => item.completed).length;
        },
        progressPercentage() {
            if (this.checklistItems.length === 0) return 0;
            return Math.round((this.completedCount / this.checklistItems.length) * 100);
        }
    },
    watch: {
        items: {
            immediate: true,
            handler(newItems) {
                 // Сравниваем массивы, чтобы избежать лишних обновлений
                 if (JSON.stringify(this.checklistItems) !== JSON.stringify(newItems || [])) {
                    this.checklistItems = newItems ? [...newItems] : [];
                }
            }
        },
        checklistItems: {
            deep: true,
            handler(newItems) {
                this.$emit('update:items', newItems);
            }
        }
    },
    methods: {
        // Добавляет новый пункт в чек-лист
        addItem() {
            if (!this.newItemText.trim()) return;
            
            const newItem = {
                id: Date.now(),
                text: this.newItemText.trim(),
                completed: false
            };
            
            this.checklistItems.push(newItem);
            this.newItemText = '';
            // Эмитим событие после изменения
            this.$emit('update:items', [...this.checklistItems]);
        },
        
        // Переключает статус выполнения пункта
        toggleItem(index) {
            if (this.checklistItems[index]) {
                this.checklistItems[index].completed = !this.checklistItems[index].completed;
                 // Эмитим событие после изменения
                 this.$emit('update:items', [...this.checklistItems]);
            }
        },
        
        // Начинает редактирование пункта
        startEdit(index) {
            this.editingIndex = index;
            this.editingText = this.checklistItems[index].text;
            this.$nextTick(() => {
                if (this.$refs.editInput && this.$refs.editInput[0]) {
                    this.$refs.editInput[0].focus();
                }
            });
        },
        
        // Сохраняет изменения после редактирования
        saveEdit(index) {
            if (this.editingText.trim() && this.checklistItems[index]) {
                this.checklistItems[index].text = this.editingText.trim();
                // Эмитим событие после изменения
                this.$emit('update:items', [...this.checklistItems]);
            }
            this.cancelEdit();
        },
        
        // Отменяет редактирование
        cancelEdit() {
            this.editingIndex = -1;
            this.editingText = '';
        },
        
        // Удаляет пункт из чек-листа
        deleteItem(index) {
            this.checklistItems.splice(index, 1);
            // Эмитим событие после изменения
            this.$emit('update:items', [...this.checklistItems]);
        }
    }
};
</script>

<style scoped>
.task-checklist {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
}

.checklist-item {
    position: relative;
}

.checklist-item:hover button {
    opacity: 1;
}

.checklist-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}
</style>