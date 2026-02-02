<template>
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
        :disabled="disabled"
        @click="$emit('attach')"
        title="Прикрепить файл"
      >
        <i class="fas fa-paperclip text-sm"></i>
      </button>
      <button
        type="button"
        class="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
        :disabled="disabled"
        @click="$emit('emoji')"
        title="Смайлики"
        aria-label="Смайлики"
      >
        <i class="fas fa-face-smile text-sm"></i>
      </button>
      <button
        type="button"
        class="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
        :disabled="disabled"
        @click="$emit('record-audio')"
        :title="isRecordingAudio ? 'Остановить запись' : 'Записать аудио'"
        :class="isRecordingAudio ? 'bg-red-500 text-white hover:bg-red-600' : ''"
      >
        <i class="fas fa-microphone text-sm"></i>
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MessageAttachments',
    props: {
      disabled: {
        type: Boolean,
        default: false
      },
      isRecordingAudio: {
        type: Boolean,
        default: false
      }
    }
  }
  </script>