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
        }
    },
    computed: {
        modalWidth() {
            const timelineWidth = 420;
            return `calc((100vw - ${timelineWidth}px) / 3 - ${40 * this.level}px)`;
        }
    }
}
</script>
