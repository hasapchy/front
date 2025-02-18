<template>
    this is the home page
</template>

<script>
export default {
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    }
}

</script>