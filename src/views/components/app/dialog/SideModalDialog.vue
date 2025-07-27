<template>
    <teleport to="body">
        <div :class="[
            'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
            showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        ]" @mousedown="onclose">
            <div class="fixed top-0 right-0 h-full flex transform transition-transform duration-300 ease-in-out z-50"
                :style="{ transform: showForm ? 'translateX(0)' : 'translateX(100%)' }" @mousedown.stop>
                <!-- Левая часть: форма -->
                <div id="form" class="h-full flex flex-col bg-white shadow-lg relative" :style="{ width: modalWidth }">
                    <PrimaryButton :onclick="onclose" icon="fas fa-times" class="absolute top-4 right-4"
                        :is-light="true" />
                    <slot />
                </div>

                <!-- Вертикальная панель с кнопкой таймлайна -->
                <div v-if="showTimelineButton" class="w-12 bg-gray-100 border-l border-gray-200 flex flex-col items-center justify-center">
                    <button @click="toggleTimeline" 
                            class="transform -rotate-90 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-2">
                        <i :class="timelineCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" class="text-xs"></i>
                        <span>Таймлайн</span>
                    </button>
                </div>

                <!-- Правая часть: таймлайн, если есть -->
                <slot name="timeline" />
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
            default: true
        }
    },
    computed: {
        modalWidth() {
            const timelineWidth = this.timelineCollapsed ? 0 : 420;
            const buttonWidth = this.showTimelineButton ? 48 : 0; // 48px = 12 * 4 (w-12)
            return `calc((100vw - ${timelineWidth + buttonWidth}px) / 2.2 - ${40 * this.level}px)`;
        }
    },
    methods: {
        toggleTimeline() {
            this.$emit('toggle-timeline');
        }
    }
}
</script>
