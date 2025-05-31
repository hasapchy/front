<template>
    <div class="relative">
        <input v-model="searchQuery" type="text" placeholder="Поиск от 3 символов"
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#337AB7]" />
        <i v-if="searchQuery"
            class="fas fa-times absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            @click="clearSearch"></i>
        <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
    </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    setup() {
        const store = useStore();
        const searchQuery = computed({
            get: () => store.state.searchQuery,
            set: (value) => store.dispatch('setSearchQuery', value),
        });
        return { searchQuery };
    },
    methods: {
        clearSearch() {
            this.searchQuery = '';
        },
    },
};
</script>