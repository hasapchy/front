<template>
    <div class="flex justify-center py-2">
      <div class="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-xs text-gray-600 border border-white/80 shadow-sm flex items-center gap-2">
        <i class="fas fa-spinner fa-spin"></i>
        {{ text }}
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoadingIndicator',
    props: {
      text: {
        type: String,
        default: 'Загрузка...'
      }
    }
  }
  </script>