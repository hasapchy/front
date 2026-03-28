<template>
  <div class="h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <audio
      ref="voiceAudio"
      class="hidden"
      @timeupdate="onVoiceTimeUpdate"
      @loadedmetadata="onVoiceLoadedMetadata"
      @ended="onVoiceEnded"
      @play="onVoicePlay"
      @pause="onVoicePause"
    />
    <audio
      ref="voicePreload"
      class="hidden"
      preload="metadata"
      @loadedmetadata="onVoicePreloadMetadata"
    />
    <ChatSkeleton v-if="loadingChats && !selectedChat" />
    <template v-else>
      <!-- LEFT: list -->
      <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
        <!-- Search row -->
        <div class="px-3 py-2 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <div class="flex-1 relative">
              <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                ref="chatSearchInput"
                v-model="search"
                type="text"
                class="w-full h-9 rounded-full bg-gray-100 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                placeholder="Найти сотрудника или чат (Ctrl+K)"
              >
            </div>

            <button
              class="w-9 h-9 rounded-lg bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0"
              title="Создать групповой чат"
              type="button"
              @click="showCreateGroupModal = true"
            >
              <i class="fas fa-users text-sm" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div
            v-if="!hasChatsView"
            class="p-4 text-sm text-gray-500"
          >
            Нет доступа к чатам
          </div>

          <template v-else>
            <!-- Combined list of chats and users -->
            <div
              v-if="allChatsList.length === 0"
              class="px-4 py-3 text-sm text-gray-500"
            >
              Нет чатов
            </div>

            <button
              v-for="item in allChatsList"
              :key="`${item.type}-${item.id}`"
              class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
              :class="isItemActive(item) ? 'bg-sky-500 text-white hover:bg-sky-500' : ''"
              type="button"
              @click="selectItem(item)"
            >
              <div class="relative shrink-0">
                <!-- Avatar for user or chat icon -->
                <img
                  v-if="item.type === 'user' && item.photo"
                  :src="userPhotoUrl(item.photo)"
                  class="w-10 h-10 rounded-full object-cover border border-gray-200"
                  alt="user"
                >
                <div
                  v-else-if="item.type === 'user'"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'"
                >
                  {{ getUserInitials(item) }}
                </div>
                <div
                  v-else-if="item.type === 'general'"
                  class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
                >
                  <i class="fas fa-comments" />
                </div>
                <div
                  v-else-if="item.type === 'group'"
                  class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
                >
                  <i class="fas fa-users" />
                </div>
              
                <!-- Online indicator for users -->
                <span
                  v-if="item.type === 'user'"
                  class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  :class="isUserOnline(item) ? 'bg-green-500' : 'bg-gray-300'"
                />
              </div>
            
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <div
                    class="font-semibold text-sm truncate"
                    :class="isItemActive(item) ? 'text-white' : 'text-gray-900'"
                  >
                    {{ getItemTitle(item) }}
                  </div>
                  <div
                    class="text-[11px] shrink-0 flex items-center gap-1"
                    :class="isItemActive(item) ? 'text-white/80' : 'text-gray-400'"
                  >
                    <span v-if="item.lastMessageAt || item.lastMessage">{{ formatChatTime(item) }}</span>
                    <span
                      v-if="item.type === 'user' && chatLastTicks(item)"
                      class="text-sky-600"
                    >{{ chatLastTicks(item) }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2 mt-0.5">
                  <div
                    class="text-xs truncate"
                    :class="isItemActive(item) ? 'text-white/90' : 'text-gray-500'"
                  >
                    {{ getItemPreview(item) }}
                  </div>
                  <span
                    v-if="(item.unreadCount || 0) > 0"
                    class="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0"
                  >
                    {{ item.unreadCount }}
                  </span>
                </div>
              </div>
            </button>
          </template>
        </div>
      </aside>

      <!-- RIGHT: chat -->
      <section class="flex-1 min-w-0 flex flex-col">
        <!-- Top bar -->
        <div
          v-if="selectedChat && activePeerUser"
          class="px-4 py-1 border-b border-gray-200 bg-white"
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Left: User info -->
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <!-- Large avatar -->
              <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
                <img
                  v-if="activePeerUser.photo"
                  :src="userPhotoUrl(activePeerUser.photo)"
                  class="w-full h-full object-cover"
                  alt="user"
                >
                <div
                  v-else
                  class="w-full h-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-lg"
                >
                  {{ getUserInitials(activePeerUser) }}
                </div>
              </div>
            
              <!-- Name and status -->
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-gray-900 text-base">
                  {{ activePeerUser.name }} {{ activePeerUser.surname || "" }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  <span class="text-green-600">{{ presenceStatusText }}</span>
                  <span
                    v-if="activePeerUser.position"
                    class="ml-2"
                  >{{ activePeerUser.position }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <!-- Fallback header for non-direct chats -->
        <div
          v-else-if="selectedChat"
          class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              <i
                class="fas"
                :class="chatIcon(selectedChat)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-gray-900 truncate">
                {{ chatTitle(selectedChat) }}
              </div>
              <div class="text-xs text-gray-400 truncate">
                <span v-if="selectedChat.type === 'group' && selectedChat.creator">
                  Создал: {{ selectedChat.creator.name }} {{ selectedChat.creator.surname || "" }}
                </span>
                <span v-else>{{ presenceStatusText }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="showDeleteButton"
              class="w-9 h-9 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center"
              type="button"
              title="Удалить чат"
              @click="confirmDeleteChat"
            >
              <i class="fas fa-trash text-sm" />
            </button>
          </div>
        </div>

        <div
          v-if="selectedChat"
          class="px-3 py-2 border-b border-gray-200 bg-white flex items-center gap-2"
        >
          <div
            ref="messageSearchWrap"
            class="relative flex-1"
          >
            <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              v-model="messageSearchQuery"
              type="text"
              class="w-full h-9 pl-3 pr-9 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Поиск по сообщениям"
            >
            <div
              v-if="messageSearchResults.length > 0"
              class="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20"
            >
              <button
                v-for="msg in messageSearchResults"
                :key="msg.id"
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm"
                @click="goToSearchMessage(msg)"
              >
                <span class="text-gray-500 text-xs">{{ getMessageUserName(msg) }} · {{ messageTime(msg) }}</span>
                <div
                  class="truncate text-gray-900"
                  v-html="highlightSearchQuery(msg.body)"
                />
              </button>
            </div>
          </div>
          <i
            v-if="loadingSearch"
            class="fas fa-spinner fa-spin text-gray-400"
          />
        </div>

        <div
          v-if="selectedChat && selectedChat.pinnedMessage"
          class="w-full px-3 py-2 border-b border-gray-200 bg-amber-50/80 hover:bg-amber-100/80 text-left flex items-center gap-2 text-sm text-gray-700"
        >
          <button
            type="button"
            class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-200/80"
            title="Открепить"
            @click.stop="unpinMessage()"
          >
            <i class="fas fa-thumbtack text-xs" />
          </button>
          <span
            class="truncate flex-1 cursor-pointer"
            @click="scrollToMessageId = selectedChat.pinnedMessage.id"
          >Закреплено: {{ pinnedMessageSnippet }}</span>
        </div>
        <div
          v-else-if="selectedChat"
          class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white"
        >
          <div class="font-semibold text-gray-900">
            {{ $t("messenger") }}
          </div>
        </div>

        <!-- Messages area -->
        <div class="flex-1 min-h-0 relative flex flex-col">
          <div
            ref="messagesWrap"
            class="flex-1 min-h-0 messenger-bg overflow-y-auto messages-scroll"
            @scroll="onMessagesScroll"
          >
            <div
              v-if="!selectedChat"
              class="h-full flex items-center justify-center p-6"
            >
              <div class="text-center text-gray-600">
                <div class="mx-auto w-14 h-14 rounded-full bg-white/70 border border-white/60 flex items-center justify-center">
                  <i class="fas fa-comments text-xl text-sky-600" />
                </div>
                <div class="mt-3 font-semibold">
                  Откройте чат
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  Слева выберите сотрудника или общий чат
                </div>
              </div>
            </div>

            <div
              v-else
              class="p-4 md:p-6 space-y-3"
            >
              <!-- Индикатор загрузки старых сообщений -->
              <div
                v-if="loadingOlderMessages"
                class="flex justify-center py-2"
              >
                <div class="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-xs text-gray-600 border border-white/80 shadow-sm flex items-center gap-2">
                  <i class="fas fa-spinner fa-spin" />
                  Загрузка сообщений...
                </div>
              </div>
          
              <div
                v-if="loadingMessages"
                class="text-sm text-gray-600"
              >
                Загрузка…
              </div>

              <template v-else>
                <!-- "Новые сообщения" separator (if there are unread messages) -->
                <div
                  v-if="hasUnreadMessages"
                  class="flex items-center gap-3 my-3"
                >
                  <div class="flex-1 h-px bg-gray-300" />
                  <div class="text-xs text-gray-500 font-medium px-2">
                    Новые сообщения
                  </div>
                  <div class="flex-1 h-px bg-gray-300" />
                </div>

                <div
                  v-for="group in messageGroups"
                  :key="group.id"
                  class="relative"
                >
                  <!-- Sticky Date Header -->
                  <div class="sticky top-0 z-10 flex justify-center my-3 -mx-4 md:-mx-6 py-2 bg-transparent pointer-events-none">
                    <div class="px-3 py-1 rounded-full bg-[#c3e3a7] text-xs text-gray-700 shadow-sm pointer-events-auto font-medium">
                      {{ group.dateLabel }}
                    </div>
                  </div>

                  <!-- Messages -->
                  <div
                    v-for="message in group.messages"
                    :id="'msg-' + message.id"
                    :key="message.id"
                    class="flex mb-1 group message-item"
                    :class="[isMyMessage(message) ? 'justify-end' : 'justify-start', { 'message-item-last': isLastMessage(group, message) }]"
                    @contextmenu.prevent="showMessageMenu($event, message)"
                  >
                    <div 
                      class="flex flex-col max-w-[75%]"
                      :class="isMyMessage(message) ? 'items-end' : 'items-start'"
                    >
                      <!-- Sender name (only for incoming messages in group chats) -->
                      <div 
                        v-if="!isMyMessage(message) && shouldShowSenderName(message)"
                        class="text-xs font-medium mb-1 ml-3"
                        :style="{ color: getUserColor(message) }"
                      >
                        {{ getMessageUserName(message) }}
                      </div>

                      <div class="flex items-end gap-2">
                        <div
                          class="rounded-2xl px-3 py-2 text-sm shadow-sm relative"
                          :class="isMyMessage(message) ? 'bg-[#d9f6c9] text-gray-900 rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm'"
                        >
                          <!-- Reply preview -->
                          <div
                            v-if="message.parent"
                            class="mb-2 pb-2 border-l-2 border-gray-400 pl-2 text-xs text-gray-600"
                          >
                            <div class="font-medium text-gray-700">
                              {{ getMessageUserName(message.parent) }}
                            </div>
                            <div class="truncate">
                              {{ message.parent.body || (message.parent.files?.length ? `Файлов: ${message.parent.files.length}` : '') }}
                            </div>
                          </div>

                          <!-- Forwarded from header (Telegram style) -->
                          <div
                            v-if="message.forwardedFrom"
                            class="mb-2 pb-1"
                          >
                            <div class="text-xs font-medium text-green-600 flex items-center gap-1.5 mb-1">
                              <span>Переслано от</span>
                              <span class="font-semibold text-green-600">{{ getForwardedUserName(message.forwardedFrom) }}</span>
                            </div>
                            <!-- Forwarded message content -->
                            <div class="text-sm text-gray-900">
                              <div
                                v-if="message.forwardedFrom.body"
                                class="break-words"
                              >
                                {{ message.forwardedFrom.body }}
                              </div>
                              <div
                                v-if="Array.isArray(message.forwardedFrom.files) && message.forwardedFrom.files.length"
                                class="mt-1 space-y-1"
                              >
                                <div
                                  v-for="f in message.forwardedFrom.files"
                                  :key="f.path"
                                  class="flex items-center gap-2"
                                >
                                  <button
                                    v-if="isImageFile(f)"
                                    type="button"
                                    class="block max-w-xs rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                    @click="openImageModal(f)"
                                  >
                                    <img
                                      :src="fileUrl(f.path)"
                                      :alt="f.name"
                                      class="max-h-32 object-contain"
                                    >
                                  </button>
                                  <a
                                    v-else
                                    class="block text-xs underline text-gray-600 hover:text-gray-800"
                                    :href="fileUrl(f.path)"
                                    target="_blank"
                                  >
                                    <i class="fas fa-file mr-1" />{{ f.name }}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Additional comment text (only if different from forwarded message) -->
                          <div
                            v-if="message.body && (!message.forwardedFrom || message.body !== message.forwardedFrom.body)"
                            :class="isMessageOnlyEmoji(message) ? 'flex items-center justify-center py-2 text-5xl leading-none' : 'whitespace-pre-wrap break-words leading-snug mt-2'"
                          >
                            {{ message.body }}
                          </div>

                          <div
                            v-if="Array.isArray(message.files) && message.files.length"
                            class="mt-2 space-y-1"
                          >
                            <div
                              v-for="f in message.files"
                              :key="f.path"
                              class="flex items-center gap-2"
                            >
                              <button
                                v-if="isImageFile(f)"
                                type="button"
                                class="block max-w-xs rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                @click="openImageModal(f)"
                              >
                                <img
                                  :src="fileUrl(f.path)"
                                  :alt="f.name"
                                  class="max-h-48 object-contain"
                                >
                              </button>
                              <div
                                v-else-if="isAudioFile(f)"
                                :ref="el => setVoiceBlockRef(message, f, el)"
                                class="flex items-center gap-2 p-2 bg-gray-100 rounded-lg min-w-[200px]"
                              >
                                <button
                                  type="button"
                                  class="w-8 h-8 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0"
                                  @click="playPauseVoice(message, getMessageFileIndex(message, f), f)"
                                >
                                  <i
                                    class="fas text-xs"
                                    :class="voicePlaying(message, getMessageFileIndex(message, f)) ? 'fa-pause' : 'fa-play'"
                                  />
                                </button>
                                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <input
                                    type="range"
                                    class="w-full h-1.5 rounded accent-sky-500 cursor-pointer"
                                    :value="voiceCurrentTime(message, getMessageFileIndex(message, f))"
                                    :max="voiceDuration(message, getMessageFileIndex(message, f)) || 100"
                                    min="0"
                                    step="0.1"
                                    @input="seekVoice(message, getMessageFileIndex(message, f), $event)"
                                  >
                                  <div class="flex justify-between text-xs text-gray-500">
                                    <span>{{ formatVoiceTime(voiceCurrentTime(message, getMessageFileIndex(message, f))) }}</span>
                                    <span>{{ formatVoiceTime(voiceDuration(message, getMessageFileIndex(message, f))) }}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  class="shrink-0 text-xs font-medium text-gray-600 hover:text-sky-600 px-1.5 py-0.5 rounded"
                                  @click="cycleVoiceSpeed(message, getMessageFileIndex(message, f))"
                                >
                                  {{ voiceSpeedLabel(message, getMessageFileIndex(message, f)) }}
                                </button>
                              </div>
                              <a
                                v-else
                                class="block text-xs underline text-sky-700"
                                :href="fileUrl(f.path)"
                                target="_blank"
                              >
                                <i class="fas fa-file mr-1" />{{ f.name }}
                              </a>
                            </div>
                          </div>

                          <div
                            v-if="message.failed"
                            class="mt-2 pt-2 border-t border-gray-200/80 flex items-center justify-between gap-2"
                          >
                            <span class="text-xs text-red-600">Не удалось отправить</span>
                            <button
                              type="button"
                              class="text-xs font-medium text-sky-600 hover:text-sky-700"
                              @click="retrySendMessage(message)"
                            >
                              Повторить
                            </button>
                          </div>
                          <!-- Reactions left, then time and status (Telegram-style) -->
                          <div
                            class="mt-1 flex items-center justify-end gap-1.5 flex-wrap"
                            :class="isMyMessage(message) ? 'text-gray-600' : 'text-gray-500'"
                          >
                            <div class="flex items-center gap-0.5 mr-1">
                              <button
                                v-for="g in messageReactionsGrouped(message)"
                                :key="g.emoji"
                                type="button"
                                class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs min-w-[24px] justify-center"
                                :class="g.my ? 'bg-sky-100/90 text-sky-700' : 'bg-black/5 text-gray-700'"
                                @click="toggleReaction(message, g.emoji)"
                              >
                                <span>{{ g.emoji }}</span>
                                <span
                                  v-if="g.count > 1"
                                  class="text-[10px]"
                                >{{ g.count }}</span>
                              </button>
                              <button
                                type="button"
                                class="w-6 h-6 rounded opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:bg-black/10 hover:text-gray-600 flex items-center justify-center text-xs transition-opacity"
                                title="Добавить реакцию"
                                @click.stop="openReactionPicker(message.id)"
                              >
                                <i class="fas fa-smile" />
                              </button>
                              <div
                                v-if="reactionPickerMessageId === message.id"
                                class="inline-flex gap-0.5 ml-0.5 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
                              >
                                <button
                                  v-for="e in reactionEmojis"
                                  :key="e"
                                  type="button"
                                  class="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-lg"
                                  @click.stop="toggleReaction(message, e)"
                                >
                                  {{ e }}
                                </button>
                              </div>
                            </div>
                            <span
                              v-if="message.isEdited"
                              class="flex items-center gap-0.5 text-gray-500 mr-1 text-[11px]"
                            >
                              <i class="fas fa-pencil-alt text-[9px]" />
                              <span class="italic">изменено</span>
                            </span>
                            <span class="text-[11px] leading-none">{{ messageTime(message) }}</span>
                            <span
                              v-if="isMyMessage(message)"
                              class="ml-0.5 text-[11px] inline-flex items-center"
                            >
                              <i
                                v-if="message.pending"
                                class="fas fa-spinner fa-spin text-gray-400 text-[10px]"
                              />
                              <span
                                v-else
                                class="text-green-600"
                              >{{ messageTicks(message) }}</span>
                            </span>
                          </div>
                        </div>
                        <div class="self-start shrink-0 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 text-xs border border-gray-200/80"
                            @click.stop="showMessageMenu($event, message)"
                          >
                            <i class="fas fa-ellipsis-v" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="typingUser && selectedChat && Number(typingUser.chatId) === Number(selectedChat.id)"
                  class="flex justify-start mt-1 mb-1"
                >
                  <div class="typing-indicator-inline rounded-2xl rounded-tl-sm px-3 py-2 bg-white text-xs text-gray-600 shadow-sm flex items-center gap-1.5 max-w-[75%]">
                    <span>{{ typingUserDisplay }} печатает</span>
                    <span class="typing-dots">
                      <span class="typing-dot" />
                      <span class="typing-dot" />
                      <span class="typing-dot" />
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <button
            v-if="selectedChat && !messagesAtBottom"
            type="button"
            class="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-lg text-gray-600 hover:bg-gray-50 hover:text-sky-600 flex items-center justify-center transition-colors z-10"
            title="В конец чата"
            @click="scrollToBottomAndResetNewCount"
          >
            <i class="fas fa-chevron-down text-lg" />
            <span
              v-if="newMessagesBelowCount > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center"
            >
              {{ newMessagesBelowCount > 99 ? '99+' : newMessagesBelowCount }}
            </span>
          </button>
        </div>

        <!-- Composer (Telegram-like) -->
        <div
          ref="composerArea"
          class="px-3 py-2 bg-[#f4f4f5] border-t border-gray-200/80 min-h-[52px] flex flex-col justify-end transition-colors"
          :class="{ 'bg-sky-100/50 ring-2 ring-sky-300 ring-inset': composerDropActive }"
          @paste="onComposerPaste"
          @dragover.prevent="onComposerDragover"
          @dragleave="onComposerDragleave"
          @drop.prevent="onComposerDrop"
        >
          <div
            v-if="replyingTo"
            class="mb-2 py-1.5 px-3 rounded-xl bg-white/80 border border-gray-200/80 flex items-start justify-between gap-2"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-gray-700 mb-0.5">
                Ответ на сообщение от {{ getMessageUserName(replyingTo) }}
              </div>
              <div class="text-xs text-gray-600 truncate">
                {{ replyingTo.body || (replyingTo.files?.length ? `Файлов: ${replyingTo.files.length}` : '') }}
              </div>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 shrink-0 p-1"
              @click="replyingTo = null"
            >
              <i class="fas fa-times text-sm" />
            </button>
          </div>

          <div
            v-if="selectedFiles.length && !editingMessage"
            class="mb-2 flex flex-wrap gap-2"
          >
            <div
              v-for="(f, idx) in selectedFiles"
              :key="`${f.name}-${idx}`"
              class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 bg-white rounded-xl border border-gray-200/80 text-xs text-gray-700 shadow-sm"
            >
              <i class="fas fa-file text-sky-500 shrink-0" />
              <span class="max-w-[100px] truncate">{{ f.name }}</span>
              <button
                type="button"
                class="shrink-0 w-6 h-6 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                title="Удалить"
                @click="removeSelectedFile(idx)"
              >
                <i class="fas fa-times text-[10px]" />
              </button>
            </div>
          </div>

          <div
            v-if="editingMessage && editingMessageFiles.length"
            class="mb-2 flex flex-wrap gap-2"
          >
            <div
              v-for="(f, idx) in editingMessageFiles"
              :key="`edit-${f.path}-${idx}`"
              class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 bg-white rounded-xl border border-gray-200/80 text-xs text-gray-700 shadow-sm"
            >
              <i class="fas fa-file text-sky-500 shrink-0" />
              <span class="max-w-[100px] truncate">{{ f.name || f.path || 'Файл' }}</span>
              <button
                type="button"
                class="shrink-0 w-6 h-6 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                title="Убрать из сообщения"
                @click="removeEditingFile(idx)"
              >
                <i class="fas fa-times text-[10px]" />
              </button>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept="*/*"
            @change="onFilesSelected"
          >
          <input
            ref="audioInput"
            type="file"
            class="hidden"
            accept="audio/*"
            @change="onAudioSelected"
          >

          <div
            v-if="isRecordingAudio"
            class="flex items-center gap-3 py-1.5 px-3 rounded-2xl bg-white border border-gray-200/80 shadow-sm"
          >
            <button
              type="button"
              class="w-9 h-9 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
              title="Отменить"
              @click="cancelAudioRecording"
            >
              <i class="fas fa-trash-alt text-sm" />
            </button>
            <div class="flex-1 flex items-center gap-2 min-w-0">
              <i class="fas fa-circle animate-pulse text-red-500 text-xs shrink-0" />
              <span class="text-sm font-medium text-gray-700">{{ audioRecordingTime }} с</span>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center shrink-0 disabled:opacity-50"
              :disabled="!selectedChat || !canWrite"
              title="Добавить в сообщение и продолжить набор"
              @click="addVoiceToMessage"
            >
              <i class="fas fa-plus text-sm" />
            </button>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0 disabled:opacity-50"
              :disabled="!selectedChat || !canWrite || sending"
              title="Отправить голосовое"
              @click="sendVoiceRecording"
            >
              <i class="fas fa-paper-plane text-sm" />
            </button>
          </div>

          <div
            v-else
            class="flex items-center gap-2 min-h-[44px]"
          >
            <div
              ref="emojiPickerWrap"
              class="relative flex items-center gap-0.5 shrink-0"
            >
              <button
                type="button"
                class="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-200/80 flex items-center justify-center disabled:opacity-50 transition-colors"
                :disabled="!selectedChat || !canWrite || selectedFiles.length >= maxFilesPerSend"
                :title="selectedFiles.length >= maxFilesPerSend ? `Макс. ${maxFilesPerSend} файлов` : 'Прикрепить файл'"
                @click="$refs.fileInput?.click()"
              >
                <i class="fas fa-paperclip text-lg" />
              </button>
              <button
                type="button"
                class="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-200/80 flex items-center justify-center disabled:opacity-50 transition-colors"
                :disabled="!selectedChat || !canWrite"
                :class="{ 'bg-gray-200/80': showEmojiPicker }"
                title="Смайл"
                @click="showEmojiPicker = true"
              >
                <i class="fas fa-smile text-lg" />
              </button>
              <button
                type="button"
                class="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-200/80 flex items-center justify-center disabled:opacity-50 transition-colors"
                :disabled="!selectedChat || !canWrite || selectedFiles.length >= maxFilesPerSend"
                :title="selectedFiles.length >= maxFilesPerSend ? `Макс. ${maxFilesPerSend} файлов` : 'Записать аудио'"
                @click="toggleAudioRecording"
              >
                <i class="fas fa-microphone text-lg" />
              </button>
            </div>

            <div class="flex-1 min-w-0 flex flex-col justify-center rounded-2xl bg-white border border-gray-200/80 shadow-sm focus-within:border-sky-400/60 focus-within:ring-1 focus-within:ring-sky-400/30 transition-shadow">
              <textarea
                ref="composerTextarea"
                v-model="draft"
                class="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2.5 px-4 min-h-[24px] max-h-28"
                :placeholder="editingMessage ? 'Редактирование...' : 'Сообщение'"
                :disabled="!selectedChat || !canWrite"
                @keydown.enter.exact.prevent="handleEnterKey"
                @keydown.enter.shift.exact="handleShiftEnter"
                @keydown.esc.exact="cancelEdit"
              />
            </div>

            <div class="shrink-0">
              <button
                v-if="!editingMessage"
                class="w-10 h-10 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                :disabled="!selectedChat || !canWrite || sending || (!draft.trim() && selectedFiles.length === 0 && !audioBlob)"
                type="button"
                title="Отправить"
                @click="send"
              >
                <i class="fas fa-paper-plane text-sm" />
              </button>
              <button
                v-else
                class="w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                :disabled="!selectedChat || !canWrite || sending || saveEditLoading || !draft.trim()"
                type="button"
                title="Сохранить изменения"
                @click="saveEdit"
              >
                <i
                  v-if="saveEditLoading"
                  class="fas fa-spinner fa-spin text-sm"
                />
                <i
                  v-else
                  class="fas fa-check text-sm"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Emoji picker modal -->
      <div
        v-if="showEmojiPicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showEmojiPicker = false"
      >
        <div
          ref="emojiPickerModal"
          class="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col"
          @click.stop
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-900">Смайлы</span>
            <button
              type="button"
              class="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"
              @click="showEmojiPicker = false"
            >
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="p-4 overflow-y-auto grid grid-cols-6 gap-2">
            <button
              v-for="(emoji, idx) in composerEmojis"
              :key="idx"
              type="button"
              class="w-12 h-12 rounded-xl hover:bg-gray-100 flex items-center justify-center text-3xl transition-colors"
              @click="insertEmoji(emoji); showEmojiPicker = false"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Chat Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              Удалить групповой чат?
            </h3>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-gray-600">
              Вы уверены, что хотите удалить чат "{{ selectedChat?.title }}"? 
              Это действие нельзя отменить. Все сообщения и участники будут удалены.
            </p>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              :disabled="deletingChat"
              @click="showDeleteConfirm = false"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingChat"
              @click="deleteChat"
            >
              <span v-if="deletingChat">Удаление...</span>
              <span v-else>Удалить</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Create Group Chat Modal -->
      <div
        v-if="showCreateGroupModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="closeCreateGroupModal"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Создать групповой чат
            </h3>
            <button
              type="button"
              class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              @click="closeCreateGroupModal"
            >
              <i class="fas fa-times text-sm" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <!-- Title input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Название чата</label>
              <input
                v-model="groupTitle"
                type="text"
                class="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Введите название группы"
                maxlength="255"
              >
            </div>

            <!-- Users selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Участники ({{ selectedUserIds.length }} выбрано)
              </label>
              <div class="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                <div
                  v-for="user in usersForCompany.filter(u => u && u.id !== $store.state.user?.id)"
                  :key="user.id"
                  class="px-3 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  @click="toggleUserSelection(user.id)"
                >
                  <div class="relative shrink-0">
                    <img
                      v-if="user.photo"
                      :src="userPhotoUrl(user.photo)"
                      class="w-10 h-10 rounded-full object-cover border border-gray-200"
                      alt="user"
                    >
                    <div
                      v-else
                      class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-green-100 text-green-700"
                    >
                      {{ getUserInitials(user) }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-sm text-gray-900 truncate">
                      {{ user.name }} {{ user.surname || "" }}
                    </div>
                    <div
                      v-if="user.position"
                      class="text-xs text-gray-500 truncate"
                    >
                      {{ user.position }}
                    </div>
                  </div>
                  <div
                    class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                    :class="selectedUserIds.includes(Number(user.id)) ? 'bg-sky-500 border-sky-500' : 'border-gray-300'"
                  >
                    <i
                      v-if="selectedUserIds.includes(Number(user.id))"
                      class="fas fa-check text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              @click="closeCreateGroupModal"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canCreateGroup"
              @click="createGroupChat"
            >
              <span v-if="creatingGroup">Создание...</span>
              <span v-else>Создать</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Message Context Menu -->
      <div
        v-if="messageMenuVisible"
        ref="messageMenuEl"
        class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100] min-w-[160px]"
        :style="messageMenuStyle"
        @click.stop
      >
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          @click="replyToMessage(messageMenuTarget)"
        >
          <i class="fas fa-reply text-xs" />
          Ответить
        </button>
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          @click="forwardMessage(messageMenuTarget)"
        >
          <i class="fas fa-share text-xs" />
          Переслать
        </button>

        <template v-if="!String(messageMenuTarget?.id).startsWith('temp-')">
          <div class="border-t border-gray-200 my-1" />
          <button
            v-if="selectedChat && selectedChat.pinnedMessage?.id !== messageMenuTarget?.id"
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            @click="confirmPinMessage(messageMenuTarget)"
          >
            <i class="fas fa-thumbtack text-xs" />
            Закрепить
          </button>
          <button
            v-if="selectedChat && selectedChat.pinnedMessage?.id === messageMenuTarget?.id"
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            @click="unpinMessage(); closeMessageMenu()"
          >
            <i class="fas fa-thumbtack text-xs rotate-45" />
            Открепить
          </button>
        </template>

        <!-- Edit and Delete options only for own messages -->
        <template v-if="isMyMessage(messageMenuTarget)">
          <div class="border-t border-gray-200 my-1" />
          <button
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            @click="editMessage(messageMenuTarget)"
          >
            <i class="fas fa-edit text-xs" />
            Редактировать
          </button>
          <button
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            @click="deleteMessage(messageMenuTarget)"
          >
            <i class="fas fa-trash text-xs" />
            {{ selectedChat?.type === 'group' ? 'Удалить у всех' : 'Удалить сообщение' }}
          </button>
        </template>
      </div>

      <!-- Forward Message Modal -->
      <div
        v-if="showForwardModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showForwardModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              Переслать сообщение
            </h3>
          </div>
          <div class="px-6 py-4 max-h-96 overflow-y-auto">
            <div class="space-y-2">
              <button
                v-for="chat in allChatsList.filter(c => c.id !== selectedChatId)"
                :key="`${chat.type}-${chat.id}`"
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 rounded-lg border"
                :class="forwardTarget && String(forwardTarget.type) === String(chat.type) && Number(forwardTarget.id) === Number(chat.id) ? 'border-sky-500 bg-sky-50' : 'border-transparent'"
                @click="selectForwardTarget(chat)"
              >
                <div class="relative shrink-0">
                  <img
                    v-if="chat.type === 'user' && chat.photo"
                    :src="userPhotoUrl(chat.photo)"
                    class="w-10 h-10 rounded-full object-cover border border-gray-200"
                    alt="user"
                  >
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
                    <i class="fas fa-comments" />
                  </div>
                  <div
                    v-else-if="chat.type === 'group'"
                    class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700"
                  >
                    <i class="fas fa-users" />
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
            <div
              v-if="forwardTarget"
              class="text-xs text-gray-600 mb-2"
            >
              Кому: <span class="font-medium text-gray-900">{{ getItemTitle(forwardTarget) }}</span>
            </div>

            <textarea
              v-model="forwardText"
              class="w-full bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300 outline-none text-sm text-gray-900 placeholder:text-gray-400 min-h-[44px] max-h-28 resize-none"
              placeholder="Добавить сообщение (как в Telegram)..."
              :disabled="forwardingSending"
            />

            <div class="mt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                :disabled="forwardingSending"
                @click="closeForwardModal"
              >
                Отмена
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="forwardingSending || !forwardTarget"
                @click="sendForward"
              >
                <span v-if="forwardingSending">Отправка…</span>
                <span v-else>Отправить</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Click outside to close menu -->
      <div
        v-if="messageMenuVisible"
        class="fixed inset-0 z-40"
        @click="closeMessageMenu"
      />

      <!-- Pin message dialog: info icon, two options -->
      <div
        v-if="showPinConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
        @click.self="closePinConfirm"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
          <div class="flex items-start gap-4 p-5">
            <div class="shrink-0 w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <i class="fas fa-info text-sky-600 text-lg" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900">
                Закрепить сообщение
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                Закреплённое сообщение увидят все участники чата.
              </p>
            </div>
          </div>
          <div class="px-5 pb-4 flex flex-col gap-2">
            <button
              type="button"
              class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
              :disabled="pinConfirmLoading"
              @click="doPinConfirm"
            >
              <span v-if="pinConfirmLoading">Закрепление…</span>
              <span v-else>Закрепить</span>
            </button>
            <button
              type="button"
              class="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              :disabled="pinConfirmLoading"
              @click="closePinConfirm"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      <!-- Image Viewer Modal -->
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        @click.self="closeImageModal"
      >
        <div class="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
          <button
            type="button"
            class="absolute top-0 right-0 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center z-10"
            @click="closeImageModal"
          >
            <i class="fas fa-times text-lg" />
          </button>
          <img
            v-if="selectedImage"
            :src="fileUrl(selectedImage.path)"
            :alt="selectedImage.name"
            class="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            @click.stop
          >
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import ChatController from "@/api/ChatController";
import { getCurrentServerDateObject, getCurrentServerStartOfDay } from "@/utils/dateUtils";
import echo from "@/services/echo";
import { applySentMessage, handleChatReadEvent, handleIncomingChatEvent } from "@/services/messengerFacade";
import globalChatRealtime from "@/services/globalChatRealtime";
import { eventBus } from "@/eventBus";
import ChatSkeleton from "@/views/components/app/ChatSkeleton.vue";

const buildStorageUrl = (path) => `${import.meta.env.VITE_APP_BASE_URL}/storage/${path}`;

const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  // Laravel sends dates in Asia/Ashgabat timezone (UTC+5)
  // Parse without 'Z' to treat as local time (server timezone)
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(dateString)) {
    // Replace space with 'T' for ISO format, but DON'T add 'Z' (which means UTC)
    return new Date(dateString.replace(' ', 'T'));
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const extractHHmm = (raw) => {
  if (!raw) return "";
  
  // Извлекаем время напрямую из строки без конвертации timezone
  // Формат: "2024-01-20 17:23:45" -> "17:23"
  const match = raw.match(/(\d{2}):(\d{2}):\d{2}/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  
  // Fallback для других форматов
  const date = parseDateSafe(raw);
  if (!date) return "";
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// formatDayLabel will be a method that uses i18n

// formatChatTime will be a method that uses i18n

export default {
  components: {
    ChatSkeleton,
  },
  data() {
    return {
      search: "",

      chats: [],
      loadingChats: false,

      selectedChat: null,
      selectedChatId: null,
      generalChat: null,
      activePeerUser: null,
      messages: [],
      loadingMessages: false,
      loadingOlderMessages: false,
      hasMoreMessages: true,

      draft: "",
      selectedFiles: [],
      sending: false,
      saveEditLoading: false,
      replyingTo: null,
      editingMessage: null,
      editingMessageFiles: [],
      audioBlob: null,
      isRecordingAudio: false,
      audioRecordingTime: 0,
      audioRecordingInterval: null,
      mediaRecorder: null,
      audioRecordingCancelled: false,
      audioRecordingSendAfterStop: false,
      audioRecordingAddToMessageOnly: false,
      _audioStream: null,
      _preloadQueue: [],
      _preloadKey: null,
      _voiceObserver: null,

      onlineUserIds: [],
      peerReadByChatId: {},
      
      // Group chat creation modal
      showCreateGroupModal: false,
      groupTitle: "",
      selectedUserIds: [],
      creatingGroup: false,
      
      showDeleteConfirm: false,
      deletingChat: false,
      reactionPickerMessageId: null,
      reactionEmojis: ['👍', '👎', '❤️', '😂', '😮', '😢'],
      maxFilesPerSend: 4,
      maxFileSizeBytes: 50 * 1024 * 1024,

      typingUser: null,
      typingTimeout: null,
      _typingDebounceTimer: null,

      composerDropActive: false,
      showEmojiPicker: false,
      composerEmojis: ['😀', '😊', '🥰', '😘', '😍', '🤗', '👍', '👎', '❤️', '😂', '😮', '😢', '👏', '🙌', '😅', '🤣', '😭', '😡', '🥱', '😴', '🤔', '😎', '🔥', '✨', '💯'],

      messageSearchQuery: '',
      messageSearchResults: [],
      loadingSearch: false,
      scrollToMessageId: null,
      _messageSearchDebounce: null,
      messagesAtBottom: true,
      newMessagesBelowCount: 0,

      voiceCurrent: null,
      voicePlayerState: {},

      _pendingRetryByTempId: {},

      // Message menu
      messageMenuVisible: false,
      messageMenuX: 0,
      messageMenuY: 0,
      messageMenuAdjustedY: 0,
      messageMenuTarget: null,
      showPinConfirm: false,
      pendingPinMessage: null,
      pinConfirmLoading: false,

      // Forward message modal
      showForwardModal: false,
      forwardingMessage: null,
      forwardTarget: null,
      forwardText: "",
      forwardingSending: false,

      // Image viewer modal
      showImageModal: false,
      selectedImage: null,
      
    };
  },
  computed: {
    messageMenuStyle() {
      const left = this.isMyMessage(this.messageMenuTarget) ? (this.messageMenuX - 160) : this.messageMenuX;
      return {
        left: left + 'px',
        top: this.messageMenuAdjustedY + 'px',
      };
    },
    hasChatsView() {
      return this.$store.getters.hasPermission("chats_view_all");
    },
    canWrite() {
      return this.$store.getters.hasPermission("chats_write");
    },
    usersForCompany() {
      return this.$store.getters.usersForCurrentCompany || [];
    },
    filteredUsers() {
      const q = (this.search || "").trim().toLowerCase();
      const users = this.usersForCompany.filter((u) => u && u.id !== this.$store.state.user?.id);
      
      if (!q) return users;
      return users.filter((u) => {
        const s = `${u.name || ""} ${u.surname || ""} ${u.email || ""}`.toLowerCase();
        return s.includes(q);
      });
    },
    allChatsList() {
      const list = [];
      const q = (this.search || "").trim().toLowerCase();
      
      // Add general chat
      if (this.generalChat) {
        if (!q || this.generalChat.title?.toLowerCase().includes(q)) {
          list.push({ ...this.generalChat, type: 'general' });
        }
      }
      
      // Add direct chats (from chats list)
      const directChats = (this.chats || []).filter(c => c.type === 'direct');
      directChats.forEach(chat => {
        const peerId = this.getPeerUserId(chat);
        if (peerId) {
          const user = this.usersForCompany.find(u => Number(u.id) === Number(peerId));
          if (user) {
            const title = `${user.name} ${user.surname || ""}`.trim();
            if (!q || title.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q)) {
              list.push({
                ...chat,
                type: 'user',
                ...user,
                displayTitle: title,
                chatId: chat.id,
              });
            }
          }
        }
      });
      
      // Add group chats
      const groupChats = (this.chats || []).filter(c => c.type === 'group');
      groupChats.forEach(chat => {
        if (!q || chat.title?.toLowerCase().includes(q)) {
          list.push({ ...chat, type: 'group' });
        }
      });
      
      // Add users without direct chats
      this.filteredUsers.forEach(user => {
        const hasDirectChat = list.some(item => item.type === 'user' && Number(item.id) === Number(user.id));
        if (!hasDirectChat) {
          list.push({
            ...user,
            type: 'user',
            id: user.id,
            displayTitle: `${user.name} ${user.surname || ""}`.trim(),
          });
        }
      });
      
      // Sort by lastMessageAt
      return list.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
    },
    messageGroups() {
      if (!this.messages || this.messages.length === 0) return [];
      
      const groups = [];
      let currentGroup = null;
      
      this.messages.forEach((message) => {
        const messageDate = this.parseDate(message.createdAt);
        // Fallback or skip if invalid? We'll assume valid or use current date fallback
        const dateObj = messageDate || getCurrentServerDateObject();
        const day = new Date(dateObj);
        day.setHours(0, 0, 0, 0);
        const dayTime = day.getTime();
        
        if (!currentGroup || currentGroup.date.getTime() !== dayTime) {
          currentGroup = {
            id: `date-${dayTime}`,
            date: day,
            dateLabel: this.formatDayLabel(day),
            messages: []
          };
          groups.push(currentGroup);
        }
        
        currentGroup.messages.push(message);
      });
      
      return groups;
    },
    presenceStatusText() {
      if (!this.selectedChat) return "Выберите сотрудника или общий чат слева";
      if (this.selectedChat.type === "direct" && this.activePeerUser) {
        return this.isUserOnline(this.activePeerUser) ? "Онлайн" : "Оффлайн";
      }
      return "Онлайн";
    },
    typingUserDisplay() {
      if (!this.typingUser?.user) return '';
      const u = this.typingUser.user;
      return [u.name, u.surname].filter(Boolean).join(' ').trim() || 'Кто-то';
    },
    pinnedMessageSnippet() {
      const pm = this.selectedChat?.pinnedMessage;
      if (!pm) return '';
      const body = (pm.body ).trim();
      const who = pm.user ? [pm.user.name, pm.user.surname].filter(Boolean).join(' ').trim() : '';
      if (body) return (who ? who + ': ' : '') + (body.length > 50 ? body.slice(0, 50) + '…' : body);
      return who || 'Сообщение';
    },
    hasUnreadMessages() {
      // Определяем, есть ли непрочитанные сообщения выше текущей позиции прокрутки
      // Можно использовать last_read_message_id для более точного определения
      if (!this.selectedChat || !this.messages.length) return false;
      
      const myId = this.$store.state.user?.id;
      if (!myId) return false;
      
      // Проверяем, есть ли сообщения от других пользователей после последнего прочитанного
      // Это упрощенная версия - можно улучшить
      return false;
    },
    canCreateGroup() {
      return (
        !this.creatingGroup &&
        this.groupTitle.trim().length > 0 &&
        this.selectedUserIds.length > 0
      );
    },
    showDeleteButton() {
      return this.selectedChat && this.isChatCreator(this.selectedChat);
    },
  },
  watch: {
    '$store.getters.currentCompanyId': {
      handler(newCompanyId, oldCompanyId) {
        if (newCompanyId && newCompanyId !== oldCompanyId) {
          this.handleCompanyChange();
        }
      },
      immediate: false
    },
    draft() {
      this.scheduleSendTyping();
    },
    selectedChatId() {
      this.typingUser = null;
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
      this.messageSearchQuery = '';
      this.messageSearchResults = [];
      this.newMessagesBelowCount = 0;
    },
    messageSearchQuery(val) {
      if (this._messageSearchDebounce) clearTimeout(this._messageSearchDebounce);
      if (!val || !this.selectedChatId) {
        this.messageSearchResults = [];
        return;
      }
      this._messageSearchDebounce = setTimeout(() => {
        this._messageSearchDebounce = null;
        this.runMessageSearch();
      }, 300);
    },
    scrollToMessageId(id) {
      if (!id) return;
      this.$nextTick(() => {
        const wrap = this.$refs.messagesWrap;
        const el = document.getElementById('msg-' + id);
        if (wrap && el) {
          const wrapRect = wrap.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const relativeTop = elRect.top - wrapRect.top + wrap.scrollTop;
          const targetScroll = relativeTop - (wrap.clientHeight / 2) + (el.offsetHeight / 2);
          wrap.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
        this.scrollToMessageId = null;
      });
    }
  },
  async mounted() {
    try {
      await this.ensureUsersLoaded();
      await this.loadChats();
      
      // НЕ синхронизируем чаты здесь - глобальный сервис уже подписан на все чаты при инициализации
      // Синхронизация нужна только при создании нового чата
      
      // Получаем список онлайн пользователей из глобального сервиса
      this.onlineUserIds = globalChatRealtime.getOnlineUserIds();
      
      this.setupEventListeners();
      document.addEventListener('keydown', this.handleGlobalKeydown);
      document.addEventListener('click', this.closeMessageSearchOnClickOutside);

      setTimeout(() => {
        this.checkWebSocketStatus();
      }, 2000);
    } catch (error) {
      console.error("[Messenger] Ошибка при инициализации:", error);
      this.$store.dispatch("showNotification", {
        title: "Ошибка загрузки чата",
        subtitle: error?.message || "Попробуйте обновить страницу",
        isDanger: true,
        duration: 5000,
      });
    }
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('click', this.closeMessageSearchOnClickOutside);
    this.removeEventListeners();
    if (this._voiceObserver) {
      this._voiceObserver.disconnect();
      this._voiceObserver = null;
    }
    this.onlineUserIds = [];
  },
  methods: {
    normalizeRealtimeEvent(event) {
      if (!event) return event;
      return {
        ...event,
        chatId: event.chat_id,
        userId: event.user_id,
        messageId: event.message_id,
        pinnedMessage: event.pinned_message,
        isEdited: event.is_edited,
        editedAt: event.edited_at,
        updatedAt: event.updated_at,
      };
    },
    setupEventListeners() {
      eventBus.on("chat:message", this.handleIncomingMessage);
      eventBus.on("chat:message:updated", this.handleMessageUpdated);
      eventBus.on("chat:message:deleted", this.handleMessageDeleted);
      eventBus.on("chat:message:reaction", this.handleReactionEvent);
      eventBus.on("chat:pinned:updated", this.handlePinnedUpdated);
      eventBus.on("chat:read", this.handleReadEvent);
      eventBus.on("chat:typing", this.handleTypingEvent);
      eventBus.on("presence:here", this.handlePresenceHere);
      eventBus.on("presence:joining", this.handlePresenceJoining);
      eventBus.on("presence:leaving", this.handlePresenceLeaving);
    },
    removeEventListeners() {
      eventBus.off("chat:message", this.handleIncomingMessage);
      eventBus.off("chat:message:updated", this.handleMessageUpdated);
      eventBus.off("chat:message:deleted", this.handleMessageDeleted);
      eventBus.off("chat:message:reaction", this.handleReactionEvent);
      eventBus.off("chat:pinned:updated", this.handlePinnedUpdated);
      eventBus.off("chat:read", this.handleReadEvent);
      eventBus.off("chat:typing", this.handleTypingEvent);
      eventBus.off("presence:here", this.handlePresenceHere);
      eventBus.off("presence:joining", this.handlePresenceJoining);
      eventBus.off("presence:leaving", this.handlePresenceLeaving);
    },
    closeMessageSearchOnClickOutside(event) {
      if (this.messageSearchResults.length > 0) {
        const wrap = this.$refs.messageSearchWrap;
        if (wrap && !wrap.contains(event.target)) this.messageSearchResults = [];
      }
      if (this.showEmojiPicker) {
        const wrap = this.$refs.emojiPickerWrap;
        const modal = this.$refs.emojiPickerModal;
        if ((!wrap || !wrap.contains(event.target)) && (!modal || !modal.contains(event.target))) {
          this.showEmojiPicker = false;
        }
      }
    },
    insertEmoji(emoji) {
      const ta = this.$refs.composerTextarea;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = (this.draft ).slice(0, start);
        const after = (this.draft ).slice(end);
        this.draft = before + emoji + after;
        this.$nextTick(() => {
          ta.focus();
          const pos = start + emoji.length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        this.draft = (this.draft ) + emoji;
      }
    },
    handleTypingEvent(event) {
      const normalizedEvent = this.normalizeRealtimeEvent(event);
      const chatId = Number(normalizedEvent?.chatId);
      const myId = Number(this.$store?.state?.user?.id);
      const typingUserId = Number(normalizedEvent?.userId);
      if (!chatId || !typingUserId || typingUserId === myId) return;
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingUser = {
        chatId,
        user: normalizedEvent.user || { name: '', surname: '' },
      };
      this.typingTimeout = setTimeout(() => {
        this.typingUser = null;
        this.typingTimeout = null;
      }, 4000);
    },
    scheduleSendTyping() {
      if (!this.selectedChatId || this.editingMessage) return;
      if (this._typingDebounceTimer) clearTimeout(this._typingDebounceTimer);
      this._typingDebounceTimer = setTimeout(() => {
        this._typingDebounceTimer = null;
        ChatController.sendTyping(this.selectedChatId);
      }, 400);
    },
    async runMessageSearch() {
      if (!this.selectedChatId || !this.messageSearchQuery.trim()) {
        this.messageSearchResults = [];
        return;
      }
      this.loadingSearch = true;
      try {
        const list = await ChatController.searchMessages(this.selectedChatId, this.messageSearchQuery.trim(), { limit: 50 });
        this.messageSearchResults = Array.isArray(list) ? list : [];
      } catch (_) {
        this.messageSearchResults = [];
      } finally {
        this.loadingSearch = false;
      }
    },
    async goToSearchMessage(msg) {
      if (!msg?.id) return;
      const inList = (this.messages || []).some((m) => Number(m.id) === Number(msg.id));
      if (!inList) {
        const loaded = await ChatController.getMessages(this.selectedChatId, { beforeId: Number(msg.id) + 1, limit: 50 });
        this.messages = Array.isArray(loaded) ? loaded : [];
      }
      this.messageSearchResults = [];
      this.scrollToMessageId = msg.id;
    },
    highlightSearchQuery(body) {
      if (!body) return '';
      const esc = (s) => {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
      };
      const q = this.messageSearchQuery?.trim();
      if (!q) return esc(body);
      const escaped = esc(body);
      const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return escaped.replace(re, '<mark class="bg-yellow-200">$1</mark>');
    },
    handleGlobalKeydown(e) {
      if (e.key === 'Escape') {
        if (this.showImageModal) {
          e.preventDefault();
          this.closeImageModal();
          return;
        }
        if (this.showCreateGroupModal || this.showDeleteConfirm) return;
        if (this.editingMessage || this.replyingTo) {
          e.preventDefault();
          this.cancelEdit();
          this.replyingTo = null;
        }
        return;
      }
      if (this.showCreateGroupModal || this.showDeleteConfirm || this.showImageModal) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.$refs.chatSearchInput?.focus();
      }
    },
    handleIncomingMessage(event) {
      const next = handleIncomingChatEvent(this, event);
      if (next?.appendedToMessages && !this.messagesAtBottom) {
        this.newMessagesBelowCount = (this.newMessagesBelowCount || 0) + 1;
      }
    },
    handleMessageUpdated(event) {
      const normalizedEvent = this.normalizeRealtimeEvent(event);
      const messageId = Number(normalizedEvent?.id);
      if (!messageId) return;

      // Обновляем сообщение в текущем списке
      this.messages = (this.messages || []).map((m) => {
        if (Number(m.id) !== messageId) return m;
        return {
          ...m,
          body: normalizedEvent.body,
          isEdited: normalizedEvent.isEdited,
          editedAt: normalizedEvent.editedAt,
          updatedAt: normalizedEvent.updatedAt,
        };
      });

      // Обновляем last_message в списке чатов, если это последнее сообщение
      const chatId = Number(normalizedEvent?.chatId);
      if (chatId) {
        this.chats = (this.chats || []).map((c) => {
          if (Number(c.id) !== chatId) return c;
          if (c.lastMessage && Number(c.lastMessage.id) === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                body: normalizedEvent.body,
                isEdited: normalizedEvent.isEdited,
              },
            };
          }
          return c;
        });

        if (this.generalChat && Number(this.generalChat.id) === chatId) {
          if (this.generalChat.lastMessage && Number(this.generalChat.lastMessage.id) === messageId) {
            this.generalChat = {
              ...this.generalChat,
              lastMessage: {
                ...this.generalChat.lastMessage,
                body: normalizedEvent.body,
                isEdited: normalizedEvent.isEdited,
              },
            };
          }
        }
      }
    },
    handleMessageDeleted(event) {
      const messageId = Number(event?.id);
      if (!messageId) return;

      this.messages = (this.messages || []).filter((m) => Number(m.id) !== messageId);
    },
    handleReactionEvent(event) {
      const normalizedEvent = this.normalizeRealtimeEvent(event);
      const messageId = Number(normalizedEvent?.messageId);
      const chatId = Number(normalizedEvent?.chatId);
      const reactions = normalizedEvent?.reactions ?? [];
      if (!messageId || Number(this.selectedChatId) !== chatId) return;
      this.messages = (this.messages || []).map((m) => {
        if (Number(m.id) !== messageId) return m;
        return { ...m, reactions: Array.isArray(reactions) ? reactions : m.reactions };
      });
    },
    handlePinnedUpdated(event) {
      const normalizedEvent = this.normalizeRealtimeEvent(event);
      const chatId = Number(normalizedEvent?.chatId);
      if (!chatId) return;
      const pinnedMessage = normalizedEvent?.pinnedMessage ?? null;
      this.chats = (this.chats || []).map((c) =>
        Number(c.id) === chatId ? { ...c, pinnedMessage: pinnedMessage } : c
      );
      if (this.generalChat && Number(this.generalChat.id) === chatId) {
        this.generalChat = { ...this.generalChat, pinnedMessage: pinnedMessage };
      }
      if (Number(this.selectedChatId) === chatId) {
        this.selectedChat = { ...this.selectedChat, pinnedMessage: pinnedMessage };
      }
    },
    handleReadEvent(event) {
      handleChatReadEvent(this, event);
    },
    handlePresenceHere(users) {
      const ids = (users || []).map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
      this.onlineUserIds = [...ids];
    },
    handlePresenceJoining(user) {
      const id = Number(user?.id);
      if (Number.isNaN(id)) return;
      if (!this.onlineUserIds.includes(id)) {
        this.onlineUserIds = [...this.onlineUserIds, id];
      }
    },
    handlePresenceLeaving(user) {
      const id = Number(user?.id);
      if (Number.isNaN(id)) return;
      this.onlineUserIds = this.onlineUserIds.filter((uid) => uid !== id);
    },
    checkWebSocketStatus() {
      const status = globalChatRealtime.getStatus();
      return status || null;
    },
    async handleCompanyChange() {
      try {
        // Clear current data
        this.chats = [];
        this.generalChat = null;
        this.messages = [];
        this.selectedChat = null;
        this.selectedChatId = null;
        this.activePeerUser = null;

        // Reload users for new company
        await this.ensureUsersLoaded();

        await this.loadChats();
        await globalChatRealtime.reinitialize();
      } catch (error) {
        console.error('[Messenger] Ошибка смены компании:', error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка смены компании",
          subtitle: "Не удалось загрузить данные для новой компании",
          isDanger: true,
          duration: 5000,
        });
      }
    },
    async ensureUsersLoaded() {
      // Для мессенджера всегда загружаем пользователей, чтобы получить актуальный список
      // Очищаем state перед загрузкой, чтобы гарантировать свежие данные
      try {
        // Очищаем пользователей в state, чтобы принудительно загрузить заново
        this.$store.commit("SET_USERS", []);
        
        // Загружаем пользователей
        await this.$store.dispatch("loadUsers");
        
      } catch (e) {
        console.error("[Messenger] Ошибка загрузки пользователей:", e);
      }
    },
    async loadChats() {
      if (!this.hasChatsView) return;
      this.loadingChats = true;
      const prevGeneral = this.generalChat;
      try {
        const items = await ChatController.getChats();
        this.chats = Array.isArray(items) ? items : [];
        const foundGeneral = this.chats.find((c) => c && c.type === "general") || null;
        this.generalChat = foundGeneral || prevGeneral || null;

        if (this.selectedChatId) {
          const found = this.chats.find((c) => c && Number(c.id) === Number(this.selectedChatId));
          if (found) {
            this.selectedChat = { ...this.selectedChat, ...found };
          }
        } else {
          const savedId = this.getSavedSelectedChatId();
          if (savedId && this.chats.length) {
            const found = this.chats.find((c) => c && Number(c.id) === Number(savedId));
            if (found) {
              this.selectChat(found);
            }
          }
        }

        const peerMap = {};
        (this.chats || []).forEach((c) => {
          if (c && c.type === "direct" && c.id) {
            const peerId = Number(c.peerLastReadMessageId || 0);
            if (peerId) peerMap[Number(c.id)] = peerId;
          }
        });
        this.peerReadByChatId = { ...this.peerReadByChatId, ...peerMap };
      } finally {
        this.loadingChats = false;
      }
    },

    // NOTE: updateChatLastMessage/incrementUnreadCount/applyLocalMessageMeta
    // logic moved to src/services/chatState.js to keep MessengerPage thin.

    chatTitle(chat) {
      // Для direct чатов используем имя пользователя из activePeerUser
      if (chat?.type === "direct" && this.activePeerUser) {
        const u = this.activePeerUser;
        return `${u.name || ""} ${u.surname || ""}`.trim() || "Личный чат";
      }
      // Для групповых чатов используем title из данных чата
      if (chat?.type === "group") {
        return chat.title || `Групповой чат #${chat.id}`;
      }
      // Для general чата
      if (chat?.type === "general") {
        return chat.title || "Общий чат";
      }
      // Fallback
      return chat.title || chat.name || `Chat #${chat.id}`;
    },
    chatIcon(chat) {
      if (chat.type === "general") return "fa-globe";
      if (chat.type === "direct") return "fa-user";
      return "fa-users";
    },
    isUserOnline(u) {
      if (!u || !u.id) return false;
      // Используем глобальный сервис для проверки онлайн статуса
      return globalChatRealtime.isUserOnline(u.id) || this.onlineUserIds.includes(Number(u.id));
    },
  
    async selectChat(chat) {
      // Убеждаемся, что у нас есть полная информация о чате из списка
      let fullChat = chat;
      if (chat && chat.id) {
        // Ищем полную информацию о чате в списке чатов
        const foundChat = this.chats.find(c => Number(c.id) === Number(chat.id));
        if (foundChat) {
          // Объединяем данные, приоритет отдаём найденному чату (более полные данные)
          fullChat = { ...foundChat, ...chat };
        }
        
      }
      
      this.selectedChat = fullChat;
      this.selectedChatId = fullChat.id;
      this.saveSelectedChatId(fullChat.id);
      this.messages = [];
      this.hasMoreMessages = true;
      
      if (fullChat.type !== 'direct') {
        this.activePeerUser = null;
      }
      
      if (fullChat) {
        this.chats = (this.chats || []).map((c) => {
          if (c && Number(c.id) === Number(fullChat.id)) {
            return { ...c, unreadCount: 0 };
          }
          return c;
        });
        
        if (this.generalChat && Number(this.generalChat.id) === Number(fullChat.id)) {
          this.generalChat = { ...this.generalChat, unreadCount: 0 };
        }
        
        // Уведомляем другие компоненты об обновлении счетчика
        eventBus.emit("chat:unread-updated", { chatId: fullChat.id, unreadCount: 0 });
      }
      
      try {
        // Сразу помечаем все сообщения как прочитанные (не ждём загрузки)
        // Передаём null чтобы сервер сам нашёл последнее сообщение в чате
        await this.markAsRead(fullChat.id, null);
        
        // Загружаем сообщения
        await this.loadMessages(fullChat.id);
        
        await this.$nextTick();
        setTimeout(() => {
          this.scrollToBottom(true);
        }, 200);
      } catch (e) {
        console.error("[Messenger] Ошибка при выборе чата:", e);
      }
    },

    async markAsRead(chatId, messageId = null) {
      if (!chatId) return;
      
      try {
        // Если messageId не передан, используем последнее загруженное сообщение
        // Если и его нет - передаём null (сервер найдёт последнее сообщение в чате сам)
        let finalMessageId = messageId;
        if (finalMessageId === null && this.messages.length > 0) {
          const lastMessage = this.messages[this.messages.length - 1];
          finalMessageId = lastMessage?.id || null;
        }
        
        await ChatController.markAsRead(chatId, finalMessageId);
      } catch (e) {
        console.error("[Messenger] Ошибка при отметке как прочитано:", e);
      }
    },

    messageTicks(m) {
      // Only for my messages: ✓ if peer hasn't read yet; ✓✓ if peer read id >= message id
      if (!this.isMyMessage(m)) return "";
      const chatId = Number(m?.chatId || this.selectedChatId);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || 0);
      const msgId = Number(m?.id || 0);
      if (!chatId || !msgId) return "✓";
      return peerReadId >= msgId ? "✓✓" : "✓";
    },

    chatLastTicks(item) {
      // Left list: show ✓/✓✓ only if last message is mine and chat is direct
      const msg = item?.lastMessage;
      if (!msg || !this.isMyMessageInChat(item)) return "";
      const chatId = Number(item?.chatId || msg?.chatId || item?.id);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || item?.peerLastReadMessageId || 0);
      const msgId = Number(msg?.id || 0);
      if (!chatId || !msgId) return "✓";
      return peerReadId >= msgId ? "✓✓" : "✓";
    },
    openGeneralChat() {
      this.activePeerUser = null;
      const open = async () => {
        try {
          // Явно запросим/создадим общий чат
          const chat = await ChatController.ensureGeneralChat();
          if (chat) {
            this.generalChat = chat;
            // Если в списке не было — добавим
            const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
            if (!exists) {
              this.chats = [...(this.chats || []), chat];
              globalChatRealtime.syncChats(this.chats);
            }
            await this.selectChat(chat);
            return;
          }
        } catch (e) {
          // fallthrough to notification
        }

        // если по какой-то причине общий чат не найден
        this.$store.dispatch("showNotification", {
          title: "Общий чат не найден",
          subtitle: "Попробуйте обновить страницу",
          isDanger: false,
          duration: 4000,
        });
        this.selectedChat = null;
        this.selectedChatId = null;
        this.saveSelectedChatId(null);
        this.messages = [];
      };
      open();
    },
    async loadMessages(chatId) {
      this.loadingMessages = true;
      this.hasMoreMessages = true;
      try {
        // Загружаем только последние 50 сообщений
        const items = await ChatController.getMessages(chatId, { limit: 50, tail: true });
        this.messages = Array.isArray(items) ? items : [];
        
        // Если получили меньше 50, значит больше сообщений нет
        this.hasMoreMessages = items.length >= 50;
        
        // Ждем завершения загрузки и обновления DOM
        await this.$nextTick();
        this.loadingMessages = false;
        await this.$nextTick();
        this.scrollToBottom(true);
      } catch (e) {
        this.messages = [];
        this.loadingMessages = false;
        this.hasMoreMessages = false;
        this.$store.dispatch("showNotification", {
          title: "Не удалось загрузить сообщения",
          subtitle: e?.message || "",
          isDanger: true,
          duration: 3000,
        });
      }
    },

    async loadOlderMessages() {
      if (this.loadingOlderMessages || !this.hasMoreMessages || !this.selectedChatId || this.messages.length === 0) {
        return;
      }

      this.loadingOlderMessages = true;
      try {
        const firstMessage = this.messages[0];
        const beforeId = firstMessage?.id;
        
        if (!beforeId) {
          this.loadingOlderMessages = false;
          return;
        }

        const items = await ChatController.getMessages(this.selectedChatId, { 
          beforeId: beforeId, 
          limit: 30 
        });
        
        if (Array.isArray(items) && items.length > 0) {
          // Добавляем в начало массива
          this.messages = [...items, ...this.messages];
          
          // Если получили меньше 30, значит больше сообщений нет
          this.hasMoreMessages = items.length >= 30;
        } else {
          this.hasMoreMessages = false;
        }
      } catch (e) {
        console.error("[Messenger] Ошибка загрузки старых сообщений:", e);
      } finally {
        this.loadingOlderMessages = false;
      }
    },

    onMessagesScroll(event) {
      const el = event.target;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
      this.messagesAtBottom = atBottom;
      if (atBottom) this.newMessagesBelowCount = 0;
      if (el.scrollTop < 200 && this.hasMoreMessages && !this.loadingOlderMessages) {
        const oldHeight = el.scrollHeight;
        this.loadOlderMessages().then(() => {
          this.$nextTick(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - oldHeight + el.scrollTop;
          });
        });
      }
    },

    scrollToBottom(force = false) {
      const el = this.$refs.messagesWrap;
      if (!el) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
      if (!force && !atBottom) return;
      this.newMessagesBelowCount = 0;
      this.messagesAtBottom = true;
      const scroll = () => {
        if (el.scrollHeight !== undefined) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      };
      this.$nextTick(scroll);
      setTimeout(scroll, 180);
    },
    scrollToBottomAndResetNewCount() {
      this.newMessagesBelowCount = 0;
      this.scrollToBottom(true);
    },
    isMessageOnlyEmoji(message) {
      if (!message?.body || message.parent || message.forwardedFrom) return false;
      const files = message.files;
      if (Array.isArray(files) && files.length > 0) return false;
      const t = String(message.body).trim();
      if (!t || t.length > 8 || /\s/.test(t)) return false;
      try {
        return /^\p{Extended_Pictographic}+$/u.test(t);
      } catch (_) {
        return false;
      }
    },
    isLastMessage(group, message) {
      const groups = this.messageGroups;
      if (!groups.length || !group.messages || !group.messages.length) return false;
      const lastGroup = groups[groups.length - 1];
      if (group !== lastGroup) return false;
      return lastGroup.messages.lastIndexOf(message) === lastGroup.messages.length - 1;
    },
    isMyMessage(m) {
      const myId = this.$store.state.user?.id;
      const userId = m.creatorId || m.userId || m.user?.id;
      return myId && userId && Number(myId) === Number(userId);
    },
    messageTime(m) {
      const raw = m.createdAt || null;
      return extractHHmm(raw);
    },
    userPhotoUrl(path) {
      return buildStorageUrl(path);
    },
    fileUrl(path) {
      return buildStorageUrl(path);
    },
    processNewFiles(files) {
      const list = Array.isArray(files) ? files : Array.from(files || []);
      if (!list.length) return;
      const maxSize = this.maxFileSizeBytes;
      const tooBig = list.filter((f) => f.size > maxSize);
      if (tooBig.length) {
        this.$store.dispatch("showNotification", {
          title: "Файл не прикреплён",
          subtitle: `Размер не более ${Math.round(maxSize / 1024 / 1024)} МБ: ${tooBig.map((f) => f.name).join(", ")}`,
          isDanger: true,
          duration: 5000,
        });
      }
      const ok = list.filter((f) => f.size <= maxSize);
      const rest = this.maxFilesPerSend - this.selectedFiles.length;
      const add = ok.slice(0, Math.max(0, rest));
      if (add.length < ok.length) {
        this.$store.dispatch("showNotification", {
          title: "Лимит файлов",
          subtitle: `За одну отправку не более ${this.maxFilesPerSend} файлов. Добавлено ${add.length} из ${ok.length}.`,
          isInfo: true,
          duration: 4000,
        });
      }
      this.selectedFiles = [...this.selectedFiles, ...add];
    },
    onFilesSelected(e) {
      this.processNewFiles(Array.from(e.target.files || []));
      e.target.value = '';
    },
    onComposerPaste(e) {
      if (this.editingMessage) return;
      const dt = e.clipboardData;
      if (!dt || !dt.files || !dt.files.length) return;
      const imageFiles = [];
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i];
        if (f.type && f.type.startsWith('image/')) imageFiles.push(f);
      }
      if (imageFiles.length) {
        e.preventDefault();
        this.processNewFiles(imageFiles);
      }
    },
    onComposerDragover(e) {
      if (!this.editingMessage) this.composerDropActive = true;
    },
    onComposerDragleave(e) {
      if (!this.$refs.composerArea?.contains(e.relatedTarget)) this.composerDropActive = false;
    },
    onComposerDrop(e) {
      this.composerDropActive = false;
      if (this.editingMessage) return;
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) this.processNewFiles(files);
    },
    getMessageFileIndex(message, file) {
      const files = Array.isArray(message?.files) ? message.files : [];
      const path = file?.path;
      const idx = files.findIndex((f) => (f && f.path) === path);
      return idx >= 0 ? idx : 0;
    },
    getVoiceKey(messageId, fileIndex) {
      return `${messageId}-${fileIndex}`;
    },
    getVoiceState(message, fileIndex) {
      const key = this.getVoiceKey(message?.id, fileIndex);
      return this.voicePlayerState[key] || { currentTime: 0, duration: 0, playing: false, playbackRate: 1 };
    },
    voicePlaying(message, fileIndex) {
      if (!this.voiceCurrent) return false;
      return Number(this.voiceCurrent.messageId) === Number(message?.id) && this.voiceCurrent.fileIndex === fileIndex && this.getVoiceState(message, fileIndex).playing;
    },
    voiceCurrentTime(message, fileIndex) {
      return this.getVoiceState(message, fileIndex).currentTime;
    },
    voiceDuration(message, fileIndex) {
      return this.getVoiceState(message, fileIndex).duration;
    },
    voiceSpeedLabel(message, fileIndex) {
      const rate = this.getVoiceState(message, fileIndex).playbackRate;
      return `${rate}x`;
    },
    formatVoiceTime(sec) {
      if (sec == null || Number.isNaN(sec)) return '0:00';
      const s = Math.floor(Number(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${String(r).padStart(2, '0')}`;
    },
    playPauseVoice(message, fileIndex, file) {
      const key = this.getVoiceKey(message?.id, fileIndex);
      const audio = this.$refs.voiceAudio;
      if (!audio || !file?.path) return;
      const state = this.getVoiceState(message, fileIndex);
      if (this.voiceCurrent && this.voiceCurrent.key === key && state.playing) {
        audio.pause();
        return;
      }
      const url = this.fileUrl(file.path);
      if (this.voiceCurrent?.key === key && !state.playing && audio.src && (audio.src === url || audio.src.endsWith(file.path))) {
        audio.currentTime = state.currentTime;
        audio.playbackRate = this.voicePlayerState[key]?.playbackRate || 1;
        this.voiceCurrent = { key, messageId: message?.id, fileIndex };
        this.voicePlayerState[key] = this.voicePlayerState[key] || { currentTime: 0, duration: 0, playing: false, playbackRate: 1 };
        this.voicePlayerState[key].playing = true;
        audio.play();
        return;
      }
      if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: 0, duration: 0, playing: false, playbackRate: state.playbackRate || 1 };
      this.voiceCurrent = { key, messageId: message?.id, fileIndex };
      this.voicePlayerState[key].playing = true;
      audio.src = url;
      audio.playbackRate = this.voicePlayerState[key].playbackRate || 1;
      audio.play();
    },
    cycleVoiceSpeed(message, fileIndex) {
      const key = this.getVoiceKey(message?.id, fileIndex);
      const rates = [1, 1.5, 2];
      const state = this.getVoiceState(message, fileIndex);
      const current = state.playbackRate || 1;
      const idx = rates.indexOf(current);
      const next = rates[(idx + 1) % rates.length];
      if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: state.currentTime, duration: state.duration, playing: state.playing, playbackRate: next };
      else this.voicePlayerState[key].playbackRate = next;
      const audio = this.$refs.voiceAudio;
      if (this.voiceCurrent && this.voiceCurrent.key === key && audio) audio.playbackRate = next;
    },
    seekVoice(message, fileIndex, e) {
      const key = this.getVoiceKey(message?.id, fileIndex);
      const audio = this.$refs.voiceAudio;
      if (!audio || !this.voiceCurrent || this.voiceCurrent.key !== key) return;
      const val = parseFloat(e.target?.value);
      if (!Number.isNaN(val)) {
        audio.currentTime = val;
        if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: val, duration: 0, playing: true, playbackRate: 1 };
        else this.voicePlayerState[key].currentTime = val;
      }
    },
    onVoiceTimeUpdate() {
      const audio = this.$refs.voiceAudio;
      if (!audio || !this.voiceCurrent) return;
      const key = this.voiceCurrent.key;
      if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: audio.currentTime, duration: audio.duration || 0, playing: true, playbackRate: 1 };
      else this.voicePlayerState[key].currentTime = audio.currentTime;
    },
    onVoiceLoadedMetadata() {
      const audio = this.$refs.voiceAudio;
      if (!audio || !this.voiceCurrent) return;
      const key = this.voiceCurrent.key;
      if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: 0, duration: audio.duration || 0, playing: true, playbackRate: 1 };
      else this.voicePlayerState[key].duration = audio.duration || 0;
      const saved = this.voicePlayerState[key].currentTime;
      if (saved > 0 && saved < (audio.duration || Infinity)) audio.currentTime = saved;
    },
    onVoiceEnded() {
      if (!this.voiceCurrent) return;
      const key = this.voiceCurrent.key;
      if (this.voicePlayerState[key]) this.voicePlayerState[key].playing = false;
      this.voiceCurrent = null;
    },
    onVoicePlay() {
      if (!this.voiceCurrent) return;
      const key = this.voiceCurrent.key;
      if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: 0, duration: 0, playing: true, playbackRate: 1 };
      else this.voicePlayerState[key].playing = true;
    },
    onVoicePause() {
      if (!this.voiceCurrent) return;
      const key = this.voiceCurrent.key;
      if (this.voicePlayerState[key]) this.voicePlayerState[key].playing = false;
    },
    setVoiceBlockRef(message, f, el) {
      if (!el) return;
      const key = this.getVoiceKey(message?.id, this.getMessageFileIndex(message, f));
      const path = this.fileUrl(f.path);
      if (!this._voiceObserver) {
        this._voiceObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const k = entry.target._voiceKey;
            const p = entry.target._voicePath;
            if (k && p) this.loadVoiceMetadata(k, p);
          });
        }, { root: null, rootMargin: '80px', threshold: 0 });
      }
      el._voiceKey = key;
      el._voicePath = path;
      this._voiceObserver.observe(el);
    },
    loadVoiceMetadata(key, path) {
      if (this.voicePlayerState[key]?.duration > 0) return;
      if (this._preloadKey !== null) {
        this._preloadQueue.push({ key, path });
        return;
      }
      const preload = this.$refs.voicePreload;
      if (!preload) return;
      this._preloadKey = key;
      preload.src = path;
    },
    processPreloadQueue() {
      if (this._preloadKey !== null || !this._preloadQueue.length) return;
      const { key, path } = this._preloadQueue.shift();
      if (this.voicePlayerState[key]?.duration > 0) {
        this.$nextTick(() => this.processPreloadQueue());
        return;
      }
      const preload = this.$refs.voicePreload;
      if (!preload) return;
      this._preloadKey = key;
      preload.src = path;
    },
    onVoicePreloadMetadata() {
      const key = this._preloadKey;
      const preload = this.$refs.voicePreload;
      if (key != null && preload) {
        if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: 0, duration: 0, playing: false, playbackRate: 1 };
        this.voicePlayerState[key].duration = preload.duration || 0;
      }
      this._preloadKey = null;
      this.$nextTick(() => this.processPreloadQueue());
    },
    onAudioSelected(e) {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      const maxSize = this.maxFileSizeBytes;
      const ok = files.filter((f) => f.size <= maxSize);
      const tooBig = files.filter((f) => f.size > maxSize);
      if (tooBig.length) {
        this.$store.dispatch("showNotification", {
          title: "Файл не прикреплён",
          subtitle: `Размер не более ${Math.round(maxSize / 1024 / 1024)} МБ`,
          isDanger: true,
          duration: 4000,
        });
      }
      const rest = this.maxFilesPerSend - this.selectedFiles.length;
      const add = ok.slice(0, Math.max(0, rest));
      this.selectedFiles = [...this.selectedFiles, ...add];
    },
    async toggleAudioRecording() {
      if (this.isRecordingAudio) {
        this.stopAudioRecording();
      } else {
        await this.startAudioRecording();
      }
    },
    async startAudioRecording() {
      try {
        this.audioRecordingCancelled = false;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._audioStream = stream;
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          const streamToStop = this._audioStream;
          this._audioStream = null;
          if (streamToStop) {
            streamToStop.getTracks().forEach(track => track.stop());
          }
          if (this.audioRecordingCancelled) {
            this.audioRecordingCancelled = false;
            return;
          }
          if (this.selectedFiles.length >= this.maxFilesPerSend) {
            this.$store.dispatch("showNotification", {
              title: "Лимит файлов",
              subtitle: `За одну отправку не более ${this.maxFilesPerSend} файлов. Удалите файл или отправьте сообщение.`,
              isInfo: true,
              duration: 4000,
            });
            this.audioBlob = null;
            return;
          }
          this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([this.audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          this.selectedFiles = [...this.selectedFiles, audioFile];
          this.audioBlob = null;
          if (this.audioRecordingAddToMessageOnly) {
            this.audioRecordingAddToMessageOnly = false;
          } else if (this.audioRecordingSendAfterStop) {
            this.audioRecordingSendAfterStop = false;
            this.$nextTick(() => this.send());
          }
        };

        this.mediaRecorder.start();
        this.isRecordingAudio = true;
        this.audioRecordingTime = 0;
        this.audioRecordingInterval = setInterval(() => {
          this.audioRecordingTime++;
        }, 1000);
      } catch (error) {
        console.error('Error starting audio recording:', error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка записи аудио",
          subtitle: "Не удалось получить доступ к микрофону",
          isDanger: true,
          duration: 3000,
        });
      }
    },
    stopAudioRecording() {
      if (!this.mediaRecorder || !this.isRecordingAudio) return;
      this.mediaRecorder.stop();
      this.isRecordingAudio = false;
      if (this.audioRecordingInterval) {
        clearInterval(this.audioRecordingInterval);
        this.audioRecordingInterval = null;
      }
    },
    cancelAudioRecording() {
      if (!this.mediaRecorder || !this.isRecordingAudio) return;
      this.audioRecordingCancelled = true;
      this.stopAudioRecording();
    },
    addVoiceToMessage() {
      if (!this.mediaRecorder || !this.isRecordingAudio) return;
      this.audioRecordingAddToMessageOnly = true;
      this.stopAudioRecording();
    },
    sendVoiceRecording() {
      if (!this.mediaRecorder || !this.isRecordingAudio) return;
      this.audioRecordingSendAfterStop = true;
      this.stopAudioRecording();
    },
    removeSelectedFile(index) {
      if (index >= 0 && index < this.selectedFiles.length) {
        this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
      }
    },
    messageReactionsGrouped(message) {
      const list = message?.reactions ?? [];
      if (!Array.isArray(list) || list.length === 0) return [];
      const myId = Number(this.$store.state.user?.id);
      const byEmoji = {};
      list.forEach((r) => {
        const e = r.emoji || "👍";
        if (!byEmoji[e]) byEmoji[e] = { emoji: e, count: 0, my: false };
        byEmoji[e].count++;
        if (Number(r.creatorId) === myId) byEmoji[e].my = true;
      });
      return Object.values(byEmoji);
    },
    async toggleReaction(message, emoji) {
      if (!this.selectedChatId || !message?.id) return;
      const myId = Number(this.$store.state.user?.id);
      const mine = (message.reactions ?? []).find((r) => Number(r.creatorId) === myId);
      const sendNull = mine && mine.emoji === emoji;
      try {
        const reactions = await ChatController.setReaction(
          this.selectedChatId,
          message.id,
          sendNull ? null : emoji
        );
        const mid = Number(message.id);
        this.messages = (this.messages || []).map((m) =>
          Number(m.id) === mid ? { ...m, reactions } : m
        );
      } catch (_) {}
      this.reactionPickerMessageId = null;
    },
    openReactionPicker(messageId) {
      this.reactionPickerMessageId = this.reactionPickerMessageId === messageId ? null : messageId;
    },
    closeReactionPicker() {
      this.reactionPickerMessageId = null;
    },
    isImageFile(file) {
      const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      return imageTypes.includes(file.mimeType) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name );
    },
    isAudioFile(file) {
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'];
      return audioTypes.includes(file.mimeType) || /\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name );
    },
    async send() {
      if (!this.selectedChatId) return;
      if (!this.canWrite) return;
      if (!this.draft.trim() && this.selectedFiles.length === 0) return;

      const body = this.draft;
      const files = [...this.selectedFiles];
      const parentId = this.replyingTo?.id || null;
      const tempId = `temp-${Date.now()}`;
      const user = this.$store.state.user;
      const tempMessage = {
        id: tempId,
        chatId: this.selectedChatId,
        creatorId: user?.id,
        body,
        files: files.map((f) => ({ name: f.name, path: null })),
        createdAt: getCurrentServerDateObject().toISOString(),
        user: user ? { id: user.id, name: user.name, surname: user.surname, photo: user.photo } : null,
        parentId: parentId || null,
        parent: this.replyingTo || null,
        pending: true,
        failed: false,
      };
      this.messages = [...(this.messages || []), tempMessage];
      this.draft = '';
      this.selectedFiles = [];
      this.replyingTo = null;
      this.audioBlob = null;
      this.$nextTick(() => this.scrollToBottom(true));

      this.sending = true;
      try {
        const msg = await ChatController.sendMessage(this.selectedChatId, {
          body,
          files,
          parentId: parentId,
        });

        if (msg) {
          this.messages = (this.messages || []).map((m) =>
            String(m.id) === tempId ? { ...m, ...msg, id: msg.id, pending: false, failed: false } : m
          );
          applySentMessage(this, msg);
          delete this._pendingRetryByTempId[tempId];
        } else {
          this.messages = (this.messages || []).map((m) =>
            String(m.id) === tempId ? { ...m, pending: false } : m
          );
          await this.loadMessages(this.selectedChatId);
        }
      } catch (err) {
        this.messages = (this.messages || []).map((m) =>
          String(m.id) === tempId ? { ...m, pending: false, failed: true } : m
        );
        this._pendingRetryByTempId[tempId] = { body, files, parentId: parentId };
        const subtitle = err?.response?.status === 413
          ? 'Файл или аудио слишком большой. Уменьшите размер или попросите администратора увеличить лимит загрузки на сервере.'
          : (err?.message || 'Не удалось отправить сообщение');
        this.$store.dispatch('showNotification', {
          title: 'Ошибка отправки',
          subtitle,
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.sending = false;
      }
    },
    confirmPinMessage(message) {
      if (!this.selectedChatId || !message?.id) return;
      this.pendingPinMessage = message;
      this.showPinConfirm = true;
      this.closeMessageMenu();
    },
    getMessengerSelectedChatKey() {
      const companyId = this.$store.getters.currentCompanyId || 0;
      return `messenger_selectedChatId_${companyId}`;
    },
    getSavedSelectedChatId() {
      try {
        const raw = localStorage.getItem(this.getMessengerSelectedChatKey());
        return raw ? String(raw).trim() || null : null;
      } catch (_) {
        return null;
      }
    },
    saveSelectedChatId(chatId) {
      try {
        if (chatId != null) {
          localStorage.setItem(this.getMessengerSelectedChatKey(), String(chatId));
        } else {
          localStorage.removeItem(this.getMessengerSelectedChatKey());
        }
      } catch (_) {}
    },
    closePinConfirm() {
      this.showPinConfirm = false;
      this.pendingPinMessage = null;
    },
    async doPinConfirm() {
      if (!this.pendingPinMessage) return;
      this.pinConfirmLoading = true;
      try {
        await this.pinMessage(this.pendingPinMessage);
        this.closePinConfirm();
      } finally {
        this.pinConfirmLoading = false;
      }
    },
    async pinMessage(message) {
      if (!this.selectedChatId || !message?.id) return;
      try {
        const data = await ChatController.pinMessage(this.selectedChatId, message.id);
        const chat = data?.chat || data;
        if (chat?.pinnedMessage !== undefined) {
          this.selectedChat = { ...this.selectedChat, pinnedMessage: chat.pinnedMessage };
          this.chats = (this.chats || []).map((c) =>
            Number(c.id) === Number(this.selectedChatId) ? { ...c, pinnedMessage: chat.pinnedMessage } : c
          );
          if (this.generalChat && Number(this.generalChat.id) === Number(this.selectedChatId)) {
            this.generalChat = { ...this.generalChat, pinnedMessage: chat.pinnedMessage };
          }
        }
        this.closeMessageMenu();
      } catch (e) {
        this.$store.dispatch('showNotification', { title: 'Ошибка', subtitle: e?.message || 'Не удалось закрепить', isDanger: true, duration: 3000 });
      }
    },
    async unpinMessage() {
      if (!this.selectedChatId) return;
      try {
        await ChatController.unpinMessage(this.selectedChatId);
        this.selectedChat = { ...this.selectedChat, pinnedMessage: null };
        this.chats = (this.chats || []).map((c) =>
          Number(c.id) === Number(this.selectedChatId) ? { ...c, pinnedMessage: null } : c
        );
        if (this.generalChat && Number(this.generalChat.id) === Number(this.selectedChatId)) {
          this.generalChat = { ...this.generalChat, pinnedMessage: null };
        }
        this.closeMessageMenu();
      } catch (e) {
        this.$store.dispatch('showNotification', { title: 'Ошибка', subtitle: e?.message || 'Не удалось открепить', isDanger: true, duration: 3000 });
      }
    },
    async retrySendMessage(message) {
      const tempId = message?.id;
      if (!tempId || !String(tempId).startsWith('temp-') || !message.failed) return;
      const pending = this._pendingRetryByTempId[tempId];
      if (!pending) return;

      this.messages = (this.messages || []).map((m) =>
        String(m.id) === tempId ? { ...m, failed: false, pending: true } : m
      );
      this.sending = true;
      try {
        const msg = await ChatController.sendMessage(this.selectedChatId, {
          body: pending.body,
          files: pending.files,
          parentId: pending.parentId || null,
        });
        if (msg) {
          this.messages = (this.messages || []).map((m) =>
            String(m.id) === tempId ? { ...m, ...msg, id: msg.id, pending: false, failed: false } : m
          );
          applySentMessage(this, msg);
          delete this._pendingRetryByTempId[tempId];
        }
      } catch (err) {
        this.messages = (this.messages || []).map((m) =>
          String(m.id) === tempId ? { ...m, pending: false, failed: true } : m
        );
        const subtitle = err?.response?.status === 413
          ? 'Файл или аудио слишком большой. Уменьшите размер или попросите администратора увеличить лимит загрузки на сервере.'
          : (err?.message || 'Не удалось отправить');
        this.$store.dispatch('showNotification', {
          title: 'Ошибка отправки',
          subtitle,
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.sending = false;
      }
    },
    showMessageMenu(event, message) {
      this.messageMenuTarget = message;
      this.messageMenuX = event.clientX;
      this.messageMenuY = event.clientY;
      this.messageMenuAdjustedY = event.clientY;
      this.messageMenuVisible = true;
      document.addEventListener('click', this.closeMessageMenu, { once: true });
      this.$nextTick(() => {
        const el = this.$refs.messageMenuEl;
        if (el) {
          const rect = el.getBoundingClientRect();
          const spaceBelow = window.innerHeight - this.messageMenuY;
          if (rect.height > spaceBelow && this.messageMenuY > rect.height) {
            this.messageMenuAdjustedY = this.messageMenuY - rect.height;
          }
        }
      });
    },
    closeMessageMenu() {
      this.messageMenuVisible = false;
      this.messageMenuTarget = null;
    },
    replyToMessage(message) {
      this.replyingTo = message;
      this.closeMessageMenu();
      this.$refs.composerTextarea?.focus();
    },
    editMessage(message) {
      this.editingMessage = message;
      this.draft = message.body ;
      this.editingMessageFiles = Array.isArray(message.files) && message.files.length
        ? message.files.map((f) => ({ path: f.path , name: f.name || f.path , mimeType: f.mimeType  }))
        : [];
      this.closeMessageMenu();
    },
    cancelEdit() {
      this.editingMessage = null;
      this.editingMessageFiles = [];
      this.draft = '';
    },
    removeEditingFile(index) {
      if (index >= 0 && index < this.editingMessageFiles.length) {
        this.editingMessageFiles = this.editingMessageFiles.filter((_, i) => i !== index);
      }
    },
    async saveEdit() {
      if (!this.editingMessage || !this.draft.trim()) return;
      this.saveEditLoading = true;
      try {
        const filesPayload = this.editingMessageFiles.map((f) => ({ path: f.path, name: f.name || undefined, mimeType: f.mimeType || undefined }));
        const updatedMessage = await ChatController.updateMessage(
          this.selectedChatId,
          this.editingMessage.id,
          this.draft,
          filesPayload
        );

        const messageId = Number(this.editingMessage.id);
        this.messages = (this.messages || []).map((m) => {
          if (Number(m.id) !== messageId) return m;
          return {
            ...m,
            body: updatedMessage.body,
            files: updatedMessage.files ?? m.files,
            isEdited: true,
            editedAt: updatedMessage.editedAt,
            updatedAt: updatedMessage.updatedAt,
          };
        });

        // Обновляем last_message в списке чатов
        const chatId = Number(this.selectedChatId);
        this.chats = (this.chats || []).map((c) => {
          if (Number(c.id) !== chatId) return c;
          if (c.lastMessage && Number(c.lastMessage.id) === Number(this.editingMessage.id)) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                body: updatedMessage.body,
                files: updatedMessage.files ?? c.lastMessage.files,
                isEdited: updatedMessage.isEdited,
              },
            };
          }
          return c;
        });

        if (this.generalChat && Number(this.generalChat.id) === chatId) {
          if (this.generalChat.lastMessage && Number(this.generalChat.lastMessage.id) === Number(this.editingMessage.id)) {
            this.generalChat = {
              ...this.generalChat,
              lastMessage: {
                ...this.generalChat.lastMessage,
                body: updatedMessage.body,
                files: updatedMessage.files ?? this.generalChat.lastMessage.files,
                isEdited: updatedMessage.isEdited,
              },
            };
          }
        }
        
        this.editingMessage = null;
        this.editingMessageFiles = [];
        this.draft = '';
      } catch (error) {
        console.error("[MessengerPage] Ошибка редактирования:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось отредактировать сообщение",
          isDanger: true,
          duration: 3000,
        });
      } finally {
        this.saveEditLoading = false;
      }
    },
    async deleteMessage(message) {
      if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;
      
      try {
        await ChatController.deleteMessage(this.selectedChatId, message.id);
        // Remove message from local array
        this.messages = this.messages.filter(m => m.id !== message.id);
        this.closeMessageMenu();
      } catch (error) {
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось удалить сообщение",
          isDanger: true,
          duration: 3000,
        });
      }
    },
    forwardMessage(message) {
      this.forwardingMessage = message;
      this.forwardTarget = null;
      this.forwardText = "";
      this.forwardingSending = false;
      this.showForwardModal = true;
      this.closeMessageMenu();
    },
    closeForwardModal() {
      this.showForwardModal = false;
      this.forwardingMessage = null;
      this.forwardTarget = null;
      this.forwardText = "";
      this.forwardingSending = false;
    },
    selectForwardTarget(target) {
      this.forwardTarget = target;
    },
    async sendForward() {
      if (!this.forwardingMessage || !this.forwardTarget) return;
      if (!this.selectedChatId) return;

      this.forwardingSending = true;
      try {
        let targetChatId = null;
        const target = this.forwardTarget;

        // If target is a user (direct chat), we might need to create/get the chat first
        if (target.type === 'user') {
          if (target.chatId) {
            targetChatId = target.chatId;
          } else {
            const chat = await ChatController.startDirectChat(target.id);
            if (chat && chat.id) {
              targetChatId = chat.id;
              const exists = this.chats.find(c => Number(c.id) === Number(chat.id));
              if (!exists) {
                this.chats.push(chat);
                globalChatRealtime.syncChats(this.chats);
              }
            }
          }
        } else {
          targetChatId = target.id;
        }

        if (!targetChatId) {
          throw new Error("Не удалось определить чат для пересылки");
        }

        // Telegram-like: отправляем сначала ваш текст (если есть), потом пересланное
        const extra = (this.forwardText || "").trim();
        if (extra) {
          await ChatController.sendMessage(targetChatId, { body: extra, files: [], parentId: null });
        }

        await ChatController.forwardMessage(this.selectedChatId, this.forwardingMessage.id, targetChatId);

        this.$store.dispatch('showNotification', {
          title: 'Успешно',
          subtitle: 'Сообщение переслано',
          isDanger: false,
          duration: 2000
        });

        this.closeForwardModal();
      } catch (error) {
        console.error("Forward error:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось переслать сообщение",
          isDanger: true,
          duration: 3000,
        });
      } finally {
        this.forwardingSending = false;
      }
    },
    openImageModal(file) {
      this.selectedImage = file;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.selectedImage = null;
    },

    async openDirect(user) {
      if (!this.hasChatsView) return;
      try {
        const chat = await ChatController.startDirectChat(user.id);
        if (!chat) return;
        this.activePeerUser = user;
        
        // если чата ещё нет в списке, добавим
        const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
        if (!exists) {
          this.chats = [...(this.chats || []), chat];
          globalChatRealtime.syncChats(this.chats);
        }
        await this.selectChat(chat);
      } catch (e) {
        // ignore
      }
    },
    parseDate(dateString) {
      return parseDateSafe(dateString);
    },
    formatDayLabel(date) {
      if (!date) return this.$t('today');
      const dateObj = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(dateObj.getTime())) return this.$t('today');

      const today = getCurrentServerStartOfDay();

      const messageDay = new Date(dateObj);
      messageDay.setHours(0, 0, 0, 0);

      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const locale = this.$i18n.locale || 'ru';
      
      if (diffDays === 0) return this.$t('today');
      if (diffDays === 1) return this.$t('yesterday');
      if (diffDays === 2) return this.$t('dayBeforeYesterday');
      
      // For days within a week, use localized weekday
      if (diffDays < 7) {
        const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
        const dateLocale = localeMap[locale] || 'ru-RU';
        return dateObj.toLocaleDateString(dateLocale, { weekday: "long" });
      }
      
      // For older dates, use full date format
      const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
      const dateLocale = localeMap[locale] || 'ru-RU';
      return dateObj.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
    },
    getItemTitle(item) {
      if (item.type === 'user') {
        return item.displayTitle || `${item.name || ""} ${item.surname || ""}`.trim() || "Пользователь";
      }
      return item.title || item.name || (item.type === 'general' ? "Общий чат" : `Чат #${item.id}`);
    },
    getItemPreview(item) {
      if (item.lastMessage?.body) {
        return item.lastMessage.body;
      }
      if (item.type === 'user') {
        return item.position || "Сотрудник";
      }
      return "";
    },
    formatChatTime(item) {
      const raw = item.lastMessageAt || item.lastMessage?.createdAt;
      if (!raw) return "";
      
      const date = this.parseDate(raw);
      if (!date) return extractHHmm(raw);
      
      const today = getCurrentServerStartOfDay();

      const messageDay = new Date(date);
      messageDay.setHours(0, 0, 0, 0);

      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const locale = this.$i18n.locale || 'ru';
      const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
      const dateLocale = localeMap[locale] || 'ru-RU';

      if (diffDays === 0) return extractHHmm(raw);
      if (diffDays === 1) return this.$t('yesterday');
      if (diffDays < 7) return date.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });
      return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
    },
    getUserInitials(user) {
      if (!user) return "";
      const name = (user.name || "").charAt(0).toUpperCase();
      const surname = (user.surname || "").charAt(0).toUpperCase();
      return (name + surname) || "?";
    },
    getMessageUser(message) {
      if (!message) return null;
      // Check if message has user object directly
      if (message.user && message.user.id) {
        const userId = message.user.id;
        const currentUser = this.$store.state.user;
        if (currentUser && Number(currentUser.id) === Number(userId)) {
          return currentUser;
        }
        const users = this.usersForCompany || [];
        return users.find(u => u && Number(u.id) === Number(userId)) || message.user;
      }
      
      const userId = message.creatorId || message.userId || message.user?.id;
      if (!userId) return null;
      
      // Проверяем, это текущий пользователь?
      const currentUser = this.$store.state.user;
      if (currentUser && Number(currentUser.id) === Number(userId)) {
        return currentUser;
      }
      
      // Ищем пользователя в списке пользователей компании
      const users = this.usersForCompany || [];
      return users.find(u => u && Number(u.id) === Number(userId)) || null;
    },
    getMessageUserName(message) {
      const user = this.getMessageUser(message);
      if (!user) {
        // Fallback: если пользователь не найден, показываем creator_id
        const userId = message.creatorId || message.userId || message.user?.id;
        return userId ? `Пользователь #${userId}` : "Неизвестный";
      }
      const name = user.name || "";
      const surname = user.surname || "";
      return `${name} ${surname}`.trim() || user.displayTitle || "Пользователь";
    },
    getForwardedUserName(forwardedMessage) {
      // forwardedMessage - это объект из forwarded_from, который содержит user
      if (!forwardedMessage) return "Неизвестный";
      
      const user = forwardedMessage.user;
      if (!user) {
        return "Неизвестный";
      }
      
      const name = user.name || "";
      const surname = user.surname || "";
      return `${name} ${surname}`.trim() || "Пользователь";
    },
    getMessageUserInitials(message) {
      const user = this.getMessageUser(message);
      if (!user) {
        const userId = message.creatorId || message.userId || message.user?.id;
        return userId ? String(userId).charAt(0) : "?";
      }
      return this.getUserInitials(user);
    },
    shouldShowAvatarInGroup(message, index, groupMessages) {
      // If it's the last message in the group, we show avatar (unless it's the same user as next group? No, user logic is per-message)
      // Actually we only group by date.
      
      // If index is last in this group: 
      // Theoretically the next group starts with a new date header, so visual separation is strong.
      // So we should simpler logic: always show avatar on the last message of a block of same-user messages.
      
      // Check next message in this group
      if (index === groupMessages.length - 1) {
          // Last in group.
          return true;
      }
      
      const nextMessage = groupMessages[index + 1];
      const currentUserId = message.creatorId || message.userId || message.user?.id;
      const nextUserId = nextMessage.creatorId || nextMessage.userId || nextMessage.user?.id;
      
      // If next message is from different user, show avatar
      if (String(currentUserId) !== String(nextUserId)) {
          return true;
      }
      
      // Same user, next is not date (since we are in group), so hide avatar
      return false;
    },
    shouldShowSenderName(message) {
      // Show sender name only in group/general chats for incoming messages
      const chat = this.selectedChat;
      if (!chat) return false;
      
      // Only show in group/general chats (not in direct chats)
      return chat.type === 'group' || chat.type === 'general';
    },
    getUserColor(message) {
      // Generate consistent color for user based on their ID
      const userId = message.creatorId || message.userId || message.user?.id;
      if (!userId) return '#000000';
      
      const colors = [
        '#e17076', // red
        '#7f8c8d', // gray
        '#a695e7', // purple
        '#7bc862', // green
        '#6ec9cb', // cyan
        '#65aadd', // blue
        '#ee7aae', // pink
      ];
      
      const index = Number(userId) % colors.length;
      return colors[index];
    },
    shouldShowAvatar(item, index, messagesWithDates) {
      // Показываем аватар только для групповых чатов
      // if (!(this.selectedChat?.type === 'group' || this.selectedChat?.type === 'general')) {
      //   return false;
      // }
      
      // Если это разделитель даты, не показываем
      if (item.type === 'date') {
        return false;
      }
      
      // Получаем текущего пользователя сообщения
      const currentUserId = item.data?.creatorId || item.data?.userId || item.data?.user?.id;
      if (!currentUserId) return false;
      
      // Ищем следующее сообщение (не разделитель даты)
      let nextIndex = index + 1;
      while (nextIndex < messagesWithDates.length) {
        const nextItem = messagesWithDates[nextIndex];
        
        // Если следующий элемент - разделитель даты, показываем аватар (это последнее сообщение перед датой)
        if (nextItem.type === 'date') {
          return true;
        }
        
        // Получаем пользователя следующего сообщения
        const nextUserId = nextItem.data?.creatorId || nextItem.data?.userId || nextItem.data?.user?.id;
        
        // Если следующее сообщение от другого пользователя, показываем аватар (это последнее сообщение от текущего пользователя)
        if (nextUserId && Number(nextUserId) !== Number(currentUserId)) {
          return true;
        }
        
        // Если следующее сообщение от того же пользователя, НЕ показываем аватар (это не последнее сообщение в группе)
        if (nextUserId && Number(nextUserId) === Number(currentUserId)) {
          return false;
        }
        
        nextIndex++;
      }
      
      // Если это последнее сообщение в списке, показываем аватар
      return true;
    },
    selectItem(item) {
      if (item.type === 'user') {
        this.openDirect(item);
      } else if (item.type === 'general') {
        this.openGeneralChat();
      } else if (item.type === 'group') {
        this.selectChat(item);
      }
    },
    isItemActive(item) {
      if (!this.selectedChat || !item) return false;
      if (item.type === 'general') {
        return Number(this.selectedChat.id) === Number(item.id);
      }
      if (item.type === 'user') {
        return this.selectedChat.type === 'direct' && 
               Number(this.activePeerUser?.id) === Number(item.id);
      }
      if (item.type === 'group') {
        return Number(this.selectedChat.id) === Number(item.id);
      }
      return false;
    },
    getPeerUserId(chat) {
      if (!chat || chat.type !== 'direct' || !chat.directKey) return null;
      const myId = this.$store.state.user?.id;
      if (!myId) return null;
      
      const parts = String(chat.directKey).split(":").map(x => parseInt(x, 10)).filter(x => !isNaN(x));
      if (parts.length !== 2) return null;
      
      const [a, b] = parts;
      return Number(a) === Number(myId) ? b : a;
    },
    isMyMessageInChat(item) {
      if (!item.lastMessage) return false;
      const myId = this.$store.state.user?.id;
      return myId && Number(item.lastMessage.creatorId) === Number(myId);
    },
    handleEnterKey() {
      if (this.editingMessage) {
        this.saveEdit();
        return;
      }
      if (!this.draft.trim() && this.selectedFiles.length === 0 && !this.audioBlob) return;
      this.send();
    },
    handleShiftEnter() {
      // Shift+Enter добавляет новую строку - ничего не делаем
    },
    closeCreateGroupModal() {
      this.showCreateGroupModal = false;
      this.groupTitle = "";
      this.selectedUserIds = [];
    },
    toggleUserSelection(userId) {
      const id = Number(userId);
      const index = this.selectedUserIds.indexOf(id);
      if (index > -1) {
        this.selectedUserIds.splice(index, 1);
      } else {
        this.selectedUserIds.push(id);
      }
    },
    async createGroupChat() {
      if (!this.canCreateGroup) return;
      
      this.creatingGroup = true;
      try {
        const chat = await ChatController.createGroupChat({
          title: this.groupTitle.trim(),
          creatorIds: this.selectedUserIds,
        });
        
        if (chat) {
          // Добавляем чат в список если его там нет
          const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
          if (!exists) {
            this.chats = [...(this.chats || []), chat];
            globalChatRealtime.syncChats(this.chats);
          }
          
          this.closeCreateGroupModal();
          
          // Открываем созданный чат
          await this.selectChat(chat);
          
          this.$store.dispatch("showNotification", {
            title: "Групповой чат создан",
            subtitle: `Чат "${chat.title}" успешно создан`,
            isDanger: false,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("[Messenger] Ошибка при создании группового чата:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка создания чата",
          subtitle: error?.response?.data?.message || error?.message || "Не удалось создать групповой чат",
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.creatingGroup = false;
      }
    },
    isChatCreator(chat) {
      if (!chat || !chat.id) return false;
      
      const myId = this.$store.state.user?.id;
      if (!myId) return false;
      
      // Находим полную информацию о чате в списке
      const foundChat = this.chats.find(c => Number(c.id) === Number(chat.id));
      const fullChat = foundChat || chat;
      
      // Проверяем тип чата
      if (fullChat.type !== 'group') return false;
      
      // Проверяем created_by
      const createdBy = fullChat.createdBy;
      if (!createdBy) {
        return false;
      }
      
      return Number(createdBy) === Number(myId);
    },
    confirmDeleteChat() {
      if (!this.selectedChat || !this.isChatCreator(this.selectedChat)) return;
      this.showDeleteConfirm = true;
    },
    async deleteChat() {
      if (!this.selectedChat || !this.isChatCreator(this.selectedChat)) return;
      
      const chatId = this.selectedChat.id;
      this.deletingChat = true;
      try {
        await ChatController.deleteChat(chatId);
        
        // Отписываемся от WebSocket перед удалением
        globalChatRealtime.unsubscribeChat(chatId);
        
        // Удаляем чат из списка
        this.chats = (this.chats || []).filter((c) => Number(c.id) !== Number(chatId));
        
        this.selectedChat = null;
        this.selectedChatId = null;
        this.saveSelectedChatId(null);
        this.messages = [];
        this.activePeerUser = null;
        this.showDeleteConfirm = false;
        
        this.$store.dispatch("showNotification", {
          title: "Чат удалён",
          subtitle: "Групповой чат успешно удалён",
          isDanger: false,
          duration: 3000,
        });
      } catch (error) {
        console.error("[Messenger] Ошибка при удалении чата:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка удаления чата",
          subtitle: error?.response?.data?.message || error?.message || "Не удалось удалить чат",
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.deletingChat = false;
      }
    },
  },
};
</script>

<style scoped>
.messages-scroll {
  scroll-behavior: smooth;
}

.messenger-bg {
  background-color: #d9dbd5;
  background-image:
    radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.2) 0 1.5px, transparent 2px),
    radial-gradient(circle at 80px 60px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
    radial-gradient(circle at 120px 30px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.02));
  background-size: 140px 100px, 180px 120px, 200px 120px, 100% 100%;
  background-repeat: repeat, repeat, repeat, no-repeat;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.typing-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  animation: typing-bounce 0.6s ease-in-out infinite both;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

.message-item-last {
  animation: message-in 0.25s ease-out;
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


