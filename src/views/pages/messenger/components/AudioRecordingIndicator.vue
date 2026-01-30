<template>
    <div class="mt-2 text-xs text-red-600 font-medium">
      <i class="fas fa-circle animate-pulse"></i> Запись аудио... {{ time }}с
    </div>
  </template>
  
  <script>
  export default {
    name: 'AudioRecordingIndicator',
    props: {
      time: {
        type: Number,
        default: 0
      }
    }
  }
  </script>