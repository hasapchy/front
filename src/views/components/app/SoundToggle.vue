<template>
    <button 
        @click="toggleSound" 
        :class="[
            'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200',
            isSoundEnabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
        :title="isSoundEnabled ? $t('disableSound') : $t('enableSound')"
    >
        <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
    </button>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import soundManager from '@/utils/soundUtils';

export default {
    name: 'SoundToggle',
    setup() {
        const store = useStore();
        
        const isSoundEnabled = computed(() => store.state.soundEnabled);
        
        const toggleSound = () => {
            const newState = soundManager.toggleSound();
            store.commit('SET_SOUND_ENABLED', newState);
            // Сохраняем настройку в localStorage
            localStorage.setItem('soundEnabled', newState.toString());
        };
        
        return {
            isSoundEnabled,
            toggleSound
        };
    }
};
</script>
