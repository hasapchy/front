<template>
    <div class="relative inline-block" ref="dropdown">

        <button @click="toggleMenu" class="text-[#337AB7] hover:underline cursor-pointer">
            {{ $t('configureTable') }}
            <i v-if="isOpen" class="fas fa-angle-up text-xs"></i>
            <i v-else class="fas fa-angle-down text-xs"></i>
        </button>


        <transition name="appear">
            <div v-if="isOpen"
                class="absolute right-0 mt-1 w-48 bg-white shadow-md rounded border border-gray-200 p-2 z-10">
                <slot></slot>
                <div class="flex flex-row-reverse">
                    <button @click="toggleMenu" class="text-[#337AB7] hover:underline mr-3 cursor-pointer">
                        {{ $t('done') }}
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
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
