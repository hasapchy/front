<template>
    <div class="px-4 py-1">
      <div class="flex items-start justify-between gap-4">
        <!-- Left: User info -->
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <!-- Large avatar -->
          <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
            <img
              v-if="user.photo"
              :src="userPhotoUrl(user.photo)"
              class="w-full h-full object-cover"
              alt="user"
            />
            <div
              v-else
              class="w-full h-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-lg"
            >
              {{ getUserInitials(user) }}
            </div>
          </div>
          
          <!-- Name and status -->
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-gray-900 text-base">
              {{ user.name }} {{ user.surname || "" }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">
              <span class="text-green-600">{{ presenceStatusText }}</span>
              <span v-if="user.position" class="ml-2">{{ user.position }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from './utils/helpers'
  import { getUserInitials } from './utils/chatHelpers'
  
  export default {
    name: 'PersonalChatHeader',
    props: {
      user: {
        type: Object,
        required: true
      },
      presenceStatusText: {
        type: String,
        default: ''
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