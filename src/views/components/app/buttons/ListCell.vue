<template>
    <ul v-if="items.length > 0">
        <li v-for="(item, index) in items" :key="index">{{ getValue(item) }}</li>
    </ul>
    <span v-else>-</span>
</template>

<script>
export default {
    name: 'ListCell',
    props: {
        items: {
            type: Array,
            default: () => []
        },
        getValue: {
            type: Function,
            required: true
        }
    }
}
</script>

