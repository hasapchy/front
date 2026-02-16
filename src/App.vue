<template>
    <div class="h-full">
        <router-view />
    </div>
</template>

<script>
export default {
    data() {
        return {
            loading: true
        };
    },
    async created() {
        try {
            await this.$store.dispatch('initializeApp');
        } catch (error) {
            this.$router.push('/auth/login');
        } finally {
            this.loading = false;
        }
    }
};
</script>