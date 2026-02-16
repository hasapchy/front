<template>
    <span class="relative inline-flex">
        <button
            type="button"
            class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            @mouseenter="show"
            @mouseleave="hide"
            @focus="show"
            @blur="hide"
            :aria-label="ariaLabel">
            <i class="fas fa-question-circle text-xs" />
        </button>
        <Teleport to="body">
            <Transition name="hint-fade">
                <div
                    v-show="visible"
                    ref="popoverRef"
                    class="field-hint-popover"
                    :style="popoverStyle"
                    @mouseenter="show"
                    @mouseleave="hide"
                    role="tooltip">
                    <p class="text-sm text-gray-700 leading-relaxed">{{ text }}</p>
                    <div class="field-hint-arrow" :class="arrowClass" />
                </div>
            </Transition>
        </Teleport>
    </span>
</template>

<script>
export default {
    name: 'FieldHint',
    props: {
        text: { type: String, required: true },
        ariaLabel: { type: String, default: '' },
        placement: { type: String, default: 'top' },
    },
    data() {
        return {
            visible: false,
            popoverStyle: {},
            triggerRect: null,
        };
    },
    computed: {
        arrowClass() {
            const m = { top: 'field-hint-arrow--bottom', bottom: 'field-hint-arrow--top', left: 'field-hint-arrow--right', right: 'field-hint-arrow--left' };
            return m[this.placement] || 'field-hint-arrow--bottom';
        },
    },
    methods: {
        show() {
            this.visible = true;
            this.$nextTick(() => this.updatePosition());
        },
        hide() {
            this.visible = false;
        },
        updatePosition() {
            const trigger = this.$el?.querySelector('button');
            const popover = this.$refs.popoverRef;
            if (!trigger || !popover) return;
            const rect = trigger.getBoundingClientRect();
            this.$nextTick(() => {
                const popRect = popover.getBoundingClientRect();
                const gap = 8;
                const padding = 12;
                let top;
                let left = rect.left + rect.width / 2 - popRect.width / 2;
                if (this.placement === 'top') {
                    top = rect.top - popRect.height - gap;
                } else {
                    top = rect.bottom + gap;
                }
                left = Math.max(padding, Math.min(window.innerWidth - popRect.width - padding, left));
                this.popoverStyle = { top: `${top}px`, left: `${left}px` };
            });
        },
    },
};
</script>

<style scoped>
.field-hint-popover {
    position: fixed;
    z-index: 9999;
    max-width: 280px;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    pointer-events: auto;
}

.field-hint-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 6px solid transparent;
}

.field-hint-arrow--bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: #e2e8f0;
    margin-top: -1px;
}

.field-hint-arrow--top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: #e2e8f0;
    margin-bottom: -1px;
}

.field-hint-arrow--left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: #e2e8f0;
    margin-right: -1px;
}

.field-hint-arrow--right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: #e2e8f0;
    margin-left: -1px;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

.hint-fade-enter-to,
.hint-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
