<template>
  <div
    class="task-checklist min-w-0 w-full"
    :class="{ 'task-checklist--embedded': embedded }"
  >    <div
      v-if="showHeader"
      class="flex items-center justify-between mb-3"
    >
      <h3 class="text-sm font-semibold text-gray-700 dark:text-[var(--text-primary)]">
        <i class="fas fa-tasks mr-2" />
        {{ $t('checklist') }}
        <span
          v-if="checklistItems.length > 0"
          class="text-xs text-gray-500 ml-2"
        >
          ({{ completedCount }}/{{ checklistItems.length }})
        </span>
      </h3>
    </div>

    <!-- Прогресс-бар -->
    <div
      v-if="checklistItems.length > 0"
      class="mb-3"
    >
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-[var(--nav-accent)] h-2 rounded-full transition-all duration-300" 
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <div
      class="checklist-items space-y-2"
      :class="{ 'max-h-60 overflow-y-auto pr-1': scrollable && checklistItems.length > 0 }"
    >
      <div 
        v-for="(item, index) in checklistItems" 
        :key="item.id || index"
        class="checklist-item group flex min-w-0 items-start gap-2 rounded p-2 transition-colors hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
      >        <input
          type="checkbox"
          :checked="item.completed"
          class="mt-1 cursor-pointer"
          @change="toggleItem(index)"
        >
        <input
          v-if="editingIndex === index"
          ref="editInput"
          v-model="editingText"
          class="min-w-0 flex-1 rounded border border-[var(--nav-accent)] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/40 dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
          @blur="saveEdit(index)"
          @keyup.enter="saveEdit(index)"
          @keyup.esc="cancelEdit"
        >
        <span
          v-else
          :class="[
            'min-w-0 flex-1 break-words text-sm cursor-text',
            item.completed ? 'line-through text-gray-500 dark:text-[var(--text-secondary)]' : 'text-gray-800 dark:text-[var(--text-primary)]'
          ]"
          @dblclick="startEdit(index)"
        >          {{ item.text }}
        </span>
        <button
          type="button"
          class="shrink-0 text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] px-1 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100"
          :title="$t('delete')"
          @click="deleteItem(index)"
        >          <i class="fas fa-trash" />
        </button>
      </div>
    </div>

    <div class="mt-3 flex min-w-0 gap-2">
      <input
        v-model="newItemText"
        :placeholder="$t('addChecklistItem')"
        class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/40 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"        @keyup.enter="addItem"
        @keyup.esc="newItemText = ''"
      >
      <button
        type="button"
        :disabled="!newItemText.trim()"
        class="shrink-0 rounded bg-[var(--nav-accent)] px-3 py-2 text-sm text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300"
        @click="addItem"
      >        <i class="fas fa-plus" />
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
        },
        showHeader: {
            type: Boolean,
            default: true,
        },
        embedded: {
            type: Boolean,
            default: false,
        },
        scrollable: {
            type: Boolean,
            default: false,
        },
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
    background: var(--surface-muted);
    border-radius: 0.5rem;
    border: 1px solid var(--border-subtle);
}

.task-checklist--embedded {
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
}

.checklist-item {
    position: relative;
}

.checklist-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    cursor: pointer;
}
</style>