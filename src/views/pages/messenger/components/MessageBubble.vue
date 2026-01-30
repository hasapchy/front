<template>
    <div
      class="rounded-2xl px-3 py-2 text-sm shadow-sm relative"
      :class="isMyMessage ? 'bg-[#d9f6c9] text-gray-900 rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm'"
    >
      <!-- Reply preview -->
      <div v-if="message.parent" class="mb-2 pb-2 border-l-2 border-gray-400 pl-2 text-xs text-gray-600">
        <div class="font-medium text-gray-700">
          {{ getMessageUserName(message.parent) }}
        </div>
        <div class="truncate">
          {{ getMessagePreview(message.parent) }}
        </div>
      </div>
  
      <!-- Forwarded from header (Telegram style) -->
      <div v-if="message.forwarded_from" class="mb-2 pb-1">
        <div class="text-xs font-medium text-green-600 flex items-center gap-1.5 mb-1">
          <span>Переслано от</span>
          <span class="font-semibold text-green-600">{{ getForwardedUserName(message.forwarded_from) }}</span>
        </div>
        <!-- Forwarded message content -->
        <div class="text-sm text-gray-900">
          <div v-if="message.forwarded_from.body" class="break-words">
            {{ message.forwarded_from.body }}
          </div>
          <div v-if="Array.isArray(message.forwarded_from.files) && message.forwarded_from.files.length" class="mt-1 space-y-1">
            <div v-for="f in message.forwarded_from.files" :key="f.path" class="flex items-center gap-2">
              <button
                v-if="isImageFile(f)"
                type="button"
                @click="$emit('open-image', f)"
                class="block max-w-xs rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img :src="fileUrl(f.path)" :alt="f.name" class="max-h-32 object-contain" />
              </button>
              <a
                v-else
                class="block text-xs underline text-gray-600 hover:text-gray-800"
                :href="fileUrl(f.path)"
                target="_blank"
              >
                <i class="fas fa-file mr-1"></i>{{ f.name }}
              </a>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Additional comment text -->
      <div v-if="message.body && (!message.forwarded_from || message.body !== message.forwarded_from.body)" 
           class="whitespace-pre-wrap break-words leading-snug mt-2">
        {{ message.body }}
      </div>
  
      <!-- Files -->
      <div v-if="Array.isArray(message.files) && message.files.length" class="mt-2 space-y-1">
        <div v-for="f in message.files" :key="f.path" class="flex items-center gap-2">
          <button
            v-if="isImageFile(f)"
            type="button"
            @click="$emit('open-image', f)"
            class="block max-w-xs rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img :src="fileUrl(f.path)" :alt="f.name" class="max-h-48 object-contain" />
          </button>
          <div
            v-else-if="isAudioFile(f)"
            class="flex items-center gap-2 p-2 bg-gray-100 rounded-lg"
          >
            <audio controls class="h-8 text-xs">
              <source :src="fileUrl(f.path)" :type="f.mime_type || 'audio/webm'">
              Your browser does not support the audio element.
            </audio>
          </div>
          <a
            v-else
            class="block text-xs underline text-sky-700"
            :href="fileUrl(f.path)"
            target="_blank"
          >
            <i class="fas fa-file mr-1"></i>{{ f.name }}
          </a>
        </div>
      </div>
  
      <!-- Time and status -->
      <div class="mt-1 flex items-center justify-end gap-1 text-[11px] leading-none" 
           :class="isMyMessage ? 'text-gray-600' : 'text-gray-500'">
        <span v-if="message.is_edited" class="flex items-center gap-0.5 text-gray-500 mr-1">
          <i class="fas fa-pencil-alt text-[9px]"></i>
          <span class="italic">изменено</span>
        </span>
        <span>{{ messageTime }}</span>
        <span v-if="isMyMessage" class="ml-1 text-green-600">{{ messageTicks }}</span>
      </div>
  
      <!-- Message actions menu button -->
      <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs"
          @click.stop="$emit('action', { event: $event, message })"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from './utils/helpers'
  import { isImageFile, isAudioFile } from './utils/fileHelpers'
  import { getMessageUserName, getMessagePreview, getForwardedUserName } from './utils/chatHelpers'
  import { messageTime } from './utils/dateFormatters'
  
  export default {
    name: 'MessageBubble',
    props: {
      message: {
        type: Object,
        required: true
      },
      isMyMessage: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      messageTime() {
        return messageTime(this.message)
      },
      messageTicks() {
        // Это вычисление должно быть в родительском компоненте или через проп
        // Пока возвращаем пустую строку
        return ''
      }
    },
    methods: {
      fileUrl(path) {
        return buildStorageUrl(path)
      },
      isImageFile,
      isAudioFile,
      getMessageUserName,
      getMessagePreview,
      getForwardedUserName
    }
  }
  </script>