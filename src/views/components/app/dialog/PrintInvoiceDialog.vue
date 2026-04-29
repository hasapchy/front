<template>
  <teleport to="body">
    <transition name="fade-dialog">
      <div
        v-if="dialog"
        class="relative z-50"
      >
        <div class="fixed inset-0 z-10 overflow-y-auto pointer-events-none">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <div
              class="pointer-events-auto w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-[var(--surface-elevated)]"
              @click.stop
            >
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-[var(--surface-elevated)]">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                      {{ $t('printInvoice') }}
                    </h3>
                    <div class="mt-2">
                      <label class="block mb-2 text-sm font-semibold">
                        {{ $t('selectPdfVariant') }}
                      </label>
                      <div class="space-y-2">
                        <label class="flex cursor-pointer items-center rounded p-2 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]">
                          <input
                            v-model="selectedVariants"
                            type="checkbox"
                            value="short"
                            class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          >
                          <span>{{ $t('shortPdf') }}</span>
                        </label>
                        <label class="flex cursor-pointer items-center rounded p-2 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]">
                          <input
                            v-model="selectedVariants"
                            type="checkbox"
                            value="detailed"
                            class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          >
                          <span>{{ $t('detailedPdf') }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="my-4 flex space-x-2 mx-5 justify-end">
                <PrimaryButton
                  :onclick="onPrint"
                  icon="fas fa-print"
                  :aria-label="$t('print')"
                  :disabled="selectedVariants.length === 0"
                  :is-loading="loading"
                >
                  {{ $t('print') }}
                </PrimaryButton>
                <PrimaryButton
                  :onclick="onClose"
                  icon="fas fa-times"
                  :is-light="true"
                  :aria-label="$t('close')"
                >
                  {{ $t('cancel') }}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import PrimaryButton from '../buttons/PrimaryButton.vue';

export default {
    components: {
        PrimaryButton
    },
    props: {
        dialog: {
            type: Boolean,
            required: true
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'print'],
    data() {
        return {
            selectedVariants: []
        };
    },
    watch: {
        dialog(newVal) {
            if (!newVal) {
                this.selectedVariants = [];
            }
        }
    },
    methods: {
        onClose() {
            this.$emit('close');
        },
        onPrint() {
            if (this.selectedVariants.length === 0) {
                return;
            }
            this.$emit('print', [...this.selectedVariants]);
        }
    }
};
</script>

<style>
.fade-dialog-enter-active,
.fade-dialog-leave-active {
    transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.fade-dialog-enter-from,
.fade-dialog-leave-to {
    opacity: 0;
}

.fade-dialog-enter-to,
.fade-dialog-leave-from {
    opacity: 1;
}
</style>

