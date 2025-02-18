<template>
    <div class="shadow-sm p-3 mb-5 bg-white rounded">
        <div class="container px-4">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-semibold">{{ title }}</h1>
                <div class="flex items-center">

                    <!-- <div class="mr-5">
                        <form action="{{ request()->url() }}" method="GET" class="flex items-center">
                            <div class="relative">
                                <input type="text" name="search" value="{{ request('search') }}" placeholder="Поиск..."
                                    class="border rounded px-2 pl-8">
                                <button type="submit" class="absolute left-0 top-0 mt-2 ml-2 text-gray-600">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </form>
                    </div> -->
                    <span v-if="$store.state.user" class="font-semibold mr-5">{{ $store.state.user.name }}</span>

                    <!-- <button type="button" @click="logout" class="ml-1 text-red-600 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1">
                            </path>
                        </svg>
                    </button> -->
                    <PrimaryButton :icon="'fas fa-sign-out-alt'" :onclick="logout" isLight>
                        Выйти
                    </PrimaryButton>
                    <!-- </form> -->
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
        return {
            title: title
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