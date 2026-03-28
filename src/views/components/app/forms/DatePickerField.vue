<template>
  <div
    ref="wrapperRef"
    class="relative"
  >
    <input
      type="text"
      :value="displayText"
      readonly
      class="w-full rounded cursor-pointer pr-8 bg-white"
      :class="inputClass"
      :placeholder="placeholder"
      :disabled="isFieldDisabled"
      @click.stop="openPicker"
    >
    <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
      <i class="fas fa-calendar text-gray-400" />
    </div>
    <div
      v-if="showPicker"
      ref="pickerRef"
      class="absolute z-50 mt-2"
      style="left: 0; top: 100%;"
    >
      <DatePicker
        :model-value="modelValue"
        :type="type"
        :editing-item-id="editingItemId"
        :restrict-to-now="restrictToNow"
        :clearable="clearable"
        :work-schedule="workSchedule"
        @update:model-value="onPickerInput"
        @apply="showPicker = false"
        @clear="onClear"
      />
    </div>
  </div>
</template>

<script>
import DatePicker from '@/views/components/app/forms/DatePicker.vue';
import { dateFormMixin, formatDatePickerDisplay } from '@/utils/dateUtils';

export default {
    name: 'DatePickerField',
    components: { DatePicker },
    mixins: [dateFormMixin],
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'datetime',
            validator: (v) => ['date', 'datetime'].includes(v)
        },
        editingItemId: {
            type: [Number, String],
            default: null
        },
        restrictToNow: {
            type: Boolean,
            default: true
        },
        clearable: {
            type: Boolean,
            default: false
        },
        workSchedule: {
            type: Object,
            default: null
        },
        inputClass: {
            type: [String, Object, Array],
            default: ''
        },
        placeholder: {
            type: String,
            default: ''
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            showPicker: false
        };
    },
    computed: {
        isFieldDisabled() {
            return !!this.editingItemId && !this.canEditDate();
        },
        displayText() {
            return formatDatePickerDisplay(this.modelValue, this.type);
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        openPicker() {
            if (this.isFieldDisabled) return;
            this.showPicker = true;
        },
        onPickerInput(val) {
            this.$emit('update:modelValue', val );
        },
        onClear() {
            this.$emit('update:modelValue', '');
            this.showPicker = false;
        },
        handleClickOutside(e) {
            if (!this.showPicker) return;
            const w = this.$refs.wrapperRef;
            const p = this.$refs.pickerRef;
            if (w && p && !w.contains(e.target) && !p.contains(e.target)) {
                this.showPicker = false;
            }
        }
    }
};
</script>
