<template>
    <div class="relative inline-block" ref="dropdown">

        <PrimaryButton :onclick="toggleMenu" :isLight="true">
            <i class="fas fa-cog"></i>
        </PrimaryButton>


        <transition name="appear">
            <div v-if="isOpen"
                class="absolute right-0 mt-1 w-48 bg-white shadow-md rounded border border-gray-200 p-2 z-10">
                <slot></slot>
                <div class="flex flex-row-reverse gap-2 mt-2">
                    <PrimaryButton :onclick="toggleMenu">
                        <i class="fas fa-check"></i>
                    </PrimaryButton>
                    <PrimaryButton :onclick="resetColumns" :isDanger="true">
                        <i class="fas fa-undo"></i>
                    </PrimaryButton>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    components: { PrimaryButton },
    props: {
        onReset: { type: Function }
    },
    data() {
        return {
            isOpen: false
        };
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        toggleMenu() {
            this.isOpen = !this.isOpen;
        },
        resetColumns() {
            this.onReset?.();
        },
        handleClickOutside(event) {
            const dropdown = this.$refs.dropdown;
            if (this.isOpen && dropdown && !dropdown.contains(event.target)) {
                this.isOpen = false;
            }
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
