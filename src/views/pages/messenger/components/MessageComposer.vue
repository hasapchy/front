<template>
    <div class="p-2 sm:p-3 bg-white border-t border-gray-200">
      <ReplyPreview
        v-if="replyingTo"
        :message="replyingTo"
        @close="$emit('cancel-reply')"
      />
      
      <div class="flex items-end gap-1.5 sm:gap-2 min-w-0">
        <!-- Узкая ширина: textarea сверху, иконки снизу. Широкая: иконки слева, textarea справа. -->
        <div class="flex-1 min-w-0 flex flex-col md:flex-row items-end gap-1.5 sm:gap-2 bg-gray-50 rounded-lg pl-2 pr-3 py-2 sm:pl-2 sm:pr-4 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300">
          <div ref="emojiWrapper" class="order-2 md:order-1 shrink-0 relative">
            <MessageAttachments
              :selected-files="selectedFiles"
              :is-recording-audio="isRecordingAudio"
              :disabled="!canWrite || !chat"
              @attach="$emit('attach-files')"
              @emoji="toggleEmojiPicker"
              @record-audio="$emit('toggle-audio-recording')"
            />
            <EmojiPicker
              v-if="showEmojiPicker"
              :model-value="showEmojiPicker"
              @select="onEmojiSelect"
            />
          </div>
          <div class="order-1 md:order-2 flex-1 min-w-0 w-full">
            <MessageTextarea
              ref="textarea"
              :draft="draft"
              :editing-message="editingMessage"
              :disabled="!canWrite || !chat"
              @update:draft="$emit('update:draft', $event)"
              @send="$emit('send')"
              @cancel-edit="$emit('cancel-edit')"
              @save-edit="$emit('save-edit')"
            />
            <SelectedFilesList
              v-if="selectedFiles.length"
              :files="selectedFiles"
              @remove="$emit('remove-file', $event)"
            />
            <AudioRecordingIndicator
              v-if="isRecordingAudio"
              :time="audioRecordingTime"
              @cancel="$emit('cancel-audio-recording')"
            />
          </div>
        </div>
        
        <div class="shrink-0">
          <MessageSendButton
            :editing="!!editingMessage"
            :disabled="!canWrite || sending || (!draft.trim() && selectedFiles.length === 0)"
            @send="$emit('send')"
            @save="$emit('save-edit')"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import ReplyPreview from './ReplyPreview.vue'
  import MessageAttachments from './MessageAttachments.vue'
  import MessageTextarea from './MessageTextarea.vue'
  import EmojiPicker from './EmojiPicker.vue'
  import SelectedFilesList from './SelectedFilesList.vue'
  import AudioRecordingIndicator from './AudioRecordingIndicator.vue'
  import MessageSendButton from './MessageSendButton.vue'
  
  export default {
    name: 'MessageComposer',
    components: {
      ReplyPreview,
      MessageAttachments,
      MessageTextarea,
      EmojiPicker,
      SelectedFilesList,
      AudioRecordingIndicator,
      MessageSendButton
    },
    props: {
      chat: Object,
      draft: String,
      replyingTo: Object,
      editingMessage: Object,
      selectedFiles: Array,
      isRecordingAudio: Boolean,
      audioRecordingTime: Number,
      canWrite: Boolean,
      sending: Boolean
    },
    data() {
      return { showEmojiPicker: false }
    },
    watch: {
      showEmojiPicker(visible) {
        if (visible) {
          this.$nextTick(() => {
            document.addEventListener('click', this.handleClickOutsideEmoji)
            document.addEventListener('keydown', this.handleEmojiEscape)
          })
        } else {
          document.removeEventListener('click', this.handleClickOutsideEmoji)
          document.removeEventListener('keydown', this.handleEmojiEscape)
        }
      }
    },
    beforeUnmount() {
      document.removeEventListener('click', this.handleClickOutsideEmoji)
      document.removeEventListener('keydown', this.handleEmojiEscape)
    },
    methods: {
      toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker
      },
      onEmojiSelect(emoji) {
        this.$refs.textarea?.insertAtCursor?.(emoji)
      },
      handleClickOutsideEmoji(e) {
        const el = this.$refs.emojiWrapper
        if (el && !el.contains(e.target)) this.showEmojiPicker = false
      },
      handleEmojiEscape(e) {
        if (e.key === 'Escape') this.showEmojiPicker = false
      },
      focus() {
        this.$refs.textarea?.focus?.()
      }
    }
  }
</script>