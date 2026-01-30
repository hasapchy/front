<template>
    <div class="relative shrink-0">
      <!-- Avatar for user or chat icon -->
      <img
        v-if="item.type === 'user' && item.photo"
        :src="userPhotoUrl(item.photo)"
        class="w-10 h-10 rounded-full object-cover border border-gray-200"
        alt="user"
      />
      <div
        v-else-if="item.type === 'user'"
        class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
        :class="isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'"
      >
        {{ getUserInitials(item) }}
      </div>
      <div
        v-else-if="item.type === 'general'"
        class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
        :class="isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
      >
        <i class="fas fa-comments"></i>
      </div>
      <div
        v-else-if="item.type === 'group'"
        class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
        :class="isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
      >
        <i class="fas fa-users"></i>
      </div>
      
      <!-- Online indicator for users -->
      <span
        v-if="item.type === 'user'"
        class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
        :class="isUserOnline ? 'bg-green-500' : 'bg-gray-300'"
      ></span>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from './utils/helpers'
  import { getUserInitials } from './utils/chatHelpers'
  
  export default {
    name: 'ChatAvatar',
    props: {
      item: {
        type: Object,
        required: true
      },
      isActive: {
        type: Boolean,
        default: false
      },
      isUserOnline: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      userPhotoUrl(path) {
        return buildStorageUrl(path)
      },
      getUserInitials
    }
  }
  </script>