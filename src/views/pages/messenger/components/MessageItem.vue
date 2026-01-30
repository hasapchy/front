<template>
    <div
      class="flex mb-1 group"
      :class="isMyMessage ? 'justify-end' : 'justify-start'"
      @contextmenu.prevent="$emit('message-context-menu', { event: $event, message })"
    >
      <div 
        class="flex flex-col max-w-[75%]"
        :class="isMyMessage ? 'items-end' : 'items-start'"
      >
        <!-- Sender name (only for incoming messages in group chats) -->
        <MessageSender
          v-if="!isMyMessage && shouldShowSenderName"
          :message="message"
          :color="userColor"
        />
  
        <div class="flex items-end gap-2">
          <MessageBubble
            :message="message"
            :is-my-message="isMyMessage"
            @open-image="$emit('open-image', $event)"
            @action="$emit('message-context-menu', { event: $event, message })"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import MessageSender from './MessageSender.vue'
  import MessageBubble from './MessageBubble.vue'
  import { isMyMessage, getMessageUser } from './utils/messageUtils'
  import { getMessageUserName } from './utils/chatHelpers'
  
  export default {
    name: 'MessageItem',
    components: { MessageSender, MessageBubble },
    props: {
      message: {
        type: Object,
        required: true
      },
      chat: {
        type: Object,
        required: true
      }
    },
    computed: {
      isMyMessage() {
        return isMyMessage(this.message, this.$store.state.user?.id)
      },
      shouldShowSenderName() {
        // Show sender name only in group/general chats for incoming messages
        return this.chat.type === 'group' || this.chat.type === 'general'
      },
      userColor() {
        // Generate consistent color for user based on their ID
        const userId = this.message.user_id || this.message.userId || this.message.user?.id
        if (!userId) return '#000000'
        
        const colors = [
          '#e17076', '#7f8c8d', '#a695e7', '#7bc862',
          '#6ec9cb', '#65aadd', '#ee7aae'
        ]
        
        const index = Number(userId) % colors.length
        return colors[index]
      }
    }
  }
  </script>