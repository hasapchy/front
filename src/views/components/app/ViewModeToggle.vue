<template>
  <div class="flex max-md:hidden items-stretch divide-x divide-gray-300 overflow-hidden rounded border border-gray-300 dark:divide-[var(--border-subtle)] dark:border-[var(--border-subtle)]">
    <button
      type="button"
      class="flex min-h-9 min-w-9 flex-1 cursor-pointer items-center justify-center border-0 px-3 py-2 shadow-none transition-colors outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)] focus-visible:ring-inset"
      :class="viewMode === 'table' ? 'bg-[var(--nav-accent)] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'"
      @click="$emit('change', 'table')"
    >
      <i class="fas fa-table leading-none" />
    </button>
    <button
      v-if="showCalendar"
      type="button"
      class="flex min-h-9 min-w-9 flex-1 cursor-pointer items-center justify-center border-0 px-3 py-2 shadow-none transition-colors outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)] focus-visible:ring-inset"
      :class="viewMode === 'calendar' ? 'bg-[var(--nav-accent)] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'"
      @click="$emit('change', 'calendar')"
    >
      <i class="fas fa-calendar leading-none" />
    </button>
    <button
      v-if="shouldShowKanban"
      type="button"
      class="flex min-h-9 min-w-9 flex-1 cursor-pointer items-center justify-center border-0 px-3 py-2 shadow-none transition-colors outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)] focus-visible:ring-inset"
      :class="viewMode === 'kanban' ? 'bg-[var(--nav-accent)] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'"
      @click="$emit('change', 'kanban')"
    >
      <i class="fas fa-columns leading-none" />
    </button>
    <button
      v-if="showCards"
      type="button"
      class="flex min-h-9 min-w-9 flex-1 cursor-pointer items-center justify-center border-0 px-3 py-2 shadow-none transition-colors outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)] focus-visible:ring-inset"
      :class="viewMode === 'cards' ? 'bg-[var(--nav-accent)] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'"
      @click="$emit('change', 'cards')"
    >
      <i class="fas fa-th leading-none" />
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
                return ['table', 'kanban', 'cards', 'calendar'].includes(value);
            }
        },
        showKanban: {
            type: Boolean,
            default: null 
        },
        showCalendar: {
            type: Boolean,
            default: false
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

