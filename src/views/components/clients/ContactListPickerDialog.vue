<template>
  <teleport to="body">
    <transition name="fade-dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @click.self="close"
      >
        <div
          class="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl dark:bg-[var(--surface-elevated)]"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div class="border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              {{ title }}
            </h3>
          </div>
          <ul class="max-h-64 overflow-y-auto py-1">
            <li
              v-for="(option, index) in options"
              :key="`${option.href}-${index}`"
            >
              <a
                :href="option.href"
                class="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--label-accent)] no-underline hover:bg-[var(--surface-muted)]"
                @click="handleSelect"
              >
                <i
                  :class="option.icon"
                  class="text-[var(--nav-accent)]"
                  aria-hidden="true"
                />
                <span>{{ option.label }}</span>
              </a>
            </li>
          </ul>
          <div class="border-t border-[var(--border-subtle)] px-4 py-3 flex justify-end">
            <PrimaryButton
              :is-light="true"
              :onclick="close"
            >
              {{ $t('cancel') }}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'ContactListPickerDialog',
    components: { PrimaryButton },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: '',
        },
        options: {
            type: Array,
            default: () => [],
        },
    },
    emits: ['close'],
    methods: {
        close() {
            this.$emit('close');
        },
        handleSelect() {
            this.close();
        },
    },
};
</script>
