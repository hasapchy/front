<template>
    <div :class="['fixed inset-0 bg-black/50 z-40 transition-opacity duration-300', showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none']"
        @click="onclose">
        <div id="form"
            class="fixed top-0 overflow-y-auto right-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 container mx-auto p-4"
            :style="{ transform: showForm ? 'translateX(0)' : 'translateX(100%)', width: modalWidth }" @click.stop>
            <PrimaryButton :onclick="onclose" icon="fas fa-times" class="absolute top-4 right-4" :is-light="true"></PrimaryButton>
            <slot></slot>
        </div>
    </div>
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
            return `calc((100vw / 3) - ${40 * this.level}px)`;
        }
    }
}
</script>

<style scoped>
/* Add any additional styling here */
</style>