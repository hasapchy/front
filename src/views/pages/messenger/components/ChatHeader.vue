<template>
    <div v-if="chat" class="border-b border-gray-200 bg-white">
      <PersonalChatHeader 
        v-if="peerUser" 
        :user="peerUser" 
        :presence-status-text="presenceStatusText" 
      />
      <GroupChatHeader 
        v-else 
        :chat="chat" 
        :presence-status-text="presenceStatusText"
        @delete-chat="$emit('delete-chat')"
      />
    </div>
    <div v-else class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
      <div class="font-semibold text-gray-900">
        {{ $t("messenger") }}
      </div>
    </div>
  </template>
  
  <script>
  import PersonalChatHeader from './PersonalChatHeader.vue'
  import GroupChatHeader from './GroupChatHeader.vue'
  
  export default {
    name: 'ChatHeader',
    components: { PersonalChatHeader, GroupChatHeader },
    props: {
      chat: Object,
      peerUser: Object,
      presenceStatusText: String
    }
  }
  </script>