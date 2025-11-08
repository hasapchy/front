<template>
  <i class="fas fa-spinner fa-spin" :class="[sizeClass, additionalClass]"></i>
</template>

<script>
export default {
  name: 'SpinnerIcon',
  props: {
    sizeClass: {
      type: String,
      default: 'text-2xl'
    },
    additionalClass: {
      type: [String, Array, Object],
      default: null
    }
  }
};
</script>

