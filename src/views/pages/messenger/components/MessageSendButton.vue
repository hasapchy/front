<template>
    <div class="flex items-center gap-1">
      <button
        v-if="!editing"
        class="w-9 h-9 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
        :disabled="disabled"
        type="button"
        @click="$emit('send')"
        title="Отправить"
      >
        <i class="fas fa-paper-plane text-sm"></i>
      </button>
      <button
        v-else
        class="w-9 h-9 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
        :disabled="disabled"
        type="button"
        @click="$emit('save')"
        title="Сохранить изменения"
      >
        <i class="fas fa-check text-sm"></i>
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MessageSendButton',
    props: {
      editing: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      }
    }
  }
  </script>