<template>
  <div class="h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <!-- LEFT: list -->
    <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <!-- Search row -->
      <div class="px-3 py-2 border-b border-gray-200">
        <div class="flex items-center gap-2">

          <div class="flex-1 relative">
            <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              v-model="search"
              type="text"
              class="w-full h-9 rounded-full bg-gray-100 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Найти сотрудника или чат"
            />
          </div>

          <button
            class="w-9 h-9 rounded-lg bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0"
            title="Создать групповой чат"
            type="button"
            @click="showCreateGroupModal = true"
          >
            <i class="fas fa-users text-sm"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="!hasChatsView" class="p-4 text-sm text-gray-500">
          Нет доступа к чатам
        </div>

        <template v-else>
          <!-- Combined list of chats and users -->
          <div v-if="allChatsList.length === 0" class="px-4 py-3 text-sm text-gray-500">
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
              />
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
                <i class="fas fa-comments"></i>
              </div>
              <div
                v-else-if="item.type === 'group'"
                class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <i class="fas fa-users"></i>
              </div>
              
              <!-- Online indicator for users -->
              <span
                v-if="item.type === 'user'"
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                :class="isUserOnline(item) ? 'bg-green-500' : 'bg-gray-300'"
              ></span>
            </div>
            
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <div class="font-semibold text-sm truncate" :class="isItemActive(item) ? 'text-white' : 'text-gray-900'">
                  {{ getItemTitle(item) }}
                </div>
                <div class="text-[11px] shrink-0 flex items-center gap-1" :class="isItemActive(item) ? 'text-white/80' : 'text-gray-400'">
                  <span v-if="item.last_message_at || item.last_message">{{ formatChatTime(item) }}</span>
                  <span v-if="item.type === 'user' && chatLastTicks(item)" class="text-sky-600">{{ chatLastTicks(item) }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between gap-2 mt-0.5">
                <div class="text-xs truncate" :class="isItemActive(item) ? 'text-white/90' : 'text-gray-500'">
                  {{ getItemPreview(item) }}
                </div>
                <span
                  v-if="(item.unread_count || 0) > 0"
                  class="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0"
                >
                  {{ item.unread_count }}
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
      <div v-if="selectedChat && activePeerUser" class="px-4 py-1 border-b border-gray-200 bg-white">
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
              />
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
                <span v-if="activePeerUser.position" class="ml-2">{{ activePeerUser.position }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Fallback header for non-direct chats -->
      <div v-else-if="selectedChat" class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            <i class="fas" :class="chatIcon(selectedChat)"></i>
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
            <i class="fas fa-trash text-sm"></i>
          </button>
          
        </div>
      </div>
      
      <!-- Empty state header -->
      <div v-else class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div class="font-semibold text-gray-900">
          {{ $t("messenger") }}
        </div>
      </div>

      <!-- Messages area -->
      <div class="flex-1 min-h-0 messenger-bg overflow-y-auto" ref="messagesWrap">
        <div v-if="!selectedChat" class="h-full flex items-center justify-center p-6">
          <div class="text-center text-gray-600">
            <div class="mx-auto w-14 h-14 rounded-full bg-white/70 border border-white/60 flex items-center justify-center">
              <i class="fas fa-comments text-xl text-sky-600"></i>
            </div>
            <div class="mt-3 font-semibold">Откройте чат</div>
            <div class="mt-1 text-sm text-gray-500">Слева выберите сотрудника или общий чат</div>
          </div>
        </div>

        <div v-else class="p-4 md:p-6 space-y-3">
          <div v-if="loadingMessages" class="text-sm text-gray-600">Загрузка…</div>

          <template v-else>
            <!-- "Новые сообщения" separator (if there are unread messages) -->
            <div v-if="hasUnreadMessages" class="flex items-center gap-3 my-3">
              <div class="flex-1 h-px bg-gray-300"></div>
              <div class="text-xs text-gray-500 font-medium px-2">Новые сообщения</div>
              <div class="flex-1 h-px bg-gray-300"></div>
            </div>

            <template v-for="(item, index) in messagesWithDates" :key="`${item.type}-${item.type === 'date' ? item.date?.getTime() : item.data?.id}-${index}`">
              <!-- Date separator with sticky positioning -->
              <div v-if="item.type === 'date'" class="sticky top-0 z-10 flex justify-center my-3 -mx-4 md:-mx-6 py-2 bg-transparent">
                <div class="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs text-gray-600 border border-white/80 shadow-sm">
                  {{ item.data }}
                </div>
              </div>

              <!-- Message -->
              <div
                v-else
                class="flex mb-2 group"
                :class="isMyMessage(item.data) ? 'justify-end' : 'justify-start'"
                @contextmenu.prevent="showMessageMenu($event, item.data)"
              >
                <div 
                  class="flex flex-col"
                  :class="isMyMessage(item.data) ? 'items-end' : 'items-start'"
                >

                  
                  <div class="flex items-end gap-2" :class="isMyMessage(item.data) ? 'flex-row' : 'flex-row-reverse'">
                    <div
                      class="w-full rounded-xl px-3 py-2 text-sm shadow-sm relative"
                      :class="isMyMessage(item.data) ? 'bg-[#d9f6c9] text-gray-900' : 'bg-white text-gray-900'"
                    >
                      <!-- Reply preview -->
                      <div v-if="item.data.parent" class="mb-2 pb-2 border-l-2 border-gray-400 pl-2 text-xs text-gray-600">
                        <div class="font-medium text-gray-700">
                          {{ getMessageUserName(item.data.parent) }}
                        </div>
                        <div class="truncate">
                          {{ item.data.parent.body || (item.data.parent.files?.length ? `Файлов: ${item.data.parent.files.length}` : '') }}
                        </div>
                      </div>

                      <!-- Forwarded from -->
                      <div v-if="item.data.forwarded_from" class="mb-2 pb-2 border-l-2 border-blue-400 pl-2 text-xs text-gray-600">
                        <div class="font-medium text-blue-700 flex items-center gap-1">
                          <i class="fas fa-share text-xs"></i>
                          Переслано от {{ getMessageUserName(item.data.forwarded_from) }}
                        </div>
                        <div class="truncate">
                          {{ item.data.forwarded_from.body || (item.data.forwarded_from.files?.length ? `Файлов: ${item.data.forwarded_from.files.length}` : '') }}
                        </div>
                      </div>

                      <div class="whitespace-pre-wrap break-words leading-snug">{{ item.data.body || "" }}</div>

                      <div v-if="Array.isArray(item.data.files) && item.data.files.length" class="mt-2 space-y-1">
                        <div v-for="f in item.data.files" :key="f.path" class="flex items-center gap-2">
                          <button
                            v-if="isImageFile(f)"
                            type="button"
                            @click="openImageModal(f)"
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

                      <div class="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                        <span v-if="item.data.is_edited" class="text-gray-400 italic">(изменено)</span>
                        <span>{{ messageTime(item.data) }}</span>
                        <span v-if="isMyMessage(item.data)" class="text-sky-700">{{ messageTicks(item.data) }}</span>
                      </div>

                      <!-- Message actions menu button (only for own messages) -->
                      <div v-if="isMyMessage(item.data)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs"
                          @click.stop="showMessageMenu($event, item.data)"
                        >
                          <i class="fas fa-ellipsis-v"></i>
                        </button>
                      </div>
                    </div>
                    
                    <!-- Avatar for group/general chats - BELOW message (only for last message in sequence) -->
                    <div
                      v-if="shouldShowAvatar(item, index, messagesWithDates)"
                      class="shrink-0 mb-0.5 cursor-default" :title="getMessageUserName(item.data)"
                    >
                      <div class="relative">
                        <img
                          v-if="getMessageUser(item.data)?.photo"
                          :src="userPhotoUrl(getMessageUser(item.data).photo)"
                          class="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                          :alt="getMessageUserName(item.data)"
                        />
                        <div
                          v-else
                          class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-white shadow-sm"
                          :class="isMyMessage(item.data) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'"
                        >
                          {{ getMessageUserInitials(item.data) }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="w-full rounded-xl px-3 py-2"></div>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- Composer -->
      <div class="p-3 bg-white border-t border-gray-200">
        <!-- Reply preview -->
        <div v-if="replyingTo" class="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-gray-700 mb-1">
              Ответ на сообщение от {{ getMessageUserName(replyingTo) }}
            </div>
            <div class="text-xs text-gray-600 truncate">
              {{ replyingTo.body || (replyingTo.files?.length ? `Файлов: ${replyingTo.files.length}` : '') }}
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 shrink-0"
            @click="replyingTo = null"
          >
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>

        <div class="flex items-end gap-2">
          <input ref="fileInput" type="file" class="hidden" multiple accept="*/*" @change="onFilesSelected" />
          <input ref="audioInput" type="file" class="hidden" accept="audio/*" @change="onAudioSelected" />

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              :disabled="!selectedChat || !canWrite"
              @click="$refs.fileInput?.click()"
              title="Прикрепить файл"
            >
              <i class="fas fa-paperclip text-sm"></i>
            </button>
            <button
              type="button"
              class="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              :disabled="!selectedChat || !canWrite"
              @click="toggleAudioRecording"
              :title="isRecordingAudio ? 'Остановить запись' : 'Записать аудио'"
              :class="isRecordingAudio ? 'bg-red-500 text-white hover:bg-red-600' : ''"
            >
              <i class="fas fa-microphone text-sm"></i>
            </button>
          </div>

          <div class="flex-1 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300">
            <textarea
              ref="composerTextarea"
              v-model="draft"
              class="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 min-h-[40px] max-h-32"
              :placeholder="editingMessage ? 'Редактирование сообщения...' : '***************** Нажмите Enter для отправки *****************'"
              :disabled="!selectedChat || !canWrite"
              @keydown.enter.exact.prevent="handleEnterKey"
              @keydown.enter.shift.exact="handleShiftEnter"
              @keydown.esc.exact="cancelEdit"
            ></textarea>
            <div v-if="editingMessage" class="mt-2 flex items-center justify-between text-xs">
              <span class="text-gray-600">Редактирование сообщения</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-gray-600 hover:text-gray-800"
                  @click="cancelEdit"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  class="text-sky-600 hover:text-sky-800 font-medium"
                  @click="saveEdit"
                >
                  Сохранить
                </button>
              </div>
            </div>
            <div v-if="selectedFiles.length" class="mt-2 text-xs text-gray-600">
              <div class="font-medium text-gray-700">Файлы:</div>
              <ul class="list-disc ml-4">
                <li v-for="f in selectedFiles" :key="f.name">{{ f.name }}</li>
              </ul>
            </div>
            <div v-if="isRecordingAudio" class="mt-2 text-xs text-red-600 font-medium">
              <i class="fas fa-circle animate-pulse"></i> Запись аудио... {{ audioRecordingTime }}с
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              v-if="!editingMessage"
              class="w-9 h-9 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
              :disabled="!selectedChat || !canWrite || sending || (!draft.trim() && selectedFiles.length === 0 && !audioBlob)"
              type="button"
              @click="send"
              title="Отправить"
            >
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
            <button
              v-else
              class="w-9 h-9 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
              :disabled="!selectedChat || !canWrite || sending || !draft.trim()"
              type="button"
              @click="saveEdit"
              title="Сохранить изменения"
            >
              <i class="fas fa-check text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Delete Chat Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Удалить групповой чат?</h3>
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
          <h3 class="text-lg font-semibold text-gray-900">Создать групповой чат</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
            @click="closeCreateGroupModal"
          >
            <i class="fas fa-times text-sm"></i>
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
            />
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
                  />
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
                  <div v-if="user.position" class="text-xs text-gray-500 truncate">
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
                  ></i>
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
      class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
      :style="{ left: messageMenuX + 'px', top: messageMenuY + 'px' }"
      @click.stop
    >
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        @click="replyToMessage(messageMenuTarget)"
      >
        <i class="fas fa-reply text-xs"></i>
        Ответить
      </button>
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        @click="editMessage(messageMenuTarget)"
      >
        <i class="fas fa-edit text-xs"></i>
        Редактировать
      </button>
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        @click="forwardMessage(messageMenuTarget)"
      >
        <i class="fas fa-share text-xs"></i>
        Переслать
      </button>
      <div class="border-t border-gray-200 my-1"></div>
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        @click="deleteMessage(messageMenuTarget)"
      >
        <i class="fas fa-trash text-xs"></i>
        Удалить
      </button>
    </div>

    <!-- Forward Message Modal -->
    <div
      v-if="showForwardModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showForwardModal = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Переслать сообщение</h3>
        </div>
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <div class="space-y-2">
            <button
              v-for="chat in allChatsList.filter(c => c.id !== selectedChatId)"
              :key="`${chat.type}-${chat.id}`"
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 rounded-lg"
              @click="confirmForward(chat.id)"
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
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            @click="showForwardModal = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>

    <!-- Click outside to close menu -->
    <div
      v-if="messageMenuVisible"
      class="fixed inset-0 z-40"
      @click="closeMessageMenu"
    ></div>

    <!-- Image Viewer Modal -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      @click.self="closeImageModal"
    >
      <div class="relative max-w-4xl max-h-screen p-4">
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center z-10"
          @click="closeImageModal"
        >
          <i class="fas fa-times text-lg"></i>
        </button>

        <!-- Image -->
        <img
          v-if="selectedImage"
          :src="fileUrl(selectedImage.path)"
          :alt="selectedImage.name"
          class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </div>

  </div>
</template>

<script>
import ChatController from "@/api/ChatController";
import echo from "@/services/echo";
import { applySentMessage, handleChatReadEvent, handleIncomingChatEvent } from "@/services/messengerFacade";
import globalChatRealtime from "@/services/globalChatRealtime";
import { eventBus } from "@/eventBus";

// ===== Helpers (pure functions) =====
const buildStorageUrl = (path) => `${import.meta.env.VITE_APP_BASE_URL}/storage/${path}`;

const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const extractHHmm = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  // ISO вида 2025-12-27T09:17:28.000000Z -> берём HH:mm после 'T'
  if (s.includes("T")) {
    const timePart = (s.split("T")[1] || "").trim();
    const hhmm = timePart.slice(0, 5);
    if (/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  }
  // Формат "YYYY-MM-DD HH:mm:ss" или похожий -> ищем первую HH:mm
  const match = s.match(/(\d{2}:\d{2})/);
  return match ? match[1] : s;
};

// formatDayLabel will be a method that uses i18n

// formatChatTime will be a method that uses i18n

export default {
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

      draft: "",
      selectedFiles: [],
      sending: false,
      replyingTo: null,
      editingMessage: null,
      audioBlob: null,
      isRecordingAudio: false,
      audioRecordingTime: 0,
      audioRecordingInterval: null,
      mediaRecorder: null,

      onlineUserIds: [], // Массив для реактивности Vue
      peerReadByChatId: {},
      
      // Group chat creation modal
      showCreateGroupModal: false,
      groupTitle: "",
      selectedUserIds: [],
      creatingGroup: false,
      
      // Delete chat confirmation
      showDeleteConfirm: false,
      deletingChat: false,

      // Message menu
      messageMenuVisible: false,
      messageMenuX: 0,
      messageMenuY: 0,
      messageMenuTarget: null,

      // Forward message modal
      showForwardModal: false,
      forwardingMessage: null,

      // Image viewer modal
      showImageModal: false,
      selectedImage: null,
      
    };
  },
  computed: {
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
                chat_id: chat.id, // preserve chat id (because ...user overrides id)
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
      
      // Sort by last_message_at
      return list.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
    },
    messagesWithDates() {
      if (!this.messages || this.messages.length === 0) return [];
      
      const grouped = [];
      let currentDate = null;
      
      this.messages.forEach((message) => {
        const messageDate = this.parseDate(message.created_at || message.createdAt);
        if (!messageDate) {
          // Если дату не удалось распарсить, просто добавляем сообщение
          grouped.push({ type: 'message', data: message });
          return;
        }
        
        const messageDay = new Date(messageDate);
        messageDay.setHours(0, 0, 0, 0);
        
        // Если дата изменилась, добавляем разделитель
        if (!currentDate || currentDate.getTime() !== messageDay.getTime()) {
          currentDate = messageDay;
          grouped.push({ 
            type: 'date', 
            data: this.formatDayLabel(messageDay),
            date: messageDay
          });
        }
        
        grouped.push({ type: 'message', data: message });
      });
      
      return grouped;
    },
    presenceStatusText() {
      if (!this.selectedChat) return "Выберите сотрудника или общий чат слева";
      if (this.selectedChat.type === "direct" && this.activePeerUser) {
        return this.isUserOnline(this.activePeerUser) ? "Онлайн" : "Оффлайн";
      }
      return "Онлайн";
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
  async mounted() {
    try {
      // Используем глобальный сервис вместо локального
      await this.ensureUsersLoaded();
      await this.loadChats();
      
      // НЕ синхронизируем чаты здесь - глобальный сервис уже подписан на все чаты при инициализации
      // Синхронизация нужна только при создании нового чата
      
      // Получаем список онлайн пользователей из глобального сервиса
      this.onlineUserIds = globalChatRealtime.getOnlineUserIds();
      
      // Подписываемся на события через eventBus
      this.setupEventListeners();
      
      // Проверяем статус подключения через небольшую задержку
      setTimeout(() => {
        this.checkWebSocketStatus();
      }, 2000);
    } catch (error) {
      console.error("[Messenger] Ошибка при инициализации:", error);
      this.$store.dispatch("showNotification", {
        title: "Ошибка загрузки мессенджера",
        subtitle: error?.message || "Попробуйте обновить страницу",
        isDanger: true,
        duration: 5000,
      });
    }
  },
  beforeUnmount() {
    // Отписываемся от событий
    this.removeEventListeners();
    this.onlineUserIds = [];
  },
  methods: {
    setupEventListeners() {
      // Подписываемся на события чатов через eventBus
      eventBus.on("chat:message", this.handleIncomingMessage);
      eventBus.on("chat:read", this.handleReadEvent);
      eventBus.on("presence:here", this.handlePresenceHere);
      eventBus.on("presence:joining", this.handlePresenceJoining);
      eventBus.on("presence:leaving", this.handlePresenceLeaving);
    },
    removeEventListeners() {
      // Отписываемся от событий
      eventBus.off("chat:message", this.handleIncomingMessage);
      eventBus.off("chat:read", this.handleReadEvent);
      eventBus.off("presence:here", this.handlePresenceHere);
      eventBus.off("presence:joining", this.handlePresenceJoining);
      eventBus.off("presence:leaving", this.handlePresenceLeaving);
    },
    handleIncomingMessage(event) {
      handleIncomingChatEvent(this, event);
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
      if (!status) {
        console.log('[WebSocket] GlobalChatRealtime не инициализирован');
        return null;
      }

      console.log('[WebSocket] Статус подключений:', status);
      
      // Проверяем, что все подключено
      const allGood = status.echoConnected && 
                      status.presenceSubscribed && 
                      Object.values(status.chatChannels).every(ch => ch.subscribed);
      
      if (!allGood) {
        console.warn('[WebSocket] ⚠️ Не все каналы подписаны:', status);
      }
      
      return status;
    },
    syncRealtime() {
      // Синхронизируем чаты с глобальным сервисом
      // Вызывается только при создании нового чата, так как глобальный сервис уже подписан на все чаты
      const chatsForSync = [...(this.chats || []), this.generalChat].filter((c) => c && c.id);
      globalChatRealtime.syncChats(chatsForSync);
    },
    async ensureUsersLoaded() {
      // Для мессенджера всегда загружаем пользователей, чтобы получить актуальный список
      // Очищаем state перед загрузкой, чтобы гарантировать свежие данные
      try {
        // Очищаем пользователей в state, чтобы принудительно загрузить заново
        this.$store.commit("SET_USERS", []);
        
        // Загружаем пользователей
        await this.$store.dispatch("loadUsers");
        
        // Отладка: проверим сколько пользователей загружено
        const allUsers = this.$store.state.users || [];
        const companyUsers = this.usersForCompany || [];
        
        // Дополнительная отладка: проверим структуру компаний у пользователей
        if (import.meta.env.DEV) {
          allUsers.forEach(u => {
            if (!u.companies || u.companies.length === 0) {
              console.warn(`[Messenger] Пользователь ${u.name} ${u.surname} не имеет компаний`);
            }
          });
        }
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

        // Initialize peer read state for direct chats (non-breaking extra fields from backend)
        const peerMap = {};
        (this.chats || []).forEach((c) => {
          if (c && c.type === "direct" && c.id) {
            const peerId = Number(c.peer_last_read_message_id || 0);
            if (peerId) peerMap[Number(c.id)] = peerId;
          }
        });
        this.peerReadByChatId = { ...this.peerReadByChatId, ...peerMap };

        // НЕ синхронизируем здесь - глобальный сервис уже подписан на все чаты при инициализации
        // Синхронизация нужна только при создании нового чата
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
        
        // Отладка для групповых чатов
        if (import.meta.env.DEV && (chat.type === 'group' || foundChat?.type === 'group')) {
          console.log('[Messenger] Selecting group chat:', {
            originalChat: chat,
            foundChat: foundChat,
            fullChat: fullChat,
            isCreator: this.isChatCreator(fullChat)
          });
        }
      }
      
      this.selectedChat = fullChat;
      this.selectedChatId = fullChat.id;
      this.messages = [];
      
      // Очищаем activePeerUser для не-direct чатов
      if (fullChat.type !== 'direct') {
        this.activePeerUser = null;
      }
      
      // Сбрасываем unread_count для открытого чата
      if (fullChat) {
        this.chats = (this.chats || []).map((c) => {
          if (c && Number(c.id) === Number(fullChat.id)) {
            return { ...c, unread_count: 0 };
          }
          return c;
        });
        
        if (this.generalChat && Number(this.generalChat.id) === Number(fullChat.id)) {
          this.generalChat = { ...this.generalChat, unread_count: 0 };
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
        
        // Финальная прокрутка после всех операций
        await this.$nextTick();
        setTimeout(() => {
          this.scrollToBottom();
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
      const chatId = Number(m?.chat_id || m?.chatId || this.selectedChatId);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || 0);
      const msgId = Number(m?.id || 0);
      if (!chatId || !msgId) return "✓";
      return peerReadId >= msgId ? "✓✓" : "✓";
    },

    chatLastTicks(item) {
      // Left list: show ✓/✓✓ only if last message is mine and chat is direct
      const msg = item?.last_message;
      if (!msg || !this.isMyMessageInChat(item)) return "";
      const chatId = Number(item?.chat_id || msg?.chat_id || item?.id);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || item?.peer_last_read_message_id || 0);
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
        this.messages = [];
      };
      open();
    },
    async loadMessages(chatId) {
      this.loadingMessages = true;
      try {
        const items = await ChatController.getMessages(chatId);
        this.messages = Array.isArray(items) ? items : [];
        
        // Ждем завершения загрузки и обновления DOM
        await this.$nextTick();
        this.loadingMessages = false;
        
        // Прокручиваем после того, как loadingMessages стал false
        await this.$nextTick();
        this.scrollToBottom();
      } catch (e) {
        this.messages = [];
        this.loadingMessages = false;
        this.$store.dispatch("showNotification", {
          title: "Не удалось загрузить сообщения",
          subtitle: e?.message || "",
          isDanger: true,
          duration: 3000,
        });
      }
    },

    // subscribeToChat/unsubscribeFromChat moved to src/services/chatRealtime.js (we keep all-chats subscriptions synced)
    scrollToBottom() {
      const el = this.$refs.messagesWrap;
      if (!el) return;
      
      const scroll = () => {
        if (el.scrollHeight !== undefined) el.scrollTop = el.scrollHeight;
      };

      // Несколько попыток (DOM/изображения/рефлоу)
      [0, 100, 300].forEach((ms) => setTimeout(scroll, ms));
    },
    isMyMessage(m) {
      const myId = this.$store.state.user?.id;
      const userId = m.user_id || m.userId || m.user?.id;
      return myId && userId && Number(myId) === Number(userId);
    },
    messageTime(m) {
      const raw = m.created_at || m.createdAt || null;
      return extractHHmm(raw);
    },
    userPhotoUrl(path) {
      return buildStorageUrl(path);
    },
    fileUrl(path) {
      return buildStorageUrl(path);
    },
    onFilesSelected(e) {
      const files = Array.from(e.target.files || []);
      this.selectedFiles = files;
      e.target.value = ''; // Reset input
    },
    onAudioSelected(e) {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        this.selectedFiles = [...this.selectedFiles, ...files];
      }
      e.target.value = ''; // Reset input
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([this.audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          this.selectedFiles = [...this.selectedFiles, audioFile];
          this.audioBlob = null;
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
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
      if (this.mediaRecorder && this.isRecordingAudio) {
        this.mediaRecorder.stop();
        this.isRecordingAudio = false;
        if (this.audioRecordingInterval) {
          clearInterval(this.audioRecordingInterval);
          this.audioRecordingInterval = null;
        }
      }
    },
    isImageFile(file) {
      const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      return imageTypes.includes(file.mime_type) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name || '');
    },
    isAudioFile(file) {
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'];
      return audioTypes.includes(file.mime_type) || /\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name || '');
    },
    async send() {
      if (!this.selectedChatId) return;
      if (!this.canWrite) return;
      if (!this.draft.trim() && this.selectedFiles.length === 0) return;

      this.sending = true;
      try {
        const msg = await ChatController.sendMessage(this.selectedChatId, {
          body: this.draft,
          files: this.selectedFiles,
          parent_id: this.replyingTo?.id || null,
        });

        if (msg) {
          this.draft = "";
          this.selectedFiles = [];
          this.replyingTo = null;
          this.audioBlob = null;
          // моментально обновим метаданные чата для отправителя
          applySentMessage(this, msg);
        } else {
          await this.loadMessages(this.selectedChatId);
        }
      } finally {
        this.sending = false;
      }
    },
    showMessageMenu(event, message) {
      if (!this.isMyMessage(message)) return;
      this.messageMenuTarget = message;
      this.messageMenuX = event.clientX;
      this.messageMenuY = event.clientY;
      this.messageMenuVisible = true;
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
      this.draft = message.body || '';
      this.closeMessageMenu();
    },
    cancelEdit() {
      this.editingMessage = null;
      this.draft = '';
    },
    async saveEdit() {
      if (!this.editingMessage || !this.draft.trim()) return;
      
      try {
        await ChatController.updateMessage(this.selectedChatId, this.editingMessage.id, this.draft);
        // Reload messages to get updated version
        await this.loadMessages(this.selectedChatId);
        this.editingMessage = null;
        this.draft = '';
      } catch (error) {
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось отредактировать сообщение",
          isDanger: true,
          duration: 3000,
        });
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
      this.showForwardModal = true;
      this.closeMessageMenu();
    },
    async confirmForward(targetChatId) {
      if (!this.forwardingMessage) return;
      
      try {
        await ChatController.forwardMessage(this.selectedChatId, this.forwardingMessage.id, targetChatId);
        this.showForwardModal = false;
        this.forwardingMessage = null;
        this.$store.dispatch("showNotification", {
          title: "Успешно",
          subtitle: "Сообщение переслано",
          isDanger: false,
          duration: 2000,
        });
      } catch (error) {
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось переслать сообщение",
          isDanger: true,
          duration: 3000,
        });
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
          this.syncRealtime();
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
      if (item.last_message?.body) {
        return item.last_message.body;
      }
      if (item.type === 'user') {
        return item.position || "Сотрудник";
      }
      return "";
    },
    formatChatTime(item) {
      const raw = item.last_message_at || item.last_message?.created_at;
      if (!raw) return "";
      
      const date = this.parseDate(raw);
      if (!date) return extractHHmm(raw);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
      
      const userId = message.user_id || message.userId || message.user?.id;
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
        // Fallback: если пользователь не найден, показываем user_id
        const userId = message.user_id || message.userId || message.user?.id;
        return userId ? `Пользователь #${userId}` : "Неизвестный";
      }
      const name = user.name || "";
      const surname = user.surname || "";
      return `${name} ${surname}`.trim() || user.displayTitle || "Пользователь";
    },
    getMessageUserInitials(message) {
      const user = this.getMessageUser(message);
      if (!user) {
        const userId = message.user_id || message.userId || message.user?.id;
        return userId ? String(userId).charAt(0) : "?";
      }
      return this.getUserInitials(user);
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
      const currentUserId = item.data?.user_id || item.data?.userId || item.data?.user?.id;
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
        const nextUserId = nextItem.data?.user_id || nextItem.data?.userId || nextItem.data?.user?.id;
        
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
      if (!chat || chat.type !== 'direct' || !chat.direct_key) return null;
      const myId = this.$store.state.user?.id;
      if (!myId) return null;
      
      const parts = String(chat.direct_key).split(":").map(x => parseInt(x, 10)).filter(x => !isNaN(x));
      if (parts.length !== 2) return null;
      
      const [a, b] = parts;
      return Number(a) === Number(myId) ? b : a;
    },
    isMyMessageInChat(item) {
      if (!item.last_message) return false;
      const myId = this.$store.state.user?.id;
      return myId && Number(item.last_message.user_id) === Number(myId);
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
          user_ids: this.selectedUserIds,
        });
        
        if (chat) {
          // Добавляем чат в список если его там нет
          const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
          if (!exists) {
            this.chats = [...(this.chats || []), chat];
            this.syncRealtime();
          }
          
          // Закрываем модальное окно
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
      const createdBy = fullChat.created_by;
      if (!createdBy) {
        // Отладка: выводим информацию о чате
        if (import.meta.env.DEV) {
          console.log('[Messenger] Chat data for creator check:', {
            chatId: chat.id,
            chatType: fullChat.type,
            createdBy: createdBy,
            myId: myId,
            fullChat: fullChat
          });
        }
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
        
        // Закрываем чат
        this.selectedChat = null;
        this.selectedChatId = null;
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
.messenger-bg {
  background-color: #cfe2f6;
  /* лёгкий "битрикс-паттерн" без ассетов */
  background-image:
    radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.35) 0 2px, transparent 3px),
    radial-gradient(circle at 80px 60px, rgba(255, 255, 255, 0.25) 0 2px, transparent 3px),
    radial-gradient(circle at 120px 30px, rgba(255, 255, 255, 0.25) 0 2px, transparent 3px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  background-size: 140px 100px, 180px 120px, 200px 120px, 100% 100%;
  background-repeat: repeat, repeat, repeat, no-repeat;
}
</style>


