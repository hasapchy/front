<template>
    <aside class="w-16 md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <!-- Полный сайдбар: поиск + список (скрыт только при ширине < md) -->
      <div class="flex flex-col flex-1 min-h-0 w-full min-w-0 max-md:hidden">
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
              :is-active="isActiveForItem(item)"
              :unread-ticks="getChatLastTicks ? getChatLastTicks(item) : ''"
              :is-user-online="isUserOnlineForItem(item)"
              @click="$emit('select-chat', item)"
            />
          </template>
        </div>
      </div>

      <!-- Компактный режим (узкий экран): только аватарки чатов, улучшенные отступы и зоны нажатия -->
      <div class="flex flex-col flex-1 min-h-0 min-w-0 w-full items-center py-3 px-2 gap-3 overflow-y-auto md:hidden">
        <button
          type="button"
          class="relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Создать групповой чат"
          @click="$emit('create-group')"
        >
          <i class="fas fa-users text-lg text-sky-500"></i>
        </button>
        <div v-if="hasChatsView" class="w-full flex-shrink-0 h-px bg-gray-200" aria-hidden="true" />
        <template v-if="hasChatsView">
          <button
            v-for="item in chats"
            :key="`c-${item.type}-${item.id}`"
            type="button"
            class="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 active:scale-95 transition-transform"
            :class="isActiveForItem(item) ? 'ring-2 ring-sky-500 ring-offset-2 bg-sky-50' : 'hover:bg-gray-100'"
            @click="$emit('select-chat', item)"
          >
            <ChatAvatar
              :item="item"
              :is-active="isActiveForItem(item)"
              :is-user-online="isUserOnlineForItem(item)"
              compact
            />
            <span
              v-if="(item.unread_count || 0) > 0"
              class="absolute top-0 right-0 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center"
            >
              {{ item.unread_count > 99 ? '99+' : item.unread_count }}
            </span>
          </button>
        </template>
      </div>
    </aside>
  </template>
  
  <script>
  import ChatListItem from './ChatListItem.vue'
  import ChatAvatar from './ChatAvatar.vue'

  export default {
    name: 'ChatSidebar',
    components: { ChatListItem, ChatAvatar },
    props: {
      search: String,
      chats: Array,
      selectedChatId: [Number, String],
      selectedChat: Object,
      activePeerUser: Object,
      hasChatsView: Boolean,
      /** Функция из родителя для определения активного чата (general/user/group). */
      isItemActiveFn: { type: Function, default: null },
      /** Функция для отображения галочек прочтения в списке. */
      getChatLastTicks: { type: Function, default: null },
      /** Функция проверки онлайн-статуса пользователя (для списка). */
      isUserOnlineFn: { type: Function, default: null }
    },
    methods: {
      isActiveForItem(item) {
        if (this.isItemActiveFn) return this.isItemActiveFn(item)
        if (!this.selectedChatId) return false
        return String(item.id) === String(this.selectedChatId)
      },
      isUserOnlineForItem(item) {
        if (item?.type !== 'user' || !this.isUserOnlineFn) return false
        return this.isUserOnlineFn(item)
      }
    }
  }
  </script>