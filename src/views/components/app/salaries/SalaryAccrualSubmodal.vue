<template>
  <teleport to="body">
    <div
      v-if="show"
      class="salary-accrual-submodal fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 dark:bg-black/50"
      @click.self="$emit('close')"
    >
      <div
        class="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:border dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div class="shrink-0 border-b border-gray-200 px-4 py-3 text-sm font-semibold dark:border-[var(--border-subtle)]">
          {{ title }}
        </div>
        <div class="min-h-0 flex-1 overflow-auto p-4 text-sm">
          <slot />
        </div>
        <div class="shrink-0 border-t border-gray-200 px-4 py-2 text-right dark:border-[var(--border-subtle)]">
          <PrimaryButton
            :is-light="true"
            :onclick="() => $emit('close')"
          >
            {{ $t('close') }}
          </PrimaryButton>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'SalaryAccrualSubmodal',
    components: { PrimaryButton },
    props: {
        show: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: '',
        },
    },
    emits: ['close'],
};
</script>
