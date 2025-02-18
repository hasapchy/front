<template>
    this is the warehouses page
</template>

<script>
export default {
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    }
}
</script>