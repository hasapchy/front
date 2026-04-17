<template>
  <div class="flex min-h-0 w-full flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-elevated)] max-md:-mx-4 max-md:h-[calc(100dvh-6.75rem-env(safe-area-inset-bottom,0px))] max-md:min-h-[280px] max-md:rounded-none max-md:border-x-0 md:h-[calc(100vh-6rem)] md:flex-row md:rounded-2xl">
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
      <aside
        v-show="messengerShowListPanel"
        class="flex min-h-0 w-full shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-elevated)] max-md:flex-1 md:h-auto md:w-[360px]"
      >
        <!-- Search row -->
        <div class="border-b border-[var(--border-subtle)] px-3 py-2">
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[var(--text-secondary)]" />
              <input
                ref="chatSearchInput"
                v-model="search"
                type="text"
                class="h-9 w-full rounded-full bg-[var(--surface-muted)] pl-9 pr-3 text-sm !shadow-none focus:!shadow-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/35"
                placeholder="Найти сотрудника или чат (Ctrl+K)"
              >
            </div>

            <button
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--nav-accent)] text-white hover:brightness-110"
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
            class="p-4 text-sm text-gray-500 dark:text-[var(--text-secondary)]"
          >
            Нет доступа к чатам
          </div>

          <template v-else>
            <!-- Combined list of chats and users -->
            <div
              v-if="allChatsList.length === 0"
              class="px-4 py-3 text-sm text-gray-500 dark:text-[var(--text-secondary)]"
            >
              Нет чатов
            </div>

            <button
              v-for="item in allChatsList"
              :key="`${item.type}-${item.id}`"
              class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--surface-muted)]"
              :class="isItemActive(item) ? 'bg-[var(--nav-accent)] text-white hover:brightness-110' : ''"
              type="button"
              @click="selectItem(item)"
            >
              <div class="relative shrink-0">
                <!-- Avatar for user or chat icon -->
                <img
                  v-if="item.type === 'user' && item.photo"
                  :src="userPhotoUrl(item.photo)"
                  class="h-10 w-10 rounded-full border border-[var(--border-subtle)] object-cover"
                  alt="user"
                  @error="applyAvatarImageFallback"
                >
                <div
                  v-else-if="item.type === 'user'"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-[color-mix(in_srgb,#5CB85C_22%,var(--surface-muted))] text-[#2c692d] dark:bg-green-950/45 dark:text-green-400'"
                >
                  {{ getUserInitials(item) }}
                </div>
                <div
                  v-else-if="item.type === 'general'"
                  class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--text-primary)]'"
                >
                  <i class="fas fa-comments" />
                </div>
                <div
                  v-else-if="item.type === 'group'"
                  class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                  :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--text-primary)]'"
                >
                  <i class="fas fa-users" />
                </div>
              
                <!-- Online indicator for users -->
                <span
                  v-if="item.type === 'user'"
                  class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--surface-elevated)]"
                  :class="isUserOnline(item) ? 'bg-[#5CB85C]' : 'bg-gray-300 dark:bg-[var(--border-subtle)]'"
                />
              </div>
            
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <div
                    class="font-semibold text-sm truncate"
                    :class="isItemActive(item) ? 'text-white' : 'text-gray-900 dark:text-[var(--text-primary)]'"
                  >
                    {{ getItemTitle(item) }}
                  </div>
                  <div
                    class="text-[11px] shrink-0 flex items-center gap-1"
                    :class="isItemActive(item) ? 'text-white/80' : 'text-gray-400 dark:text-[var(--text-secondary)]'"
                  >
                    <span v-if="item.lastMessageAt || item.lastMessage">{{ formatChatTime(item) }}</span>
                    <span
                      v-if="item.type === 'user' && chatLastTicks(item)"
                      class="text-[var(--nav-accent)]"
                    >{{ chatLastTicks(item) }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2 mt-0.5">
                  <div
                    class="text-xs truncate"
                    :class="isItemActive(item) ? 'text-white/90' : 'text-gray-500 dark:text-[var(--text-secondary)]'"
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
      <section
        v-show="messengerShowThreadPanel"
        class="flex min-h-0 min-w-0 flex-1 flex-col max-md:w-full"
      >
        <!-- Top bar -->
        <div
          v-if="selectedChat && activePeerUser"
          class="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-1"
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Left: User info -->
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <button
                v-if="isMessengerCompact && selectedChat"
                type="button"
                class="mr-0.5 -ml-1 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)] md:hidden"
                :title="$t('messengerBackToChatList')"
                :aria-label="$t('messengerBackToChatList')"
                @click="backToMessengerList"
              >
                <i class="fas fa-arrow-left text-lg" />
              </button>
              <!-- Large avatar -->
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--border-subtle)]">
                <img
                  v-if="activePeerUser.photo"
                  :src="userPhotoUrl(activePeerUser.photo)"
                  class="w-full h-full object-cover"
                  alt="user"
                  @error="applyAvatarImageFallback"
                >
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,#5CB85C_22%,var(--surface-muted))] text-lg font-semibold text-[#2c692d] dark:bg-green-950/40 dark:text-green-400"
                >
                  {{ getUserInitials(activePeerUser) }}
                </div>
              </div>
            
              <!-- Name and status -->
              <div class="min-w-0 flex-1">
                <div class="text-base font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                  {{ activePeerUser.name }} {{ activePeerUser.surname || "" }}
                </div>
                <div class="mt-0.5 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                  <span class="text-[#5CB85C] dark:text-green-400">{{ presenceStatusText }}</span>
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
          class="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <button
              v-if="isMessengerCompact && selectedChat"
              type="button"
              class="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)] md:hidden"
              :title="$t('messengerBackToChatList')"
              :aria-label="$t('messengerBackToChatList')"
              @click="backToMessengerList"
            >
              <i class="fas fa-arrow-left text-lg" />
            </button>
            <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <i
                class="fas"
                :class="chatIcon(selectedChat)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                {{ chatTitle(selectedChat) }}
              </div>
              <div class="truncate text-xs text-gray-400 dark:text-[var(--text-secondary)]">
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
              class="flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40"
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
          class="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2"
        >
          <div
            ref="messageSearchWrap"
            class="relative flex-1"
          >
            <i class="fas fa-search pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[var(--text-secondary)]" />
            <input
              v-model="messageSearchQuery"
              type="text"
              class="h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] pl-3 pr-9 text-sm !shadow-none focus:!shadow-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/35"
              placeholder="Поиск по сообщениям"
            >
            <div
              v-if="messageSearchResults.length > 0"
              class="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-lg"
            >
              <button
                v-for="msg in messageSearchResults"
                :key="msg.id"
                type="button"
                class="w-full border-b border-[var(--border-subtle)] px-3 py-2 text-left text-sm last:border-0 hover:bg-[var(--surface-muted)]"
                @click="goToSearchMessage(msg)"
              >
                <span class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">{{ getMessageUserName(msg) }} · {{ messageTime(msg) }}</span>
                <div
                  class="truncate text-gray-900 dark:text-[var(--text-primary)]"
                  v-html="highlightSearchQuery(msg.body)"
                />
              </button>
            </div>
          </div>
          <i
            v-if="loadingSearch"
            class="fas fa-spinner fa-spin text-gray-400 dark:text-[var(--text-secondary)]"
          />
        </div>

        <div
          v-if="selectedChat && selectedChat.pinnedMessage"
          class="flex w-full items-center gap-2 border-b border-[var(--border-subtle)] bg-amber-50/80 px-3 py-2 text-left text-sm text-gray-700 hover:bg-amber-100/80 dark:bg-amber-950/35 dark:text-[var(--text-primary)] dark:hover:bg-amber-950/50"
        >
          <button
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-600 hover:bg-amber-200/80 dark:text-amber-400 dark:hover:bg-amber-900/40"
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
          class="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4"
        >
          <div class="flex min-w-0 items-center gap-2">
            <button
              v-if="isMessengerCompact && selectedChat"
              type="button"
              class="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)] md:hidden"
              :title="$t('messengerBackToChatList')"
              :aria-label="$t('messengerBackToChatList')"
              @click="backToMessengerList"
            >
              <i class="fas fa-arrow-left text-lg" />
            </button>
            <div class="truncate font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t("messenger") }}
            </div>
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
              <div class="text-center text-gray-600 dark:text-[var(--text-secondary)]">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] dark:bg-[var(--surface-muted)]">
                  <i class="fas fa-comments text-xl text-[var(--nav-accent)]" />
                </div>
                <div class="mt-3 font-semibold text-[var(--text-primary)]">
                  {{ $t('messengerOpenChatTitle') }}
                </div>
                <div class="mt-1 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
                  {{ $t('messengerSelectChatHint') }}
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
                <div class="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 px-4 py-2 text-xs text-gray-600 shadow-sm backdrop-blur-sm dark:text-[var(--text-secondary)]">
                  <i class="fas fa-spinner fa-spin" />
                  Загрузка сообщений...
                </div>
              </div>
          
              <div
                v-if="loadingMessages"
                class="text-sm text-gray-600 dark:text-[var(--text-secondary)]"
              >
                Загрузка…
              </div>

              <template v-else>
                <!-- "Новые сообщения" separator (if there are unread messages) -->
                <div
                  v-if="hasUnreadMessages"
                  class="flex items-center gap-3 my-3"
                >
                  <div class="h-px flex-1 bg-gray-300 dark:bg-[var(--border-subtle)]" />
                  <div class="px-2 text-xs font-medium text-gray-500 dark:text-[var(--text-secondary)]">
                    Новые сообщения
                  </div>
                  <div class="h-px flex-1 bg-gray-300 dark:bg-[var(--border-subtle)]" />
                </div>

                <div
                  v-for="group in messageGroups"
                  :key="group.id"
                  class="relative"
                >
                  <!-- Sticky Date Header -->
                  <div class="sticky top-0 z-10 flex justify-center my-3 -mx-4 md:-mx-6 py-2 bg-transparent pointer-events-none">
                    <div class="pointer-events-auto rounded-full bg-[#c3e3a7] px-3 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-[color-mix(in_srgb,#5CB85C_35%,var(--surface-muted))] dark:text-[var(--text-primary)]">
                      {{ group.dateLabel }}
                    </div>
                  </div>

                  <!-- Messages -->
                  <div
                    v-for="message in group.messages"
                    :id="'msg-' + message.id"
                    :key="message.id"
                    class="flex mb-1 group message-item"
                    :class="[isMyMessage(message) ? 'justify-end' : 'justify-start', { 'message-item-last': isLastMessage(group, message), 'messenger-message-highlight': highlightMessageId && Number(message.id) === highlightMessageId }]"
                    @contextmenu.prevent="showMessageMenu($event, message)"
                  >
                    <div 
                      class="flex max-w-[min(92%,24rem)] flex-col md:max-w-[75%]"
                      :class="isMyMessage(message) ? 'items-end' : 'items-start'"
                    >
                      <!-- Sender name (only for incoming messages in group chats) -->
                      <div 
                        v-if="!isMyMessage(message) && shouldShowSenderName()"
                        class="text-xs font-medium mb-1 ml-3"
                        :style="{ color: getUserColor(message) }"
                      >
                        {{ getMessageUserName(message) }}
                      </div>

                      <div class="flex items-end gap-2">
                        <div
                          class="relative rounded-2xl px-3 py-2 text-sm shadow-sm"
                          :class="isMyMessage(message) ? 'rounded-tr-sm bg-[#d9f6c9] text-gray-900 dark:bg-[color-mix(in_srgb,#5CB85C_28%,var(--surface-elevated))] dark:text-[var(--text-primary)]' : 'rounded-tl-sm bg-white text-gray-900 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]'"
                        >
                          <!-- Reply preview -->
                          <div
                            v-if="message.parent"
                            class="mb-2 border-l-2 border-gray-400 pb-2 pl-2 text-xs text-gray-600 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)]"
                          >
                            <div class="font-medium text-gray-700 dark:text-[var(--text-primary)]">
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
                            <div class="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5CB85C]">
                              <span>Переслано от</span>
                              <span class="font-semibold text-[#348534]">{{ getForwardedUserName(message.forwardedFrom) }}</span>
                            </div>
                            <!-- Forwarded message content -->
                            <div class="text-sm text-gray-900 dark:text-[var(--text-primary)]">
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
                                    class="block text-xs underline text-gray-600 hover:text-gray-800 dark:text-[var(--label-accent)] dark:hover:text-[var(--nav-accent-hover)]"
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
                                class="flex min-w-[200px] items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-[var(--surface-muted)]"
                              >
                                <button
                                  type="button"
                                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--nav-accent)] text-white hover:brightness-110"
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
                                    class="h-1.5 w-full cursor-pointer rounded accent-[var(--nav-accent)]"
                                    :value="voiceCurrentTime(message, getMessageFileIndex(message, f))"
                                    :max="voiceDuration(message, getMessageFileIndex(message, f)) || 100"
                                    min="0"
                                    step="0.1"
                                    @input="seekVoice(message, getMessageFileIndex(message, f), $event)"
                                  >
                                  <div class="flex justify-between text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                                    <span>{{ formatVoiceTime(voiceCurrentTime(message, getMessageFileIndex(message, f))) }}</span>
                                    <span>{{ formatVoiceTime(voiceDuration(message, getMessageFileIndex(message, f))) }}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-gray-600 hover:text-[var(--nav-accent)] dark:text-[var(--text-secondary)]"
                                  @click="cycleVoiceSpeed(message, getMessageFileIndex(message, f))"
                                >
                                  {{ voiceSpeedLabel(message, getMessageFileIndex(message, f)) }}
                                </button>
                              </div>
                              <a
                                v-else
                                class="block text-xs underline text-[var(--nav-accent)]"
                                :href="fileUrl(f.path)"
                                target="_blank"
                              >
                                <i class="fas fa-file mr-1" />{{ f.name }}
                              </a>
                            </div>
                          </div>

                          <div
                            v-if="message.failed"
                            class="mt-2 flex items-center justify-between gap-2 border-t border-gray-200/80 pt-2 dark:border-[var(--border-subtle)]"
                          >
                            <span class="text-xs text-red-600 dark:text-red-400">Не удалось отправить</span>
                            <button
                              type="button"
                              class="text-xs font-medium text-[var(--nav-accent)] hover:brightness-110"
                              @click="retrySendMessage(message)"
                            >
                              Повторить
                            </button>
                          </div>
                          <!-- Reactions left, then time and status (Telegram-style) -->
                          <div
                            class="mt-1 flex items-center justify-end gap-1.5 flex-wrap"
                            :class="isMyMessage(message) ? 'text-gray-600 dark:text-[var(--text-secondary)]' : 'text-gray-500 dark:text-[var(--text-secondary)]'"
                          >
                            <div class="flex items-center gap-0.5 mr-1">
                              <button
                                v-for="g in messageReactionsGrouped(message)"
                                :key="g.emoji"
                                type="button"
                                class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs min-w-[24px] justify-center"
                                :class="g.my ? 'bg-[color-mix(in_srgb,var(--nav-accent)_20%,var(--surface-muted))] text-[var(--nav-accent)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_22%,var(--surface-muted))] dark:text-[var(--label-accent)]' : 'bg-black/5 text-gray-700 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)]'"
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
                                class="flex h-6 w-6 items-center justify-center rounded text-xs text-gray-400 opacity-0 transition-opacity hover:bg-black/10 hover:text-gray-600 group-hover:opacity-100 hover:opacity-100 dark:text-[var(--text-secondary)] dark:hover:bg-white/10 dark:hover:text-[var(--text-primary)]"
                                title="Добавить реакцию"
                                @click.stop="openReactionPicker(message.id)"
                              >
                                <i class="fas fa-smile" />
                              </button>
                              <div
                                v-if="reactionPickerMessageId === message.id"
                                class="ml-0.5 inline-flex gap-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1 shadow-lg"
                              >
                                <button
                                  v-for="e in reactionEmojis"
                                  :key="e"
                                  type="button"
                                  class="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[var(--surface-muted)]"
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
                                class="text-[#5CB85C]"
                              >{{ messageTicks(message) }}</span>
                            </span>
                          </div>
                        </div>
                        <div class="self-start shrink-0 mt-1 ml-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            class="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-xs text-gray-500 hover:bg-[var(--surface-elevated)] hover:text-gray-700 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
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
                  <div class="typing-indicator-inline flex max-w-[min(92%,24rem)] items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-gray-600 shadow-sm dark:text-[var(--text-secondary)] md:max-w-[75%]">
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
            class="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-gray-600 shadow-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--nav-accent)] dark:text-[var(--text-secondary)]"
            title="В конец чата"
            @click="scrollToBottomAndResetNewCount"
          >
            <i class="fas fa-chevron-down text-lg" />
            <span
              v-if="newMessagesBelowCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--nav-accent)] px-1 text-xs text-white"
            >
              {{ newMessagesBelowCount > 99 ? '99+' : newMessagesBelowCount }}
            </span>
          </button>
        </div>

        <!-- Composer (Telegram-like) -->
        <div
          ref="composerArea"
          class="flex min-h-[52px] flex-col justify-end border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] transition-colors"
          :class="{ 'bg-[color-mix(in_srgb,var(--nav-accent)_12%,var(--surface-muted))] ring-2 ring-[var(--nav-accent)]/35 ring-inset dark:bg-[color-mix(in_srgb,var(--nav-accent)_14%,var(--surface-muted))] dark:ring-[var(--nav-accent)]/45': composerDropActive }"
          @paste="onComposerPaste"
          @dragover.prevent="onComposerDragover"
          @dragleave="onComposerDragleave"
          @drop.prevent="onComposerDrop"
        >
          <div
            v-if="replyingTo"
            class="mb-2 flex items-start justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 px-3 py-1.5 dark:bg-[var(--surface-elevated)]"
          >
            <div class="min-w-0 flex-1">
              <div class="mb-0.5 text-xs font-medium text-gray-700 dark:text-[var(--text-primary)]">
                Ответ на сообщение от {{ getMessageUserName(replyingTo) }}
              </div>
              <div class="truncate text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                {{ replyingTo.body || (replyingTo.files?.length ? `Файлов: ${replyingTo.files.length}` : '') }}
              </div>
            </div>
            <button
              type="button"
              class="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
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
              class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1.5 pl-2.5 pr-1.5 text-xs text-gray-700 shadow-sm dark:text-[var(--text-primary)]"
            >
              <i class="fas fa-file shrink-0 text-[var(--nav-accent)]" />
              <span class="max-w-[100px] truncate">{{ f.name }}</span>
              <button
                type="button"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
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
              class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1.5 pl-2.5 pr-1.5 text-xs text-gray-700 shadow-sm dark:text-[var(--text-primary)]"
            >
              <i class="fas fa-file shrink-0 text-[var(--nav-accent)]" />
              <span class="max-w-[100px] truncate">{{ f.name || f.path || 'Файл' }}</span>
              <button
                type="button"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
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
            class="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 shadow-sm"
          >
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Отменить"
              @click="cancelAudioRecording"
            >
              <i class="fas fa-trash-alt text-sm" />
            </button>
            <div class="flex-1 flex items-center gap-2 min-w-0">
              <i class="fas fa-circle animate-pulse text-red-500 text-xs shrink-0" />
              <span class="text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">{{ audioRecordingTime }} с</span>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-gray-700 hover:bg-[var(--surface-page)] disabled:opacity-50 dark:text-[var(--text-primary)]"
              :disabled="!selectedChat || !canWrite"
              title="Добавить в сообщение и продолжить набор"
              @click="addVoiceToMessage"
            >
              <i class="fas fa-plus text-sm" />
            </button>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nav-accent)] text-white hover:brightness-110 disabled:opacity-50"
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
                class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[var(--surface-elevated)] disabled:opacity-50 dark:text-[var(--text-secondary)]"
                :disabled="!selectedChat || !canWrite || selectedFiles.length >= maxFilesPerSend"
                :title="selectedFiles.length >= maxFilesPerSend ? `Макс. ${maxFilesPerSend} файлов` : 'Прикрепить файл'"
                @click="$refs.fileInput?.click()"
              >
                <i class="fas fa-paperclip text-lg" />
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[var(--surface-elevated)] disabled:opacity-50 dark:text-[var(--text-secondary)]"
                :disabled="!selectedChat || !canWrite"
                :class="{ 'bg-[var(--surface-elevated)]': showEmojiPicker }"
                title="Смайл"
                @click="showEmojiPicker = true"
              >
                <i class="fas fa-smile text-lg" />
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[var(--surface-elevated)] disabled:opacity-50 dark:text-[var(--text-secondary)]"
                :disabled="!selectedChat || !canWrite || selectedFiles.length >= maxFilesPerSend"
                :title="selectedFiles.length >= maxFilesPerSend ? `Макс. ${maxFilesPerSend} файлов` : 'Записать аудио'"
                @click="toggleAudioRecording"
              >
                <i class="fas fa-microphone text-lg" />
              </button>
            </div>

            <div class="flex min-w-0 flex-1 flex-col justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-sm transition-shadow focus-within:border-[var(--nav-accent)]/50 focus-within:ring-1 focus-within:ring-[var(--nav-accent)]/25">
              <textarea
                ref="composerTextarea"
                v-model="draft"
                class="max-h-28 min-h-[24px] w-full resize-none border-0 bg-transparent px-4 py-2.5 text-sm !shadow-none text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-0"
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
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nav-accent)] text-white transition-colors hover:brightness-110 disabled:bg-gray-300 disabled:opacity-50"
                :disabled="!selectedChat || !canWrite || sending || (!draft.trim() && selectedFiles.length === 0 && !audioBlob)"
                type="button"
                title="Отправить"
                @click="send"
              >
                <i class="fas fa-paper-plane text-sm" />
              </button>
              <button
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#5CB85C] to-[#4EA84E] text-white transition-colors hover:brightness-110 disabled:bg-gray-300 disabled:opacity-50"
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
          class="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <span class="font-semibold text-[var(--text-primary)]">Смайлы</span>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
              @click="showEmojiPicker = false"
            >
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="grid grid-cols-6 gap-2 overflow-y-auto p-4">
            <button
              v-for="(emoji, idx) in composerEmojis"
              :key="idx"
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-xl text-3xl transition-colors hover:bg-[var(--surface-muted)]"
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
        <div class="mx-4 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl">
          <div class="border-b border-[var(--border-subtle)] px-6 py-4">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
              Удалить групповой чат?
            </h3>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-[var(--text-secondary)]">
              Вы уверены, что хотите удалить чат "{{ selectedChat?.title }}"? 
              Это действие нельзя отменить. Все сообщения и участники будут удалены.
            </p>
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
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
        <div class="mx-4 flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
              Создать групповой чат
            </h3>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
              @click="closeCreateGroupModal"
            >
              <i class="fas fa-times text-sm" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <!-- Title input -->
            <div>
              <label class="mb-2 block text-sm font-medium text-[var(--text-primary)]">Название чата</label>
              <input
                v-model="groupTitle"
                type="text"
                class="h-10 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm !shadow-none text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/35"
                placeholder="Введите название группы"
                maxlength="255"
              >
            </div>

            <!-- Users selection -->
            <div>
              <label class="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Участники ({{ selectedUserIds.length }} выбрано)
              </label>
              <div class="max-h-64 overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
                <div
                  v-for="user in usersForCompany.filter(u => u && u.id !== $store.state.user?.id)"
                  :key="user.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--surface-muted)]"
                  @click="toggleUserSelection(user.id)"
                >
                  <div class="relative shrink-0">
                    <img
                      v-if="user.photo"
                      :src="userPhotoUrl(user.photo)"
                      class="h-10 w-10 rounded-full border border-[var(--border-subtle)] object-cover"
                      alt="user"
                      @error="applyAvatarImageFallback"
                    >
                    <div
                      v-else
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,#5CB85C_22%,var(--surface-muted))] text-xs font-semibold text-[#2c692d] dark:bg-green-950/40 dark:text-green-400"
                    >
                      {{ getUserInitials(user) }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-[var(--text-primary)]">
                      {{ user.name }} {{ user.surname || "" }}
                    </div>
                    <div
                      v-if="user.position"
                      class="truncate text-xs text-[var(--text-secondary)]"
                    >
                      {{ user.position }}
                    </div>
                  </div>
                  <div
                    class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                    :class="selectedUserIds.includes(Number(user.id)) ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)]' : 'border-[var(--border-subtle)]'"
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
          <div class="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              @click="closeCreateGroupModal"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded-lg bg-[var(--nav-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
        class="fixed z-[100] min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1 shadow-xl"
        :style="messageMenuStyle"
        @click.stop
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
          @click="replyToMessage(messageMenuTarget)"
        >
          <i class="fas fa-reply text-xs" />
          Ответить
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
          @click="forwardMessage(messageMenuTarget)"
        >
          <i class="fas fa-share text-xs" />
          Переслать
        </button>

        <template v-if="!String(messageMenuTarget?.id).startsWith('temp-')">
          <div class="my-1 border-t border-[var(--border-subtle)]" />
          <button
            v-if="selectedChat && selectedChat.pinnedMessage?.id !== messageMenuTarget?.id"
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
            @click="confirmPinMessage(messageMenuTarget)"
          >
            <i class="fas fa-thumbtack text-xs" />
            Закрепить
          </button>
          <button
            v-if="selectedChat && selectedChat.pinnedMessage?.id === messageMenuTarget?.id"
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
            @click="unpinMessage(); closeMessageMenu()"
          >
            <i class="fas fa-thumbtack rotate-45 text-xs" />
            Открепить
          </button>
        </template>

        <!-- Edit and Delete options only for own messages -->
        <template v-if="isMyMessage(messageMenuTarget)">
          <div class="my-1 border-t border-[var(--border-subtle)]" />
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
            @click="editMessage(messageMenuTarget)"
          >
            <i class="fas fa-edit text-xs" />
            Редактировать
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
        <div class="mx-4 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl">
          <div class="border-b border-[var(--border-subtle)] px-6 py-4">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
              Переслать сообщение
            </h3>
          </div>
          <div class="max-h-96 overflow-y-auto px-6 py-4">
            <div class="space-y-2">
              <button
                v-for="chat in allChatsList.filter(c => c.id !== selectedChatId)"
                :key="`${chat.type}-${chat.id}`"
                type="button"
                class="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-[var(--surface-muted)]"
                :class="forwardTarget && String(forwardTarget.type) === String(chat.type) && Number(forwardTarget.id) === Number(chat.id) ? 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,var(--surface-muted))]' : 'border-transparent'"
                @click="selectForwardTarget(chat)"
              >
                <div class="relative shrink-0">
                  <img
                    v-if="chat.type === 'user' && chat.photo"
                    :src="userPhotoUrl(chat.photo)"
                    class="h-10 w-10 rounded-full border border-[var(--border-subtle)] object-cover"
                    alt="user"
                    @error="applyAvatarImageFallback"
                  >
                  <div
                    v-else-if="chat.type === 'user'"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,#5CB85C_22%,var(--surface-muted))] text-xs font-semibold text-[#2c692d] dark:bg-green-950/40 dark:text-green-400"
                  >
                    {{ getUserInitials(chat) }}
                  </div>
                  <div
                    v-else-if="chat.type === 'general'"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)]"
                  >
                    <i class="fas fa-comments" />
                  </div>
                  <div
                    v-else-if="chat.type === 'group'"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)]"
                  >
                    <i class="fas fa-users" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium text-[var(--text-primary)]">
                    {{ getItemTitle(chat) }}
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div class="border-t border-[var(--border-subtle)] px-6 py-4">
            <div
              v-if="forwardTarget"
              class="mb-2 text-xs text-[var(--text-secondary)]"
            >
              Кому: <span class="font-medium text-[var(--text-primary)]">{{ getItemTitle(forwardTarget) }}</span>
            </div>

            <textarea
              v-model="forwardText"
              class="max-h-28 min-h-[44px] w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2 text-sm !shadow-none text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--nav-accent)] focus:ring-2 focus:ring-[var(--nav-accent)]/25"
              placeholder="Добавить сообщение (как в Telegram)..."
              :disabled="forwardingSending"
            />

            <div class="mt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                :disabled="forwardingSending"
                @click="closeForwardModal"
              >
                Отмена
              </button>
              <button
                type="button"
                class="rounded-lg bg-[var(--nav-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div class="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl">
          <div class="flex items-start gap-4 p-5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-muted))]">
              <i class="fas fa-info text-lg text-[var(--nav-accent)]" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-[var(--text-primary)]">
                Закрепить сообщение
              </h3>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Закреплённое сообщение увидят все участники чата.
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2 px-5 pb-4">
            <button
              type="button"
              class="w-full rounded-lg bg-[var(--nav-accent)] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
              :disabled="pinConfirmLoading"
              @click="doPinConfirm"
            >
              <span v-if="pinConfirmLoading">Закрепление…</span>
              <span v-else>Закрепить</span>
            </button>
            <button
              type="button"
              class="w-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
import { applySentMessage, handleChatReadEvent, handleIncomingChatEvent } from "@/services/messengerFacade";
import globalChatRealtime from "@/services/globalChatRealtime";
import { eventBus } from "@/eventBus";
import ChatSkeleton from "@/views/components/app/ChatSkeleton.vue";
import { applyAvatarImageFallback } from "@/constants/imageFallback";

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
      messengerShowChatList: true,
      messengerLayoutWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,

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
      voiceRecordStream: null,
      voicePreloadQueue: [],
      voicePreloadKey: null,
      voiceIntersectionObserver: null,

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
      typingDebounceTimer: null,

      composerDropActive: false,
      showEmojiPicker: false,
      composerEmojis: ['😀', '😊', '🥰', '😘', '😍', '🤗', '👍', '👎', '❤️', '😂', '😮', '😢', '👏', '🙌', '😅', '🤣', '😭', '😡', '🥱', '😴', '🤔', '😎', '🔥', '✨', '💯'],

      messageSearchQuery: '',
      messageSearchResults: [],
      loadingSearch: false,
      scrollToMessageId: null,
      pendingFocusMessageId: null,
      highlightMessageId: null,
      messageSearchDebounceTimer: null,
      messagesAtBottom: true,
      newMessagesBelowCount: 0,

      voiceCurrent: null,
      voicePlayerState: {},

      pendingRetryByTempId: {},

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
    isMessengerCompact() {
      return this.messengerLayoutWidth < 768;
    },
    messengerShowListPanel() {
      return !this.isMessengerCompact || this.messengerShowChatList;
    },
    messengerShowThreadPanel() {
      return !this.isMessengerCompact || !this.messengerShowChatList;
    },
  },
  watch: {
    messengerLayoutWidth() {
      if (this.messengerLayoutWidth >= 768) {
        this.messengerShowChatList = true;
      }
    },
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
      if (this.messageSearchDebounceTimer) clearTimeout(this.messageSearchDebounceTimer);
      if (!val || !this.selectedChatId) {
        this.messageSearchResults = [];
        return;
      }
      this.messageSearchDebounceTimer = setTimeout(() => {
        this.messageSearchDebounceTimer = null;
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
    },
    "$route.fullPath"() {
      this.$nextTick(() => {
        this.applyMessengerOpenQuery();
      });
    },
  },
  async mounted() {
    this.messengerLayoutWidth = window.innerWidth;
    window.addEventListener('resize', this.onMessengerWindowResize, { passive: true });

    try {
      await this.ensureUsersLoaded();
      await this.loadChats();

      await this.applyMessengerOpenQuery();

      if (this.selectedChat && this.isMessengerCompact) {
        this.messengerShowChatList = false;
      }
      
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
    window.removeEventListener('resize', this.onMessengerWindowResize);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('click', this.closeMessageSearchOnClickOutside);
    this.removeEventListeners();
    if (this.voiceIntersectionObserver) {
      this.voiceIntersectionObserver.disconnect();
      this.voiceIntersectionObserver = null;
    }
    this.onlineUserIds = [];
  },
  methods: {
    applyAvatarImageFallback,
    onMessengerWindowResize() {
      this.messengerLayoutWidth = window.innerWidth;
    },
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
      if (this.typingDebounceTimer) clearTimeout(this.typingDebounceTimer);
      this.typingDebounceTimer = setTimeout(() => {
        this.typingDebounceTimer = null;
        ChatController.sendTyping(this.selectedChatId);
      }, 2000); //400
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
      } catch {
        this.messageSearchResults = [];
      } finally {
        this.loadingSearch = false;
      }
    },
    async goToSearchMessage(msg) {
      if (!msg?.id) return;
      this.messageSearchResults = [];
      await this.focusMessageById(msg.id);
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
        this.pendingFocusMessageId = null;
        this.highlightMessageId = null;

        // Reload users for new company
        await this.ensureUsersLoaded();

        await this.loadChats();
        await globalChatRealtime.reinitialize();
        await this.applyMessengerOpenQuery();
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
  
    async applyMessengerOpenQuery() {
      const q = this.$route.query;
      const openChatId = Number(q.open_chat ?? q.openChat);
      const focusMsg = Number(q.focus_message ?? q.message_id);
      if (!openChatId) {
        return;
      }
      let chatToOpen = (this.chats || []).find((c) => Number(c.id) === openChatId);
      if (!chatToOpen && this.generalChat && Number(this.generalChat.id) === openChatId) {
        chatToOpen = this.generalChat;
      }
      if (!chatToOpen) {
        return;
      }
      const sameChat = Number(this.selectedChatId) === openChatId;
      if (!sameChat) {
        this.pendingFocusMessageId = focusMsg > 0 ? focusMsg : null;
        await this.selectChat(chatToOpen);
        return;
      }
      if (focusMsg > 0) {
        await this.focusMessageById(focusMsg);
      }
    },

    async focusMessageById(messageId) {
      const mid = Number(messageId);
      if (!this.selectedChatId || !mid) {
        return;
      }
      const inList = (this.messages || []).some((m) => Number(m.id) === mid);
      if (!inList) {
        try {
          const loaded = await ChatController.getMessages(this.selectedChatId, { beforeId: mid + 1, limit: 50 });
          const arr = Array.isArray(loaded) ? loaded : [];
          this.messages = arr;
          this.hasMoreMessages = arr.length >= 50;
        } catch {
          void 0;
        }
      }
      await this.$nextTick();
      this.highlightMessageId = mid;
      this.scrollToMessageId = mid;
      window.setTimeout(() => {
        if (this.highlightMessageId === mid) {
          this.highlightMessageId = null;
        }
      }, 3200);
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
        
        const hadPendingFocus = !!this.pendingFocusMessageId;
        await this.loadMessages(fullChat.id, { skipScrollToBottom: hadPendingFocus });
        
        this.openMessengerThreadIfCompact();

        await this.$nextTick();
        const pendingFocus = this.pendingFocusMessageId;
        this.pendingFocusMessageId = null;
        if (pendingFocus) {
          await this.focusMessageById(pendingFocus);
        } else {
          setTimeout(() => {
            this.scrollToBottom(true);
          }, 200);
        }
      } catch (e) {
        console.error("[Messenger] Ошибка при выборе чата:", e);
      }
    },

    openMessengerThreadIfCompact() {
      if (this.isMessengerCompact) {
        this.messengerShowChatList = false;
      }
    },

    backToMessengerList() {
      this.messengerShowChatList = true;
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
        } catch {
          void 0;
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
    async loadMessages(chatId, options = {}) {
      const skipScrollToBottom = !!options.skipScrollToBottom;
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
        if (!skipScrollToBottom) {
          this.scrollToBottom(true);
        }
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
      } catch {
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
    onComposerDragover() {
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
      if (!this.voiceIntersectionObserver) {
        this.voiceIntersectionObserver = new IntersectionObserver((entries) => {
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
      this.voiceIntersectionObserver.observe(el);
    },
    loadVoiceMetadata(key, path) {
      if (this.voicePlayerState[key]?.duration > 0) return;
      if (this.voicePreloadKey !== null) {
        this.voicePreloadQueue.push({ key, path });
        return;
      }
      const preload = this.$refs.voicePreload;
      if (!preload) return;
      this.voicePreloadKey = key;
      preload.src = path;
    },
    processPreloadQueue() {
      if (this.voicePreloadKey !== null || !this.voicePreloadQueue.length) return;
      const { key, path } = this.voicePreloadQueue.shift();
      if (this.voicePlayerState[key]?.duration > 0) {
        this.$nextTick(() => this.processPreloadQueue());
        return;
      }
      const preload = this.$refs.voicePreload;
      if (!preload) return;
      this.voicePreloadKey = key;
      preload.src = path;
    },
    onVoicePreloadMetadata() {
      const key = this.voicePreloadKey;
      const preload = this.$refs.voicePreload;
      if (key != null && preload) {
        if (!this.voicePlayerState[key]) this.voicePlayerState[key] = { currentTime: 0, duration: 0, playing: false, playbackRate: 1 };
        this.voicePlayerState[key].duration = preload.duration || 0;
      }
      this.voicePreloadKey = null;
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
        this.voiceRecordStream = stream;
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          const streamToStop = this.voiceRecordStream;
          this.voiceRecordStream = null;
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
      } catch {
        void 0;
      }
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
          delete this.pendingRetryByTempId[tempId];
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
        this.pendingRetryByTempId[tempId] = { body, files, parentId: parentId };
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
      const companyId = this.$store.getters.currentCompanyId;
      return this.$storageUi.messengerSelectedChatStorageKey(
        companyId != null && companyId !== '' ? companyId : 0
      );
    },
    getSavedSelectedChatId() {
      try {
        const raw = localStorage.getItem(this.getMessengerSelectedChatKey());
        return raw ? String(raw).trim() || null : null;
      } catch {
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
      } catch {
        void 0;
      }
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
      const pending = this.pendingRetryByTempId[tempId];
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
          delete this.pendingRetryByTempId[tempId];
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
      } catch {
        void 0;
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
    shouldShowSenderName() {
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

.messenger-message-highlight {
  border-radius: 0.75rem;
  animation: messenger-highlight-pulse 1s ease-in-out 2;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.75);
}

@keyframes messenger-highlight-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.75);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.35);
  }
}
</style>


