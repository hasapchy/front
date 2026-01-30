<template>
    <div class="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium text-gray-700 mb-1">
          Ответ на сообщение от {{ messageUserName }}
        </div>
        <div class="text-xs text-gray-600 truncate">
          {{ messagePreview }}
        </div>
      </div>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 shrink-0"
        @click="$emit('close')"
      >
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
  </template>
  
  <script>
  import { getMessageUserName, getMessagePreview } from './utils/chatHelpers'
  
  export default {
    name: 'ReplyPreview',
    props: {
      message: {
        type: Object,
        required: true
      }
    },
    computed: {
      messageUserName() {
        return getMessageUserName(this.message)
      },
      messagePreview() {
        return getMessagePreview(this.message)
      }
    }
  }
  </script>