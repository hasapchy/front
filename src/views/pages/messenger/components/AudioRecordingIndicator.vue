<template>
    <div class="mt-2 flex items-center gap-3 text-xs">
      <span class="text-red-600 font-medium">
        <i class="fas fa-circle animate-pulse"></i> Запись аудио... {{ time }}с
      </span>
      <button
        type="button"
        class="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
        @click="$emit('cancel')"
      >
        Отменить
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AudioRecordingIndicator',
    props: { time: { type: Number, default: 0 } },
    emits: ['cancel']
  }
  </script>