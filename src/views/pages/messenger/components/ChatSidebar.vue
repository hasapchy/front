<template>
    <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <div class="px-3 py-2 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              :value="search"
              type="text"
              class="w-full h-9 rounded-full bg-gray-100 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Найти сотрудника или чат"
              @input="$emit('update:search', $event.target.value)"
            />
          </div>
          <button
            class="w-9 h-9 rounded-lg bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0"
            title="Создать групповой чат"
            type="button"
            @click="$emit('create-group')"
          >
            <i class="fas fa-users text-sm"></i>
          </button>
        </div>
      </div>
  
      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="!hasChatsView" class="p-4 text-sm text-gray-500">
          Нет доступа к чатам
        </div>
        <template v-else>
          <div v-if="chats.length === 0" class="px-4 py-3 text-sm text-gray-500">
            Нет чатов
          </div>
          <ChatListItem
            v-for="item in chats"
            :key="`${item.type}-${item.id}`"
            :item="item"
            :is-active="isItemActive(item)"
            @click="$emit('select-chat', item)"
          />
        </template>
      </div>
    </aside>
  </template>
  
  <script>
  import ChatListItem from './ChatListItem.vue'
  
  export default {
    name: 'ChatSidebar',
    components: { ChatListItem },
    props: {
      search: String,
      chats: Array,
      selectedChatId: [Number, String],
      hasChatsView: Boolean
    },
    methods: {
      isItemActive(item) {
        // Логика определения активного чата
        if (!this.selectedChatId) return false
        return String(item.id) === String(this.selectedChatId)
      }
    }
  }
  </script>