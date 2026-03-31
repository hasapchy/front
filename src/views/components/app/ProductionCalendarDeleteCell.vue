<template>
  <button
    type="button"
    class="text-red-600 hover:underline text-xs bg-transparent border-0 p-0 cursor-pointer"
    style="font: inherit"
    :disabled="deleting"
    @click.stop="onDelete"
  >
    {{ $t('delete') }}
  </button>
</template>

<script>
export default {
    name: 'ProductionCalendarDeleteCell',
    props: {
        deleting: {
            type: Boolean,
            default: false,
        },
        onDelete: {
            type: Function,
            required: true,
        },
    },
};
</script>
