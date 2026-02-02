<template>
    <div class="mt-2 text-xs text-gray-600">
      <div class="font-medium text-gray-700">Файлы:</div>
      <ul class="mt-1 space-y-1">
        <li
          v-for="(file, index) in files"
          :key="index"
          class="flex items-center gap-2 group"
        >
          <span class="truncate min-w-0">{{ file.name || 'Безымянный' }}</span>
          <button
            type="button"
            class="shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Удалить файл"
            aria-label="Удалить файл"
            @click="$emit('remove', index)"
          >
            <i class="fas fa-times text-[10px]"></i>
          </button>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SelectedFilesList',
    props: { files: { type: Array, default: () => [] } },
    emits: ['remove']
  }
  </script>