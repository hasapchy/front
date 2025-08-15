<template>
    <transition name="fade">
        <div v-if="show" 
             :class="[
                'fixed top-4 right-4 p-3 rounded-lg shadow-lg relative overflow-hidden cursor-pointer max-w-xs notification-toast',
                isDanger ? 'bg-[#EE4F47] text-white' : 'bg-[#5CB85C] text-white',
                'z-100'
             ]"
             @mouseenter="pauseProgress"
             @mouseleave="resumeProgress">
            <!-- Индикатор прогресса -->
            <div class="absolute bottom-0 left-0 h-0.5 bg-white bg-opacity-30 transition-all duration-100 ease-linear progress-bar"
                 :style="{ width: progressWidth + '%' }"></div>
            
                         <div class="block">
                 <div class="inline-block w-full">
                     <h3 class="font-bold text-sm mb-1 leading-tight">{{ title }}</h3>
                     <ul v-if="Array.isArray(subtitle) && subtitle.length > 0" class="space-y-0.5">
                         <li v-for="(err, i) in subtitle" :key="i" class="text-xs leading-tight">{{ err }}</li>
                     </ul>
                     <p v-else-if="subtitle" class="text-xs leading-tight">{{ subtitle }}</p>
                 </div>
                 <button @click="$emit('close')" class="absolute top-2 right-2 text-white hover:opacity-70 text-lg leading-none font-bold">
                     &times;
                 </button>
             </div>
        </div>
    </transition>
</template>

<script>
import soundManager from '@/utils/soundUtils.js';

export default {
    name: 'NotificationToast',
    emits: ['close'],
    props: {
        title: { type: String, required: true },
        subtitle: { type: [String, Array], required: true },
        isDanger: { type: Boolean, default: false },
        show: { type: Boolean, default: false }
    },
    data() {
        return {
            progressWidth: 100,
            progressInterval: null,
            startTime: null,
            isPaused: false,
            pauseStartTime: null
        };
    },
    computed: {
        duration() {
            return this.$store.getters.notificationDuration;
        }
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // Воспроизводим звук при показе уведомления
                if (this.isDanger) {
                    soundManager.playError();
                } else {
                    soundManager.playSuccess();
                }
                
                // Запускаем индикатор прогресса
                this.startProgress();
            } else {
                // Останавливаем индикатор при скрытии
                this.stopProgress();
            }
        }
    },
    methods: {
        startProgress() {
            this.progressWidth = 100;
            this.startTime = Date.now();
            this.isPaused = false;
            this.pauseStartTime = null;
            
            this.progressInterval = setInterval(() => {
                if (!this.isPaused) {
                    const elapsed = Date.now() - this.startTime;
                    const remaining = Math.max(0, this.duration - elapsed);
                    this.progressWidth = (remaining / this.duration) * 100;
                    
                    if (remaining <= 0) {
                        this.stopProgress();
                    }
                }
            }, 50); // Обновляем каждые 50мс для плавной анимации
        },
        
        pauseProgress() {
            if (!this.isPaused) {
                this.isPaused = true;
                this.pauseStartTime = Date.now();
                // Приостанавливаем таймер в store
                this.$store.dispatch('pauseNotificationTimer');
            }
        },
        
        resumeProgress() {
            if (this.isPaused && this.pauseStartTime) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.startTime += pauseDuration; // Корректируем время старта
                this.isPaused = false;
                this.pauseStartTime = null;
                // Возобновляем таймер в store
                this.$store.dispatch('resumeNotificationTimer');
            }
        },
        
        stopProgress() {
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
        }
    },
    
    beforeUnmount() {
        this.stopProgress();
    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

 /* Уведомление полностью независимо от layout */
 .notification-toast {
     position: fixed !important;
     top: 1rem !important;
     right: 1rem !important;
     z-index: 9999 !important;
     width: auto !important;
     height: auto !important;
     min-height: auto !important;
     max-height: none !important;
     overflow: visible !important;
     pointer-events: auto !important;
     transform: none !important;
 }

/* Убеждаемся, что индикатор прогресса не влияет на высоту */
.progress-bar {
    height: 2px;
    line-height: 0;
}

 /* Делаем текст более компактным */
 .notification-toast h3 {
     margin-bottom: 0.25rem;
     line-height: 1.2;
     display: block !important;
 }

 .notification-toast ul {
     margin: 0;
     padding: 0;
     display: block !important;
 }

 .notification-toast li {
     margin: 0;
     padding: 0;
     line-height: 1.2;
     display: block !important;
 }

 .notification-toast p {
     margin: 0;
     line-height: 1.2;
     display: block !important;
 }

 /* Полная изоляция от flexbox */
 .notification-toast * {
     flex: none !important;
     flex-grow: 0 !important;
     flex-shrink: 0 !important;
     flex-basis: auto !important;
 }
</style>
