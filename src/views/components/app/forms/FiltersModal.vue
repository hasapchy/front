<template>
  <teleport to="body">
    <transition name="filters-modal">
      <!-- Прокрутка на внешнем слое: иначе overflow-y-auto на карточке обрезает выпадающие списки (категория, клиент) -->
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="$emit('close')"
      >
        <div
          class="min-h-full flex items-end md:items-center md:justify-center p-0 md:p-4"
          @click.self="$emit('close')"
        >
          <div
            class="filters-modal-content bg-white w-full md:w-auto md:max-w-4xl md:min-w-[600px] rounded-t-xl md:rounded-xl p-4 md:p-6 shadow-2xl md:m-4"
          >
          <div class="flex justify-between items-center mb-4 pb-4 border-b">
            <h3 class="text-lg font-bold">
              {{ $t('filters') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="$emit('close')"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <div class="space-y-4">
            <slot />
          </div>

          <div class="mt-6 pt-4 border-t flex gap-2">
            <button
              v-if="hasResetButton"
              class="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              @click="$emit('reset')"
            >
              {{ $t('resetFilters') }}
            </button>
            <button
              class="flex-1 px-4 py-2 bg-[#5CB85C] hover:bg-[#4EA84E] text-white rounded-md text-sm font-medium transition-colors"
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
