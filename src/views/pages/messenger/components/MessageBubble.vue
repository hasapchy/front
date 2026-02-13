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
                <img :src="fileUrl(f)" :alt="fileName(f)" class="max-h-32 object-contain" />
              </button>
              <a
                v-else
                class="block text-xs underline text-gray-600 hover:text-gray-800"
                :href="fileUrl(f)"
                target="_blank"
              >
                <i class="fas fa-file mr-1"></i>{{ fileName(f) }}
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
            <img :src="fileUrl(f)" :alt="fileName(f)" class="max-h-48 object-contain" />
          </button>
          <div
            v-else-if="isAudioFile(f)"
            class="flex items-center gap-2 p-2 bg-gray-100 rounded-lg"
          >
            <audio controls class="h-8 text-xs">
              <source :src="fileUrl(f)" :type="f.mime_type || 'audio/webm'">
              Your browser does not support the audio element.
            </audio>
          </div>
          <a
            v-else
            class="block text-xs underline text-sky-700"
            :href="fileUrl(f)"
            target="_blank"
          >
            <i class="fas fa-file mr-1"></i>{{ fileName(f) }}
          </a>
        </div>
      </div>
  
      <!-- Одна строка: реакции слева, время справа (минимальный дизайн как в Telegram) -->
      <div class="mt-1 flex items-center justify-between gap-2 min-h-[20px]">
        <!-- Реакции — слева; своя реакция кликабельна (клик — снять), подсказка «клик — снять» -->
        <div
          v-if="reactionRows.length"
          class="flex flex-wrap items-center gap-1 shrink-0"
        >
          <component
            v-for="r in reactionRows"
            :key="r.emoji"
            :is="r.isMyReaction ? 'button' : 'span'"
            type="button"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[13px] leading-none border border-transparent min-w-[24px] justify-center focus:outline-none"
            :class="r.isMyReaction ? 'bg-sky-100 border-sky-200/50 cursor-pointer hover:bg-sky-200/80' : 'bg-gray-100/80 border-gray-200/50'"
            :title="r.isMyReaction ? r.emoji + ' (клик — снять)' : undefined"
            @click.stop="r.isMyReaction && $emit('reaction-toggle', r.emoji)"
          >
            <span>{{ r.emoji }}</span>
            <span v-if="r.count > 1" class="text-[10px] text-gray-500 font-medium">{{ r.count }}</span>
          </component>
        </div>
        <div v-else class="shrink-0" />
        <!-- Время, статус и кнопка «+» для реакций — справа внизу -->
        <div class="flex items-center gap-1.5 text-[11px] leading-none shrink-0 ml-auto" 
             :class="isMyMessage ? 'text-gray-600' : 'text-gray-500'">
          <span v-if="message.is_edited" class="flex items-center gap-0.5 text-gray-500">
            <i class="fas fa-pencil-alt text-[9px]"></i>
            <span class="italic">изменено</span>
          </span>
          <span>{{ messageTime }}</span>
          <span v-if="isMyMessage" class="ml-0.5 text-green-600">{{ messageTicks }}</span>
          <button
            v-if="!currentUserHasReaction"
            type="button"
            class="w-5 h-5 rounded-full bg-gray-200/80 hover:bg-gray-300 flex items-center justify-center text-gray-500 text-[10px] leading-none shrink-0"
            title="Добавить реакцию"
            aria-label="Добавить реакцию"
            @click.stop="$emit('open-reaction-picker')"
          >
            +
          </button>
        </div>
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
  import { buildStorageUrl, buildTenantStorageUrl } from './utils/helpers'
  import { isImageFile, isAudioFile } from './utils/fileHelpers'
  import { getMessageUserName, getMessagePreview, getForwardedUserName } from './utils/chatHelpers'
  import { messageTime } from './utils/dateFormatters'
  
  export default {
    name: 'MessageBubble',
    emits: ['open-image', 'action', 'open-reaction-picker', 'reaction-toggle'],
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
        return ''
      },
      /** Реакции по эмодзи: [{ emoji, count, isMyReaction }]. */
      reactionRows() {
        const list = this.message?.reactions || []
        if (!list.length) return []
        const myId = this.$store.state.user?.id ? Number(this.$store.state.user.id) : null
        const byEmoji = {}
        list.forEach((r) => {
          const e = r.emoji || ''
          if (!e) return
          if (!byEmoji[e]) byEmoji[e] = { count: 0, isMyReaction: false }
          byEmoji[e].count += 1
          if (myId && Number(r.user_id) === myId) byEmoji[e].isMyReaction = true
        })
        return Object.entries(byEmoji).map(([emoji, { count, isMyReaction }]) => ({ emoji, count, isMyReaction }))
      },
      /** Есть ли реакция от текущего пользователя — скрываем «+» на этом сообщении */
      currentUserHasReaction() {
        return this.reactionRows.some((r) => r.isMyReaction)
      }
    },
    methods: {
      /** URL файла: при наличии file.url — его; иначе tenant по текущей компании (чаты в tenant, не в public). */
      fileUrl(file) {
        const path = typeof file === 'string' ? file : file?.path
        if (typeof file === 'object' && file?.url) return file.url
        const companyId = this.$store.state.currentCompany?.id
        return buildTenantStorageUrl(path, companyId) || buildStorageUrl(path)
      },
      /** Отображаемое имя файла: name или последний сегмент path. */
      fileName(file) {
        if (!file) return ''
        const n = file.name || file.fileName || file.original_name
        if (n) return n
        const p = file.path || ''
        const seg = p.split('/').filter(Boolean).pop()
        return seg || 'Файл'
      },
      isImageFile,
      isAudioFile,
      getMessageUserName,
      getMessagePreview,
      getForwardedUserName
    }
  }
  </script>