<template>
  <transition name="fade">
    <button
      v-if="isVisible"
      class="fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)] text-white shadow-lg shadow-[var(--nav-accent)]/30 transition-all duration-300 hover:brightness-110 focus:shadow-outline focus:outline-none max-[1199px]:bottom-[5.25rem]"
      aria-label="Наверх"
      @click="scrollToTop"
    >
      <i class="fas fa-arrow-up" />
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

