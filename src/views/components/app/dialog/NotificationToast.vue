<template>
    <transition name="fade">
        <div v-if="show" :class="[
            'fixed top-4 right-4 p-4 rounded shadow-lg',
            isDanger ? 'bg-[#EE4F47] text-white' : 'bg-[#5CB85C] text-white',
            'z-100'
        ]">
            <div class="flex justify-between items-start gap-2">
                <div class="flex-1">
                    <h3 class="font-bold text-sm mb-1">{{ title }}</h3>
                    <ul v-if="Array.isArray(subtitle) && subtitle.length > 0">
                        <li v-for="(err, i) in subtitle" :key="i" class="text-sm">{{ err }}</li>
                    </ul>
                    <p v-else-if="subtitle" class="text-sm">{{ subtitle }}</p>
                </div>
                <button @click="$emit('close')" class="ml-2 text-white hover:opacity-70 text-lg leading-none font-bold">
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
    watch: {
        show(newVal) {
            if (newVal) {
                // Воспроизводим звук при показе уведомления
                if (this.isDanger) {
                    soundManager.playError();
                } else {
                    soundManager.playSuccess();
                }
            }
        }
    }
};
</script>
