<template>
    <i :class="iconClass" :title="title"></i>
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
                ? 'fas fa-circle-check text-[#5CB85C]'
                : 'fas fa-times text-[#D53935]';
        },
        title() {
            return this.status ? 'Активен' : 'Неактивен';
        }
    }
}
</script>

