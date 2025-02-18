<template>
    <div class="relative inline-block">
        <!-- Кнопка-ссылка -->
        <button @click="toggleMenu" class="text-[#337AB7] hover:underline cursor-pointer">
            Настроить таблицу <i v-if="isOpen" class="fas fa-angle-up text-xs"></i> <i v-else class="fas fa-angle-down text-xs"></i>  
        </button>

        <!-- Всплывающее окно -->
        <transition name="appear">
            <div v-if="isOpen"
                class="absolute right-0 mt-1 w-48 bg-white shadow-md rounded border border-gray-200 p-2 z-10">
                <slot></slot>
                <div class="flex flex-row-reverse">
                    <button @click="toggleMenu" class="text-[#337AB7] hover:underline mr-3 cursor-pointer">
                        Готово
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
    methods: {
        toggleMenu() {
            this.isOpen = !this.isOpen;
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