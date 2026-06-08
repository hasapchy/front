<template>

  <teleport to="body">

    <transition name="filters-modal">

      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-black/35 dark:bg-black/55"
        @click.self="requestClose">

        <div class="min-h-full flex items-end md:items-center md:justify-center p-0 md:p-4" @click.self="requestClose">

          <div ref="panelRef"
            class="filters-modal-content filters-modal-panel w-full max-w-[calc(100vw-2rem)] overflow-x-hidden rounded-t-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] md:m-4 md:w-auto md:rounded-xl md:p-6"
            :class="panelClasses">

            <div
              class="mb-4 flex shrink-0 items-center justify-between border-b border-gray-200 pb-4 dark:border-[var(--border-subtle)]">

              <div class="min-w-0 pr-3">

                <h3 class="text-lg font-bold text-gray-900 dark:text-[var(--text-primary)]">

                  {{ modalTitle }}

                </h3>

              </div>

              <button type="button"
                class="shrink-0 text-gray-500 transition-colors hover:text-gray-700 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
                :aria-label="$t('close')" @click="requestClose">

                <i class="fas fa-times text-xl" />

              </button>

            </div>



            <div v-if="presetChanged" class="filters-modal-banner shrink-0">

              <i class="fas fa-circle text-[6px] text-[var(--nav-accent)]" aria-hidden="true" />

              <span>{{ $t('filterPresetChangesBanner') }}</span>

            </div>



            <div :class="bodyClasses">

              <slot />

            </div>



            <div v-if="footerMode === 'filters'" class="filters-modal-footer">

              <div class="filters-modal-footer__actions">

                <button v-if="hasResetButton" type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-danger-hover)]"
                  @click="$emit('reset')">

                  <i class="fas fa-filter-circle-xmark text-xs" aria-hidden="true" />

                  {{ $t('reset') }}

                </button>

                <div class="filters-modal-footer__primary">

                  <button v-if="showRevertPreset" type="button"
                    class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 md:flex-none dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)] dark:hover:bg-[#5c6773]"
                    @click="$emit('revert-preset')">

                    <i class="fas fa-clock-rotate-left text-xs" aria-hidden="true" />

                    {{ $t('revertFilterPreset') }}

                  </button>

                  <button v-if="showUpdatePreset" type="button"
                    class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_10%,white)] px-4 py-2 text-sm font-medium transition-colors hover:brightness-105 md:flex-none dark:bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-elevated))]"
                    @click="$emit('update-preset')">

                    <i class="fas fa-bookmark text-xs" aria-hidden="true" />

                    {{ $t('updateFilterPreset') }}

                  </button>

                  <button type="button"
                    class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success-hover)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 md:flex-none"
                    @click="$emit('apply')">

                    <i class="fas fa-check text-xs" aria-hidden="true" />

                    {{ $t('apply') }}

                  </button>

                </div>

              </div>

            </div>

            <div v-else-if="footerMode === 'close'" class="filters-modal-footer">

              <button type="button"
                class="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)] dark:hover:bg-[#5c6773]"
                @click="requestClose">

                {{ $t('close') }}

              </button>

            </div>

          </div>

        </div>

      </div>

    </transition>

  </teleport>

</template>



<script>

import { onBeforeUnmount, onMounted, ref } from 'vue';



const DEFAULT_PANEL_CLASSES = 'md:max-w-[84rem] md:min-w-[900px]';



export default {

  name: 'FiltersModal',

  props: {

    show: {

      type: Boolean,

      default: false,

    },

    title: {

      type: String,

      default: '',

    },

    hasResetButton: {

      type: Boolean,

      default: true,

    },

    footerMode: {

      type: String,

      default: 'filters',

      validator: (value) => ['filters', 'none', 'close'].includes(value),

    },

    scrollableBody: {

      type: Boolean,

      default: false,

    },

    panelClass: {

      type: String,

      default: '',

    },

    showUpdatePreset: {

      type: Boolean,

      default: false,

    },

    showRevertPreset: {

      type: Boolean,

      default: false,

    },

    presetChanged: {

      type: Boolean,

      default: false,

    },

    hasPendingChanges: {

      type: Boolean,

      default: false,

    },

  },

  emits: ['close', 'reset', 'apply', 'update-preset', 'revert-preset', 'close-request'],

  computed: {

    modalTitle() {

      return this.title || this.$t('filters');

    },

    panelClasses() {

      return [DEFAULT_PANEL_CLASSES, this.panelClass].filter(Boolean).join(' ');

    },

    bodyClasses() {

      return [

        'filters-modal-body min-w-0 space-y-4',

        this.scrollableBody ? '' : '',

      ].filter(Boolean).join(' ');

    },

  },

  setup(props, { emit }) {

    const panelRef = ref(null);



    const onKeyDown = (event) => {

      if (!props.show) {

        return;

      }

      if (event.key === 'Escape') {

        event.preventDefault();

        emit('close-request');

        return;

      }

      if (event.key === 'Enter' && props.footerMode === 'filters') {

        const tag = event.target?.tagName?.toLowerCase();

        if (tag === 'textarea' || tag === 'button') {

          return;

        }

        event.preventDefault();

        emit('apply');

      }

    };



    onMounted(() => {

      document.addEventListener('keydown', onKeyDown);

    });



    onBeforeUnmount(() => {

      document.removeEventListener('keydown', onKeyDown);

    });



    return { panelRef };

  },

  methods: {

    requestClose() {

      this.$emit('close-request');

    },

  },

};

</script>
