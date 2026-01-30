<template>
    <div class="relative">
      <!-- Sticky Date Header -->
      <div class="sticky top-0 z-10 flex justify-center my-3 -mx-4 md:-mx-6 py-2 bg-transparent pointer-events-none">
        <div class="px-3 py-1 rounded-full bg-[#c3e3a7] text-xs text-gray-700 shadow-sm pointer-events-auto font-medium">
          {{ group.dateLabel }}
        </div>
      </div>
  
      <!-- Messages -->
      <MessageItem
        v-for="message in group.messages"
        :key="message.id"
        :message="message"
        :chat="chat"
        @open-image="$emit('open-image', $event)"
        @message-context-menu="$emit('message-context-menu', $event)"
      />
    </div>
  </template>
  
  <script>
  import MessageItem from './MessageItem.vue'
  
  export default {
    name: 'MessageGroup',
    components: { MessageItem },
    props: {
      group: Object,
      chat: Object
    }
  }
  </script>