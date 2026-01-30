<template>
    <div
      class="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
      :style="{
        left: (isMyMessage ? (position.x - 160) : position.x) + 'px',
        top: position.y + 'px'
      }"
      @click.stop
    >
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        @click="handleReply"
      >
        <i class="fas fa-reply text-xs"></i>
        Ответить
      </button>
      <button
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        @click="handleForward"
      >
        <i class="fas fa-share text-xs"></i>
        Переслать
      </button>
  
      <!-- Edit and Delete options only for own messages -->
      <template v-if="isMyMessage">
        <div class="border-t border-gray-200 my-1"></div>
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          @click="handleEdit"
        >
          <i class="fas fa-edit text-xs"></i>
          Редактировать
        </button>
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          @click="handleDelete"
        >
          <i class="fas fa-trash text-xs"></i>
          Удалить
        </button>
      </template>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MessageContextMenu',
    props: {
      message: {
        type: Object,
        required: true
      },
      position: {
        type: Object,
        required: true,
        default: () => ({ x: 0, y: 0 })
      },
      isMyMessage: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      handleReply() {
        this.$emit('reply', this.message)
        this.$emit('close')
      },
      handleForward() {
        this.$emit('forward', this.message)
        this.$emit('close')
      },
      handleEdit() {
        this.$emit('edit', this.message)
        this.$emit('close')
      },
      handleDelete() {
        this.$emit('delete', this.message)
        this.$emit('close')
      }
    }
  }
  </script>