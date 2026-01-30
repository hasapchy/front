<template>
    <div class="mt-2 text-xs text-gray-600">
      <div class="font-medium text-gray-700">Файлы:</div>
      <ul class="list-disc ml-4">
        <li v-for="file in files" :key="file.name">{{ file.name }}</li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SelectedFilesList',
    props: {
      files: {
        type: Array,
        default: () => []
      }
    }
  }
  </script>