<template>
  <i
    :class="iconClass"
    :title="title"
  />
</template>

<script>
export default {
    name: 'StatusIconCell',
    props: {
        status: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        iconClass() {
            return this.status
                ? 'fas fa-circle-check text-[var(--color-success)]'
                : 'fas fa-times text-[var(--color-danger-hover)]';
        },
        title() {
            return this.status ? 'Активен' : 'Неактивен';
        }
    }
}
</script>

