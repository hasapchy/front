<template>
    <router-view />
</template>

<style scoped></style>

<script>
import UserController from '@/api/UserController';

export default {
    async created() {
        if (localStorage.getItem('token') !== null) {
            try {
                this.$store.state.user = await UserController.getUser();
            } catch {
                this.$store.state.user = null;
                this.$router.push('/auth/login');
            }
            this.loading = false;
        }
    }
};
</script>