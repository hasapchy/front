<template>
    <teleport to="body">
        <div :class="[
            'fixed inset-0 z-40 transition-opacity duration-300',
            showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        ]" @mousedown="onclose">
            <div class="fixed top-0 right-0 h-full flex transform transition-transform duration-300 ease-in-out z-50"
                :style="{ transform: showForm ? 'translateX(0)' : 'translateX(100%)' }" @mousedown.stop>

                <div id="form" class="h-full flex flex-col bg-white shadow-lg relative transition-all duration-300 ease-in-out mobile-full-width" :style="{ width: modalWidth }">
                    <PrimaryButton :onclick="onclose" icon="fas fa-times" class="absolute top-4 right-4"
                        :is-light="true" />
                    <slot />
                </div>


                <div v-if="showTimelineButton" class="flex w-12 bg-gray-100 border-l border-gray-200 flex-col items-center justify-center transition-all duration-300 ease-in-out">
                    <button @click="toggleTimeline" 
                            class="transform -rotate-90 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-2">
                        <i :class="timelineCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" class="text-xs transition-transform duration-200"></i>
                        <span>Таймлайн</span>
                    </button>
                </div>


                <div class="block transition-all duration-300 ease-in-out overflow-hidden" :style="{ width: timelineCollapsed ? '0px' : '420px' }">
                    <slot name="timeline" />
                </div>
            </div>
        </div>
    </teleport>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
export default {
    components: {
        PrimaryButton
    },
    emits: ['toggle-timeline'],
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
        }
    },
    computed: {
        modalWidth() {
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
