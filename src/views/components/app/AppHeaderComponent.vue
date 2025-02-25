<template>
    <div class="shadow-sm px-3 py-1.5 mb-5 bg-white rounded">
        <div class="container px-4">
            <div class="flex items-center justify-between">
                <div class="flex items-end gap-6">
                    <h1 class="text-xl font-semibold">{{ title }}</h1>
                    <!-- Табы -->
                    <div class="flex">
                        <router-link v-for="tab in binded" :key="tab.path" :to="tab.path" class="text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all mr-4">
                            {{ tab.name }}
                        </router-link>
                    </div>
                </div>

                <div class="flex items-center">
                    <span v-if="$store.state.user" class="font-semibold mr-5">{{ $store.state.user.name }}</span>
                    <PrimaryButton :icon="'fas fa-sign-out-alt'" :onclick="logout" isLight>
                        Выйти
                    </PrimaryButton>
                </div>
            </div>
        </div>
    </div>

</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UserController from '@/api/UserController';
import PrimaryButton from './buttons/PrimaryButton.vue';
export default {
    components: {
        PrimaryButton
    },
    data() {
        const route = useRoute();
        const title = computed(() => route.meta.title || 'Система учета');
        const binded = computed(() => route.meta.binded || []);
        return {
            title: title,
            binded: binded
        }
    },
    methods: {
        async logout() {
            await UserController.logout();
            this.$store.state.user = null;
            this.$router.push('/auth/login');
        }
    }
}
</script>