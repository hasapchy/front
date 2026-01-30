<template>
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Удалить групповой чат?</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600">
            Вы уверены, что хотите удалить чат "{{ chat?.title }}"? 
            Это действие нельзя отменить. Все сообщения и участники будут удалены.
          </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            :disabled="deleting"
            @click="$emit('close')"
          >
            Отмена
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="deleting"
            @click="$emit('confirm')"
          >
            <span v-if="deleting">Удаление...</span>
            <span v-else>Удалить</span>
          </button>
        </div>
      </div>
    </div>
</template>
  
<script>
    export default {
        name: 'DeleteConfirmModal',
        props: {
            chat: {
            type: Object,
            default: null
            },
            deleting: {
            type: Boolean,
            default: false
            }
        }
    }
</script>