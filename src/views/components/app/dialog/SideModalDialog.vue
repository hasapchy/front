<template>
  <teleport to="body">
    <div
      :class="[
        'fixed inset-0 transition-opacity duration-300',
        showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ]"
      :style="{ zIndex: 40 + level * 10 }"
      @mousedown="onclose"
    >
      <div
        ref="trapRef"
        class="fixed top-0 right-0 h-full flex transform transition-transform duration-300 ease-in-out"
        :style="{ transform: showForm ? 'translateX(0)' : 'translateX(100%)', zIndex: 50 + level * 10 }"
        @mousedown.stop
      >
        <div
          id="form"
          class="flex h-full min-h-0 min-w-0 flex-col bg-white shadow-lg transition-all duration-300 ease-in-out mobile-full-width"
          :style="{ width: modalWidth }"
          role="dialog"
          aria-modal="true"
          :aria-label="titleA11y || resolvedTitle || $t('formPanel')"
        >
          <div class="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-2">
            <div class="truncate px-2 text-sm font-semibold text-gray-800">
              {{ resolvedTitle }}
            </div>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              :aria-label="$t('close')"
              @click="onclose"
            >
              <i class="fas fa-times text-base leading-none" />
            </button>
          </div>
          <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div class="min-h-0 min-w-0 flex-1">
              <slot />
            </div>
          </div>
        </div>


        <div
          v-if="showTimelineButton"
          class="flex w-12 bg-gray-100 border-l border-gray-200 flex-col items-center justify-center transition-all duration-300 ease-in-out"
        >
          <button
            class="transform -rotate-90 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-2"
            @click="toggleTimeline"
          >
            <i
              :class="timelineCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"
              class="text-xs transition-transform duration-200"
            />
            <span>История и комментарии</span>
          </button>
        </div>


        <div
          class="block transition-all duration-300 ease-in-out overflow-hidden"
          :style="{ width: timelineCollapsed ? '0px' : '420px' }"
        >
          <slot name="timeline" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';
import { onKeyStroke } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

const SIDE_MODAL_NEST = Symbol('sideModalNest');

function sideModalDefaultItemLabel(item) {
    if (!item) {
        return '';
    }
    const v = item.name ?? item.title;
    if (v != null && String(v).trim()) {
        return String(v).trim();
    }
    const num = item.invoiceNumber ?? item.number;
    if (num != null && String(num).trim()) {
        return String(num).trim();
    }
    return '';
}

export function sideModalCrudTitle(t, {
    item = null,
    entityGenitiveKey,
    entityNominativeKey = null,
    displayLabel,
    getName,
} = {}) {
    const gen = t(entityGenitiveKey);
    const nom = entityNominativeKey ? t(entityNominativeKey) : gen;
    if (!item) {
        return t('sideModalCreate', { entity: gen });
    }
    const id = item.id;
    let label = '';
    if (displayLabel !== undefined && displayLabel !== null) {
        label = String(displayLabel).trim();
    } else if (typeof getName === 'function') {
        label = String(getName(item) ?? '').trim();
    } else {
        label = sideModalDefaultItemLabel(item);
    }
    const idStr = id != null && id !== '' ? String(id) : '—';
    if (label) {
        return t('sideModalEditNamed', { entity: gen, name: label, id: idStr });
    }
    return t('sideModalEditIdOnly', { entity: nom, id: idStr });
}

export function transactionSideModalTitle(t, { headerText = '', editingItem = null } = {}) {
    const h = headerText != null ? String(headerText).trim() : '';
    if (h) {
        return h;
    }
    return sideModalCrudTitle(t, {
        item: editingItem,
        entityGenitiveKey: 'sideModalGenTransaction',
        entityNominativeKey: 'sideModalNomTransaction',
        getName: (item) => {
            if (!item) {
                return '';
            }
            const n = item.note ?? item.description ?? item.title;
            return n != null ? String(n).trim() : '';
        },
    });
}

export function salaryAccrualSideModalTitle(t, { operationType, forAllActiveEmployees, count }) {
    const n = Number(count) || 0;
    const companyTitles = {
        salaryAccrual: t('accrueSalariesForCompany'),
        salaryPayment: t('paySalariesForCompany'),
    };
    if (forAllActiveEmployees && companyTitles[operationType]) {
        return `${companyTitles[operationType]} (${n})`;
    }
    const selectedTitles = {
        salaryAccrual: t('accrueSalariesForSelected'),
        salaryPayment: t('paySalariesForSelected'),
        bonus: t('accrueBonusesForSelected'),
        penalty: t('issuePenaltiesForSelected'),
        advance: t('issueAdvancesForSelected'),
    };
    return `${selectedTitles[operationType] || selectedTitles.salaryAccrual} (${n})`;
}

export default {
    props: {
        showForm: {
            type: Boolean,
            default: false
        },
        onclose: {
            type: Function,
            required: true
        },
        level: {
            type: Number,
            required: false,
            default: 0
        },
        timelineCollapsed: {
            type: Boolean,
            default: true
        },
        showTimelineButton: {
            type: Boolean,
            default: false
        },
        fullWidth: {
            type: Boolean,
            default: false
        },
        widthRatio: {
            type: Number,
            default: null
        },
        titleA11y: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        }
    },
    emits: ['toggle-timeline'],
    setup(props) {
        const trapRef = ref(null);
        const parentNest = inject(SIDE_MODAL_NEST, null);
        const childSuspendCount = ref(0);

        provide(SIDE_MODAL_NEST, {
            suspendTrap() {
                childSuspendCount.value++;
            },
            resumeTrap() {
                if (childSuspendCount.value > 0) {
                    childSuspendCount.value--;
                }
            }
        });
        provide('sideModalLevel', props.level);

        watch(
            () => props.showForm,
            (isOpen, wasOpen) => {
                if (isOpen && parentNest) {
                    parentNest.suspendTrap();
                } else if (!isOpen && wasOpen && parentNest) {
                    parentNest.resumeTrap();
                }
            },
            { immediate: true }
        );

        onBeforeUnmount(() => {
            if (props.showForm && parentNest) {
                parentNest.resumeTrap();
            }
        });

        const { activate, deactivate } = useFocusTrap(trapRef, {
            allowOutsideClick: (event) => {
                const target = event?.target;
                if (!(target instanceof Element)) return false;
                if (target.closest('.Toastify')) {
                    return true;
                }
                if (target.closest('.filters-modal-content')) {
                    return true;
                }
                if (target.closest('.salary-accrual-submodal')) {
                    return true;
                }
                return false;
            }
        });
        watch(
            () => [props.showForm, childSuspendCount.value],
            ([open, suspendedByChild]) => {
                if (open && suspendedByChild === 0) {
                    nextTick(() => activate());
                } else {
                    deactivate({ returnFocus: !open });
                }
            },
            { immediate: true }
        );
        const stopEscape = onKeyStroke('Escape', () => {
            if (props.showForm && props.onclose) {
                props.onclose();
            }
        });

        const resolvedTitle = computed(() => props.title || '');
        onBeforeUnmount(stopEscape);
        return { trapRef, resolvedTitle };
    },
    computed: {
        modalWidth() {
            if (this.fullWidth) {
                return '100vw';
            }
            if (this.widthRatio) {
                const timelineWidth = this.timelineCollapsed ? 0 : 420;
                const buttonWidth = this.showTimelineButton ? 48 : 0;
                return `calc((100vw - ${timelineWidth + buttonWidth}px) * ${this.widthRatio})`;
            }
            const timelineWidth = this.timelineCollapsed ? 0 : 420;
            const buttonWidth = this.showTimelineButton ? 48 : 0;
            const baseWidth = '1.7';
            return `calc((100vw - ${timelineWidth + buttonWidth}px) / ${baseWidth} - ${40 * this.level}px)`;
        }
    },
    methods: {
        toggleTimeline() {
            this.$emit('toggle-timeline');
        }
    }
}
</script>

<style scoped>

.fas.fa-chevron-left,
.fas.fa-chevron-right {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}


.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}


.fixed.top-0.right-0.h-full.flex {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 767px) {
    .mobile-full-width {
        width: 100vw !important;
    }
}
</style>
