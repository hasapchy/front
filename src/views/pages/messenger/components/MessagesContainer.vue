<template>
    <div class="flex-1 min-h-0 messenger-bg overflow-y-auto" @scroll="handleScroll">
      <EmptyChatState v-if="!chat" />
      
      <div v-else class="p-4 md:p-6 space-y-3">
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
      </div>
    </div>
  </template>
  
  <script>
  import EmptyChatState from './EmptyChatState.vue'
  import LoadingIndicator from './LoadingIndicator.vue'
  import NewMessagesSeparator from './NewMessagesSeparator.vue'
  import MessageGroup from './MessageGroup.vue'
  
  export default {
    name: 'MessagesContainer',
    components: {
      EmptyChatState,
      LoadingIndicator,
      NewMessagesSeparator,
      MessageGroup
    },
    props: {
      chat: Object,
      messages: Array,
      loading: Boolean,
      loadingOlder: Boolean,
      hasUnread: Boolean
    },
    methods: {
      handleScroll(event) {
        this.$emit('load-more', event)
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