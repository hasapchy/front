<template>
    <div
      class="flex mb-1 group"
      :class="isMyMessage ? 'justify-end' : 'justify-start'"
    >
      <div 
        class="flex flex-col max-w-[75%] relative"
        :class="isMyMessage ? 'items-end' : 'items-start'"
      >
        <!-- Sender name (only for incoming messages in group chats) -->
        <MessageSender
          v-if="!isMyMessage && shouldShowSenderName"
          :message="message"
          :color="userColor"
        />
  
        <div class="flex items-end gap-2" 
            @contextmenu.prevent="$emit('message-context-menu', { event: $event, message })"
            >
          <MessageBubble
            :message="message"
            :is-my-message="isMyMessage"
            @open-image="$emit('open-image', $event)"
            @action="$emit('message-context-menu', $event)"
            @open-reaction-picker="$emit('open-picker', { messageId: message.id })"
            @reaction-toggle="$emit('reaction-toggle', { messageId: message.id, emoji: $event })"
          />
        </div>
 
        <!-- Пикер реакций: под сообщением (не перекрывает), справа для своих сообщений, слева для чужих -->
        <div
          v-if="activeReactionPickerMessageId === message.id"
          class="absolute mt-[65px] ml-[calc(100%+6px)] min-h-[4px]"
          :class="isMyMessage ? 'w-full self-end' : 'self-start'"
        >
          <EmojiPicker
            :align-right="isMyMessage"
            :show-close-button="true"
            :position-below="true"
            @select="onReactionEmojiSelect"
            @close="$emit('close-reaction-picker')"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import MessageSender from './MessageSender.vue'
  import MessageBubble from './MessageBubble.vue'
  import MessageReactions from './MessageReactions.vue'
  import EmojiPicker from './EmojiPicker.vue'
  import { isMyMessage, getMessageUser } from './utils/messageUtils'
  import { getMessageUserName } from './utils/chatHelpers'
  
  export default {
    name: 'MessageItem',
    components: { MessageSender, MessageBubble, MessageReactions, EmojiPicker },
    props: {
      message: { type: Object, required: true },
      chat: { type: Object, required: true },
      /** id сообщения, для которого открыт пикер реакций */
      activeReactionPickerMessageId: { type: [Number, String], default: null }
    },
    emits: ['open-image', 'message-context-menu', 'reaction-toggle', 'open-picker', 'close-reaction-picker'],
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
    },
    methods: {
      /** При выборе эмодзи в пикере реакций — ставим реакцию и закрываем пикер */
      onReactionEmojiSelect(emoji) {
        this.$emit('reaction-toggle', { messageId: this.message.id, emoji })
        this.$emit('close-reaction-picker')
      }
    }
  }
  </script>