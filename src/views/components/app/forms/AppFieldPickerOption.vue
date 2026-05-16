<template>
  <li
    class="app-field-picker__option"
    :class="{
      'pointer-events-none opacity-40': disabled,
      'app-field-picker__option--stacked': stacked,
    }"
    @mousedown.prevent="!disabled && $emit('select')"
  >
    <div class="app-field-picker__option-row">
      <div
        class="app-field-picker__option-leading"
        :class="{ 'app-field-picker__option-leading--stacked': stacked }"
      >
        <slot name="leading" />
        <span
          v-if="primary"
          class="app-field-picker__option-primary"
        >{{ primary }}</span>
        <slot />
      </div>
      <span
        v-if="meta"
        class="app-field-picker__option-meta"
        :class="{
          'app-field-picker__option-meta--accent': metaAccent,
          'app-field-picker__option-meta--badge': metaBadge,
        }"
        :style="metaBadge ? metaStyle : undefined"
      >{{ meta }}</span>
    </div>
  </li>
</template>

<script>
export default {
    name: 'AppFieldPickerOption',
    props: {
        primary: { type: String, default: '' },
        meta: { type: String, default: '' },
        metaAccent: { type: Boolean, default: false },
        metaBadge: { type: Boolean, default: false },
        metaStyle: { type: Object, default: () => ({}) },
        disabled: { type: Boolean, default: false },
        stacked: { type: Boolean, default: false },
    },
    emits: ['select'],
};
</script>
