<template>
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Переслать сообщение</h3>
        </div>
        <!-- Превью пересылаемого сообщения -->
        <div v-if="forwardMessage" class="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div
            class="rounded-2xl px-3 py-2 text-sm shadow-sm max-w-full bg-[#d9f6c9] text-gray-900 inline-block"
          >
            <div v-if="!hideSenderName && previewSenderName" class="text-xs font-medium text-green-600 mb-1">
              Переслано от {{ previewSenderName }}
            </div>
            <div v-else-if="hideSenderName" class="text-xs text-gray-500 mb-1">
              Будет показано как ваше сообщение
            </div>
            <div class="break-words">
              {{ previewBody }}
            </div>
            <div v-if="previewHasFiles" class="mt-1 text-xs text-gray-600">
              <i class="fas fa-paperclip mr-1"></i>Вложения
            </div>
          </div>
        </div>
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <div class="space-y-2">
            <button
              v-for="chat in filteredChats"
              :key="`${chat.type}-${chat.id}`"
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 rounded-lg border"
              :class="forwardTarget && String(forwardTarget.type) === String(chat.type) && Number(forwardTarget.id) === Number(chat.id) ? 'border-sky-500 bg-sky-50' : 'border-transparent'"
              @click="$emit('select-target', chat)"
            >
              <div class="relative shrink-0">
                <img
                  v-if="chat.type === 'user' && chat.photo"
                  :src="userPhotoUrl(chat.photo)"
                  class="w-10 h-10 rounded-full object-cover border border-gray-200"
                  alt="user"
                />
                <div
                  v-else-if="chat.type === 'user'"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-green-100 text-green-700"
                >
                  {{ getUserInitials(chat) }}
                </div>
                <div
                  v-else-if="chat.type === 'general'"
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700"
                >
                  <i class="fas fa-comments"></i>
                </div>
                <div
                  v-else-if="chat.type === 'group'"
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700"
                >
                  <i class="fas fa-users"></i>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm text-gray-900 truncate">
                  {{ getItemTitle(chat) }}
                </div>
              </div>
            </button>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200">
          <!-- Опция скрыть имя отправителя при пересылке -->
          <div v-if="forwardMessage" class="mb-3 space-y-2">
            <label class="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="hideSenderName"
                class="mt-1 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                @change="$emit('update:hide-sender-name', $event.target.checked)"
              />
              <span class="text-sm text-gray-700">Скрыть имя отправителя</span>
            </label>
            <p class="text-xs text-gray-500 pl-6">
              Вы можете убрать имя отправителя. В этом случае сообщение будет выглядеть как Ваше.
            </p>
          </div>
          <div v-if="forwardTarget" class="text-xs text-gray-600 mb-2">
            Кому: <span class="font-medium text-gray-900">{{ getItemTitle(forwardTarget) }}</span>
          </div>
  
          <textarea
            :value="forwardText"
            class="w-full bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300 outline-none text-sm text-gray-900 placeholder:text-gray-400 min-h-[44px] max-h-28 resize-none"
            placeholder="Добавить сообщение (как в Telegram)..."
            :disabled="forwardingSending"
            @input="$emit('update:text', $event.target.value)"
          ></textarea>
  
          <div class="mt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              :disabled="forwardingSending"
              @click="$emit('close')"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="forwardingSending || !forwardTarget"
              @click="$emit('send')"
            >
              <span v-if="forwardingSending">Отправка…</span>
              <span v-else>Отправить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from '../utils/helpers'
  import { getItemTitle, getUserInitials, getForwardedUserName, getMessageUserName } from '../utils/chatHelpers'
  
  export default {
    name: 'ForwardModal',
    props: {
      chats: {
        type: Array,
        default: () => []
      },
      selectedChatId: {
        type: [Number, String],
        default: null
      },
      forwardMessage: {
        type: Object,
        default: null
      },
      hideSenderName: {
        type: Boolean,
        default: false
      },
      forwardTarget: {
        type: Object,
        default: null
      },
      forwardText: {
        type: String,
        default: ''
      },
      forwardingSending: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      filteredChats() {
        return this.chats.filter(
          c => Number(c.chat_id ?? c.id) !== Number(this.selectedChatId)
        )
      },
      /** Имя отправителя для превью: из forwarded_from или из user сообщения. */
      previewSenderName() {
        if (!this.forwardMessage) return ''
        if (this.forwardMessage.forwarded_from) {
          return getForwardedUserName(this.forwardMessage.forwarded_from)
        }
        return getMessageUserName(this.forwardMessage)
      },
      /** Текст для превью: body пересланного или основного сообщения. */
      previewBody() {
        if (!this.forwardMessage) return ''
        const src = this.forwardMessage.forwarded_from || this.forwardMessage
        return src.body || '(без текста)'
      },
      previewHasFiles() {
        if (!this.forwardMessage) return false
        const src = this.forwardMessage.forwarded_from || this.forwardMessage
        return Array.isArray(src.files) && src.files.length > 0
      }
    },
    methods: {
      userPhotoUrl(path) {
        return buildStorageUrl(path)
      },
      getItemTitle,
      getUserInitials
    }
  }
  </script>