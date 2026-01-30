<template>
    <div class="p-3 bg-white border-t border-gray-200">
      <ReplyPreview
        v-if="replyingTo"
        :message="replyingTo"
        @close="$emit('cancel-reply')"
      />
      
      <div class="flex items-end gap-2">
        <MessageAttachments
          :selected-files="selectedFiles"
          :is-recording-audio="isRecordingAudio"
          :disabled="!canWrite || !chat"
          @attach="$emit('attach-files')"
          @record-audio="$emit('toggle-audio-recording')"
        />
        
        <div class="flex-1 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300">
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
          />
          
          <AudioRecordingIndicator
            v-if="isRecordingAudio"
            :time="audioRecordingTime"
          />
        </div>
        
        <MessageSendButton
          :editing="!!editingMessage"
          :disabled="!canWrite || sending || (!draft.trim() && selectedFiles.length === 0)"
          @send="$emit('send')"
          @save="$emit('save-edit')"
        />
      </div>
    </div>
  </template>
  
  <script>
  import ReplyPreview from './ReplyPreview.vue'
  import MessageAttachments from './MessageAttachments.vue'
  import MessageTextarea from './MessageTextarea.vue'
  import SelectedFilesList from './SelectedFilesList.vue'
  import AudioRecordingIndicator from './AudioRecordingIndicator.vue'
  import MessageSendButton from './MessageSendButton.vue'
  
  export default {
    name: 'MessageComposer',
    components: {
      ReplyPreview,
      MessageAttachments,
      MessageTextarea,
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
    }
  }
  </script>