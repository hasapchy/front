<template>
    <div class="relative">
        <input v-model="searchQuery" type="text" :placeholder="$t('searchPlaceholder')"
            :title="$t('searchFieldsHint')"
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#337AB7]" />
        <i v-if="searchQuery"
            class="fas fa-times absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
            @click="clearSearch"></i>
        <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
    </div>
</template>

<script>
import { mapActions } from 'vuex';
import { eventBus } from '@/eventBus';

export default {
    computed: {
        searchQuery: {
            get() {
                return this.$store.state.searchQuery;
            },
            set(value) {
                this.setSearchQuery(value);
            }
        }
    },
    watch: {
        searchQuery: {
            handler(newValue) {
                this.debouncedSearch(newValue);
            },
            immediate: false
        }
    },
    data() {
        return {
            searchTimeout: null
        };
    },
    methods: {
        ...mapActions({
            setSearchQuery: 'setSearchQuery'
        }),
        clearSearch() {
            this.searchQuery = '';
        },
        debouncedSearch(query) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 500);
        },
        performSearch(query) {
            this.$emit('search', query);
            
            eventBus.emit('global-search', query);
        }
    },
    beforeUnmount() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
};
</script>
