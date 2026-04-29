<template>
  <teleport to="body">
    <transition name="filters-modal">
      <!-- Прокрутка на внешнем слое: иначе overflow-y-auto на карточке обрезает выпадающие списки (категория, клиент) -->
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto bg-black/35 dark:bg-black/55"
        @click.self="$emit('close')"
      >
        <div
          class="min-h-full flex items-end md:items-center md:justify-center p-0 md:p-4"
          @click.self="$emit('close')"
        >
          <div
            class="filters-modal-content w-full rounded-t-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] md:m-4 md:w-auto md:max-w-4xl md:min-w-[600px] md:rounded-xl md:p-6"
          >
          <div class="mb-4 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-[var(--border-subtle)]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('filters') }}
            </h3>
            <button
              type="button"
              class="text-gray-500 transition-colors hover:text-gray-700 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
              @click="$emit('close')"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <div class="space-y-4">
            <slot />
          </div>

          <div class="mt-6 flex gap-2 border-t border-gray-200 pt-4 dark:border-[var(--border-subtle)]">
            <button
              v-if="hasResetButton"
              type="button"
              class="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)] dark:hover:bg-[#5c6773]"
              @click="$emit('reset')"
            >
              {{ $t('resetFilters') }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-md bg-gradient-to-r from-[#5CB85C] to-[#4EA84E] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110"
              @click="$emit('apply')"
            >
              {{ $t('apply') }}
            </button>
          </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
    name: 'FiltersModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        hasResetButton: {
            type: Boolean,
            default: true
        }
    },
    emits: ['close', 'reset', 'apply']
}
</script>
