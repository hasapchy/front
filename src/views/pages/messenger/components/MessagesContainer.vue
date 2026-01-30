<template>
    <div ref="scrollWrap" class="flex-1 min-h-0 messenger-bg overflow-y-auto" @scroll="handleScroll">
      <EmptyChatState v-if="!chat" />
      
      <div
        v-else
        ref="messagesContent"
        class="relative p-4 md:p-6 space-y-3"
        @click.self="$emit('close-context-menu')"
      >
        <LoadingIndicator v-if="loadingOlder" text="Загрузка сообщений..." />
        
        <div v-if="loading" class="text-sm text-gray-600">Загрузка…</div>
  
        <template v-else>
          <NewMessagesSeparator v-if="hasUnread" />
          
          <MessageGroup
            v-for="group in messages"
            :key="group.id"
            :group="group"
            :chat="chat"
            @open-image="$emit('open-image', $event)"
            @message-context-menu="$emit('message-context-menu', $event)"
          />
        </template>

        <!-- Контекстное меню внутри области сообщений; позиция относительно этого блока -->
        <MessageContextMenu
          v-if="contextMenuVisible && contextMenuTarget"
          :message="contextMenuTarget"
          :position="menuLocalPosition"
          :is-my-message="isMyMessageForMenu"
          @close="$emit('close-context-menu')"
          @reply="$emit('context-menu-reply', $event)"
          @forward="$emit('context-menu-forward', $event)"
          @edit="$emit('context-menu-edit', $event)"
          @delete="$emit('context-menu-delete', $event)"
        />
      </div>
    </div>
  </template>
  
  <script>
  import EmptyChatState from './EmptyChatState.vue'
  import LoadingIndicator from './LoadingIndicator.vue'
  import NewMessagesSeparator from './NewMessagesSeparator.vue'
  import MessageGroup from './MessageGroup.vue'
  import MessageContextMenu from './MessageContextMenu.vue'

  export default {
    name: 'MessagesContainer',
    components: {
      EmptyChatState,
      LoadingIndicator,
      NewMessagesSeparator,
      MessageGroup,
      MessageContextMenu
    },
    props: {
      chat: Object,
      messages: Array,
      loading: Boolean,
      loadingOlder: Boolean,
      hasUnread: Boolean,
      contextMenuVisible: Boolean,
      contextMenuTarget: Object,
      contextMenuPosition: { type: Object, default: () => ({ x: 0, y: 0 }) },
      isMyMessageForMenu: Boolean
    },
    data() {
      return { menuLocalPosition: { x: 0, y: 0 } }
    },
    watch: {
      contextMenuVisible(visible) {
        if (visible) this.updateMenuLocalPosition()
      },
      contextMenuPosition: { handler() { if (this.contextMenuVisible) this.updateMenuLocalPosition() }, deep: true }
    },
    methods: {
      updateMenuLocalPosition() {
        this.$nextTick(() => {
          const el = this.$refs.messagesContent
          if (!el || !this.contextMenuPosition) return
          const rect = el.getBoundingClientRect()
          this.menuLocalPosition = {
            x: this.contextMenuPosition.x - rect.left,
            y: this.contextMenuPosition.y - rect.top
          }
        })
      },
      handleScroll(event) {
        this.$emit('load-more', event)
      },
      /** Прокрутка списка сообщений вниз (для вызова из родителя). */
      scrollToBottom() {
        const el = this.$refs.scrollWrap
        if (!el) return
        const scroll = () => {
          if (el.scrollHeight !== undefined) el.scrollTop = el.scrollHeight
        }
        ;[0, 100, 300].forEach((ms) => setTimeout(scroll, ms))
      }
    }
  }
  </script>
  
  <style scoped>
  .messenger-bg {
    background-color: #d9dbd5;
    background-image:
      radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.2) 0 1.5px, transparent 2px),
      radial-gradient(circle at 80px 60px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
      radial-gradient(circle at 120px 30px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.02));
    background-size: 140px 100px, 180px 120px, 200px 120px, 100% 100%;
    background-repeat: repeat, repeat, repeat, no-repeat;
  }
  </style>