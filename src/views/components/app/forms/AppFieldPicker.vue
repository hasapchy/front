<template>
  <div class="app-field-picker">
    <template v-if="multiple">
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >{{ label }}</label>
      <slot name="multiple" />
    </template>

    <template v-else-if="inlineSelected">
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >{{ label }}</label>
      <div class="relative">
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="app-field-picker__search-input min-w-0 flex-1"
            :value="inlineInputDisplay"
            :placeholder="placeholder"
            :disabled="disabled"
            @input="onInlineSearchInput"
            @focus="$emit('focus')"
            @blur="$emit('blur')"
          >
          <button
            v-if="hasSelection && allowDeselect"
            type="button"
            class="app-field-picker__deselect shrink-0"
            :disabled="disabled"
            @click="$emit('deselect')"
          >
            ×
          </button>
        </div>
        <transition name="appear">
          <ul
            v-show="dropdownOpen"
            class="app-field-picker__dropdown"
          >
            <slot name="dropdown" />
          </ul>
        </transition>
      </div>
    </template>

    <template v-else-if="!hasSelection">
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >{{ label }}</label>
      <div class="relative">
        <slot
          v-if="searchable"
          name="search"
        >
          <input
            :value="searchValue"
            type="text"
            class="app-field-picker__search-input"
            :placeholder="placeholder"
            :disabled="disabled"
            @input="$emit('update:searchValue', $event.target.value)"
            @focus="$emit('focus')"
            @blur="$emit('blur')"
          >
        </slot>
        <div
          v-else
          class="app-field-picker__select-trigger"
        >
          <slot name="trigger" />
        </div>
        <transition name="appear">
          <ul
            v-show="dropdownOpen"
            class="app-field-picker__dropdown"
          >
            <slot name="dropdown" />
          </ul>
        </transition>
      </div>
    </template>

    <template v-else>
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >{{ label }}</label>
      <div class="app-field-picker__selected">
        <div class="app-field-picker__selected-inner">
          <div class="app-field-picker__selected-body">
            <slot name="selected" />
          </div>
          <button
            v-if="allowDeselect"
            type="button"
            class="app-field-picker__deselect"
            :disabled="disabled"
            @click="$emit('deselect')"
          >
            ×
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
    name: 'AppFieldPicker',
    props: {
        hasSelection: { type: Boolean, default: false },
        searchable: { type: Boolean, default: true },
        multiple: { type: Boolean, default: false },
        inlineSelected: { type: Boolean, default: false },
        inlineSelectedValue: { type: String, default: '' },
        showLabel: { type: Boolean, default: true },
        label: { type: String, default: '' },
        required: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        allowDeselect: { type: Boolean, default: true },
        dropdownOpen: { type: Boolean, default: false },
        searchValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:searchValue', 'focus', 'blur', 'deselect'],
    computed: {
        inlineInputDisplay() {
            const query = typeof this.searchValue === 'string' ? this.searchValue : '';
            if (query.length > 0) {
                return query;
            }
            if (this.hasSelection) {
                return this.inlineSelectedValue;
            }
            return '';
        },
    },
    methods: {
        onInlineSearchInput(event) {
            this.$emit('update:searchValue', event.target.value);
        },
    },
};
</script>
