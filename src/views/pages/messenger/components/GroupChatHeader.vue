<template>
    <div class="h-14 px-4 flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
          <i class="fas" :class="chatIcon"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-gray-900 truncate">
            {{ chatTitle }}
          </div>
          <div class="text-xs text-gray-400 truncate">
            <span v-if="chat.type === 'group' && chat.creator">
              Создал: {{ chat.creator.name }} {{ chat.creator.surname || "" }}
            </span>
            <span v-else>{{ presenceStatusText }}</span>
          </div>
        </div>
      </div>
  
      <div class="flex items-center gap-2">
        <button
          v-if="showDeleteButton"
          class="w-9 h-9 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center"
          type="button"
          title="Удалить чат"
          @click="$emit('delete-chat')"
        >
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { getItemTitle } from './utils/chatHelpers'
  
  export default {
    name: 'GroupChatHeader',
    props: {
      chat: {
        type: Object,
        required: true
      },
      presenceStatusText: {
        type: String,
        default: ''
      },
      showDeleteButton: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      chatTitle() {
        return getItemTitle(this.chat)
      },
      chatIcon() {
        if (this.chat.type === 'general') return 'fa-globe'
        if (this.chat.type === 'direct') return 'fa-user'
        return 'fa-users'
      }
    }
  }
  </script>