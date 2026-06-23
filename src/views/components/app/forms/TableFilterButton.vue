<template>
  <div
    ref="dropdown"
    class="relative inline-block"
  >
    <ToolbarIconButton
      icon="fas fa-cog"
      :aria-label="$t('tableColumnSettings')"
      @click="toggleMenu"
    />

    <Teleport to="body">
      <transition name="appear">
        <div
          v-if="isOpen"
          ref="panelRef"
          data-app-overlay-dialog
          class="fixed z-[10000] w-[clamp(15rem,32vw,24rem)] max-w-[calc(100vw-1rem)] rounded border border-gray-200 bg-white p-2 shadow-md dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)] dark:[&_li]:hover:!bg-[var(--surface-muted)]"
          :style="panelPositionStyle"
        >
          <div
            class="overflow-y-auto overflow-x-hidden"
            :style="{ maxHeight: `var(--table-filter-content-max-height, 18rem)` }"
          >
            <slot />
          </div>
          <div class="flex flex-row-reverse gap-2 mt-2 max-md:gap-1">
            <PrimaryButton
              class="max-md:!h-8 max-md:!min-h-0 max-md:!min-w-0 max-md:!px-2 max-md:!py-1"
              :onclick="toggleMenu"
              :aria-label="$t('apply')"
            >
              <i class="fas fa-check" />
            </PrimaryButton>
            <PrimaryButton
              class="max-md:!h-8 max-md:!min-h-0 max-md:!min-w-0 max-md:!px-2 max-md:!py-1"
              :onclick="resetColumns"
              :is-danger="true"
              :aria-label="$t('reset')"
            >
              <i class="fas fa-undo" />
            </PrimaryButton>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ToolbarIconButton from '@/views/components/app/buttons/ToolbarIconButton.vue';

export default {
    components: { PrimaryButton, ToolbarIconButton },
    props: {
        onReset: { type: Function, default: null }
    },
    data() {
        return {
            isOpen: false,
            panelPositionStyle: {}
        };
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
        this.unbindPositionListeners();
    },
    methods: {
        getLayoutMainScrollEl() {
            return document.querySelector('#main-content > main');
        },
        updatePanelPosition() {
            const el = this.$refs.dropdown;
            if (!el) {
                return;
            }
            const panel = this.$refs.panelRef;
            const rect = el.getBoundingClientRect();
            const gap = 6;
            const viewportPadding = 8;
            const actionSectionHeight = 56;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const panelWidth = panel?.offsetWidth || 320;
            const panelHeight = panel?.offsetHeight || 280;
            const preferredLeft = rect.right - panelWidth;
            const maxLeft = Math.max(viewportPadding, viewportWidth - panelWidth - viewportPadding);
            const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft);
            const availableBelow = viewportHeight - rect.bottom - gap - viewportPadding;
            const availableAbove = rect.top - gap - viewportPadding;
            const showAbove = availableBelow < 220 && availableAbove > availableBelow;
            let top = showAbove
                ? Math.max(viewportPadding, rect.top - gap - panelHeight)
                : rect.bottom + gap;
            const maxTop = Math.max(viewportPadding, viewportHeight - panelHeight - viewportPadding);
            top = Math.min(Math.max(top, viewportPadding), maxTop);
            const availableHeight = showAbove ? availableAbove : availableBelow;
            const contentMaxHeight = Math.max(120, availableHeight - actionSectionHeight);
            this.panelPositionStyle = {
                top: `${top}px`,
                left: `${left}px`,
                '--table-filter-content-max-height': `${contentMaxHeight}px`
            };
        },
        bindPositionListeners() {
            if (this._positionListenersBound) {
                return;
            }
            this._positionListenersBound = true;
            this._onScrollOrResize = () => {
                this.updatePanelPosition();
            };
            window.addEventListener('resize', this._onScrollOrResize);
            this._scrollTarget = this.getLayoutMainScrollEl();
            this._scrollTarget?.addEventListener('scroll', this._onScrollOrResize, { passive: true });
        },
        unbindPositionListeners() {
            if (!this._positionListenersBound) {
                return;
            }
            this._positionListenersBound = false;
            window.removeEventListener('resize', this._onScrollOrResize);
            this._scrollTarget?.removeEventListener('scroll', this._onScrollOrResize);
            this._scrollTarget = null;
        },
        toggleMenu() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.$nextTick(() => {
                    this.updatePanelPosition();
                    this.bindPositionListeners();
                });
            } else {
                this.unbindPositionListeners();
                this.panelPositionStyle = {};
            }
        },
        resetColumns() {
            this.onReset?.();
        },
        handleClickOutside(event) {
            const trigger = this.$refs.dropdown;
            const panel = this.$refs.panelRef;
            if (!this.isOpen || !trigger) {
                return;
            }
            if (trigger.contains(event.target) || (panel && panel.contains(event.target))) {
                return;
            }
            this.isOpen = false;
            this.unbindPositionListeners();
            this.panelPositionStyle = {};
        }
    }
};
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>
