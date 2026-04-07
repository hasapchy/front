<template>
  <button 
    :class="[
      'flex items-center justify-center rounded-full transition-all duration-200',
      size === 'sm' ? 'w-9 h-9 text-sm' : 'w-10 h-10',
      isSoundEnabled 
        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    ]" 
    type="button"
    :title="isSoundEnabled ? $t('disableSound') : $t('enableSound')"
    @click="toggleSound"
  >
    <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'" />
  </button>
</template>

<script>
import { computed, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import soundManager from '@/utils/soundUtils';

export default {
    name: 'SoundToggle',
    props: {
        size: {
            type: String,
            default: 'default',
            validator: (v) => ['default', 'sm'].includes(v)
        }
    },
    setup() {
        const store = useStore();
        const soundStorageKey =
            getCurrentInstance()?.appContext.config.globalProperties.$storageUi?.LS_KEYS
                ?.soundEnabled ?? 'soundEnabled';

        const isSoundEnabled = computed(() => store.state.soundEnabled);

        const toggleSound = () => {
            const newState = soundManager.toggleSound();
            store.commit('SET_SOUND_ENABLED', newState);
            localStorage.setItem(soundStorageKey, newState.toString());
        };
        
        return {
            isSoundEnabled,
            toggleSound
        };
    }
};
</script>
