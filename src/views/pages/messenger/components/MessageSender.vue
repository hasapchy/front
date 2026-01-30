<template>
    <div 
      class="text-xs font-medium mb-1 ml-3"
      :style="{ color: color }"
    >
      {{ senderName }}
    </div>
  </template>
  
  <script>
  import { getMessageUserName } from './utils/chatHelpers'
  
  export default {
    name: 'MessageSender',
    props: {
      message: {
        type: Object,
        required: true
      },
      color: {
        type: String,
        default: '#000000'
      }
    },
    computed: {
      senderName() {
        return getMessageUserName(this.message)
      }
    }
  }
  </script>