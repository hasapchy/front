<template>
    <div class="h-full flex flex-col items-center justify-center p-8">
        <div class="text-center max-w-2xl">
            <h1 class="text-3xl font-bold mb-6">{{ $t('home') || 'Главная страница' }}</h1>
            
            <!-- Ссылка на новости -->
            <router-link 
                to="/news" 
                class="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors duration-200 text-lg font-semibold">
                <i class="fas fa-newspaper text-2xl"></i>
                <span>{{ $t('news') || 'Новости' }}</span>
                <i class="fas fa-arrow-right"></i>
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    }
}

</script>