<template>
    <transition name="fade">
        <button
            v-if="isVisible"
            @click="scrollToTop"
            class="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#337AB7] text-white rounded-full shadow-lg hover:bg-[#3571A4] focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center cursor-pointer"
            aria-label="Наверх"
        >
            <i class="fas fa-arrow-up"></i>
        </button>
    </transition>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

export default {
    name: 'ScrollToTopButton',
    setup() {
        const isVisible = ref(false);
        const scrollThreshold = 300;
        let scrollElement = null;

        const getScrollElement = () => {
            const mainContent = document.getElementById('main-content');
            return mainContent?.querySelector('main') || window;
        };

        const handleScroll = () => {
            if (!scrollElement) {
                scrollElement = getScrollElement();
            }
            
            if (scrollElement === window) {
                isVisible.value = window.scrollY > scrollThreshold;
            } else {
                isVisible.value = scrollElement.scrollTop > scrollThreshold;
            }
        };

        const scrollToTop = () => {
            if (!scrollElement) {
                scrollElement = getScrollElement();
            }
            
            if (scrollElement === window) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                scrollElement.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        };

        onMounted(async () => {
            await nextTick();
            scrollElement = getScrollElement();
            
            if (scrollElement) {
                scrollElement.addEventListener('scroll', handleScroll, { passive: true });
                handleScroll();
            }
        });

        onUnmounted(() => {
            if (scrollElement && scrollElement !== window) {
                scrollElement.removeEventListener('scroll', handleScroll);
            } else if (scrollElement === window) {
                window.removeEventListener('scroll', handleScroll);
            }
        });

        return {
            isVisible,
            scrollToTop
        };
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>

