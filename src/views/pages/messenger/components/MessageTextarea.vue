<template>
    <div>
      <textarea
        ref="textarea"
        :value="draft"
        class="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 min-h-[40px] max-h-32"
        :placeholder="editingMessage ? 'Редактирование сообщения...' : '***************** Нажмите Enter для отправки *****************'"
        :disabled="disabled"
        @input="$emit('update:draft', $event.target.value)"
        @keydown.enter.exact.prevent="handleEnterKey"
        @keydown.enter.shift.exact="handleShiftEnter"
        @keydown.esc.exact="$emit('cancel-edit')"
      ></textarea>
      
      <div v-if="editingMessage" class="mt-2 flex items-center justify-between text-xs">
        <span class="text-gray-600">Редактирование сообщения</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-gray-600 hover:text-gray-800"
            @click="$emit('cancel-edit')"
          >
            Отмена
          </button>
          <button
            type="button"
            class="text-sky-600 hover:text-sky-800 font-medium"
            @click="$emit('save-edit')"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MessageTextarea',
    props: {
      draft: {
        type: String,
        default: ''
      },
      editingMessage: {
        type: [Object, Boolean],
        default: null
      },
      disabled: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      handleEnterKey() {
        if (this.editingMessage) {
          this.$emit('save-edit')
        } else {
          this.$emit('send')
        }
      },
      handleShiftEnter() {
        // Shift+Enter добавляет новую строку - ничего не делаем
      },
      focus() {
        this.$refs.textarea?.focus()
      }
    },
    mounted() {
      this.focus()
    }
  }
  </script>