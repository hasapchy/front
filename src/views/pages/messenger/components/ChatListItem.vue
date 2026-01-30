<template>
    <button
      class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
      :class="isActive ? 'bg-sky-500 text-white hover:bg-sky-500' : ''"
      type="button"
      @click="$emit('click')"
    >
      <ChatAvatar :item="item" :is-active="isActive" :is-user-online="isUserOnline" />
      
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold text-sm truncate" :class="isActive ? 'text-white' : 'text-gray-900'">
            {{ itemTitle }}
          </div>
          <div class="text-[11px] shrink-0 flex items-center gap-1" :class="isActive ? 'text-white/80' : 'text-gray-400'">
            <span v-if="item.last_message_at || item.last_message">{{ formatTime }}</span>
            <span v-if="item.type === 'user' && unreadTicks" class="text-sky-600">{{ unreadTicks }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 mt-0.5">
          <div class="text-xs truncate" :class="isActive ? 'text-white/90' : 'text-gray-500'">
            {{ itemPreview }}
          </div>
          <span
            v-if="(item.unread_count || 0) > 0"
            class="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0"
          >
            {{ item.unread_count }}
          </span>
        </div>
      </div>
    </button>
  </template>
  
  <script>
  import ChatAvatar from './ChatAvatar.vue'
  import { getItemTitle, getItemPreview } from './utils/chatHelpers'
  import { formatChatTime } from './utils/dateFormatters'
  
  export default {
    name: 'ChatListItem',
    components: { ChatAvatar },
    props: {
      item: Object,
      isActive: Boolean,
      /** Строка галочек прочтения (✓/✓✓), передаётся из родителя. */
      unreadTicks: { type: String, default: '' },
      /** Онлайн-статус пользователя (зелёный кружок в списке). */
      isUserOnline: { type: Boolean, default: false }
    },
    computed: {
      itemTitle() {
        return getItemTitle(this.item)
      },
      itemPreview() {
        return getItemPreview(this.item)
      },
      formatTime() {
        return formatChatTime(this.item)
      }
    }
  }
  </script>