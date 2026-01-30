<template>
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Создать групповой чат</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
            @click="$emit('close')"
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
              :value="groupTitle"
              type="text"
              class="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              placeholder="Введите название группы"
              maxlength="255"
              @input="$emit('update:group-title', $event.target.value)"
            />
          </div>
  
          <!-- Users selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Участники ({{ selectedUserIds.length }} выбрано)
            </label>
            <div class="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                class="px-3 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                @click="$emit('toggle-user-selection', user.id)"
              >
                <div class="relative shrink-0">
                   <div v-if="user.photo" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                        <img
                            :src="userPhotoUrl(user.photo)"
                            alt="user"
                            class="w-full h-full object-cover"
                        />
                    </div>
                    <div
                        v-else
                        class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold bg-green-100 text-green-700 px-1 truncate"
                        :title="(user.name || '').trim() || undefined"
                        >
                        {{ (user.name || '').trim() || '?' }}
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
            @click="$emit('close')"
          >
            Отмена
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canCreateGroup"
            @click="$emit('create')"
          >
            <span v-if="creatingGroup">Создание...</span>
            <span v-else>Создать</span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl } from '../utils/helpers'
  
  export default {
    name: 'CreateGroupModal',
    props: {
      users: {
        type: Array,
        default: () => []
      },
      groupTitle: {
        type: String,
        default: ''
      },
      selectedUserIds: {
        type: Array,
        default: () => []
      },
      creatingGroup: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      filteredUsers() {
        const currentUserId = this.$store.state.user?.id
        return this.users.filter(u => u && u.id !== currentUserId)
      },
      canCreateGroup() {
        return (
          !this.creatingGroup &&
          this.groupTitle.trim().length > 0 &&
          this.selectedUserIds.length > 0
        )
      }
    },
    methods: {
      userPhotoUrl(path) {
        return buildStorageUrl(path)
      }
    }
  }
  </script>