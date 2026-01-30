<template>
    <div class="relative shrink-0">
      <!-- Аватар: фото или инициалы при отсутствии/ошибке загрузки -->
      <img
        v-if="item.type === 'user' && item.photo && !imageLoadFailed"
        :src="userPhotoUrl(item.photo)"
        :class="avatarSize"
        class="rounded-full object-cover border border-gray-200"
        alt=""
        @error="imageLoadFailed = true"
      />
      <div
        v-else-if="item.type === 'user'"
        :class="[avatarSize, 'rounded-full flex items-center justify-center text-xs font-semibold', isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700']"
      >
        {{ getUserInitials(item) }}
      </div>
      <div
        v-else-if="item.type === 'general'"
        :class="[avatarSize, 'rounded-full flex items-center justify-center overflow-hidden', isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700']"
      >
        <i class="fas fa-comments" :class="compact ? 'text-xs' : ''"></i>
      </div>
      <div
        v-else-if="item.type === 'group'"
        :class="[avatarSize, 'rounded-full flex items-center justify-center overflow-hidden', isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700']"
      >
        <i class="fas fa-users" :class="compact ? 'text-xs' : ''"></i>
      </div>
      
      <!-- Online indicator for users -->
      <span
        v-if="item.type === 'user'"
        :class="['absolute bottom-0 right-0 rounded-full border-2 border-white', compact ? 'w-2 h-2' : 'w-3 h-3', isUserOnline ? 'bg-green-500' : 'bg-gray-300']"
      ></span>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from './utils/helpers'
  import { getUserInitials } from './utils/chatHelpers'
  
  export default {
    name: 'ChatAvatar',
    data() {
      return { imageLoadFailed: false }
    },
    watch: {
      'item.id'() { this.imageLoadFailed = false },
      'item.photo'() { this.imageLoadFailed = false }
    },
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
      },
      /** Компактный режим: меньший аватар (для узкого сайдбара). */
      compact: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      avatarSize() {
        return this.compact ? 'w-8 h-8' : 'w-10 h-10'
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