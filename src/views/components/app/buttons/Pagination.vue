<template>
    <div class="flex justify-between items-center">
        <!-- Per Page Selector -->
        <PerPageSelector 
            v-if="showPerPageSelector"
            :per-page="perPage"
            :per-page-options="perPageOptions"
            :storage-key="storageKey"
            @per-page-change="$emit('perPageChange', $event)"
        />
        
        <!-- Pagination Controls -->
        <nav class="ml-4">
            <ul class="flex items-center -space-x-px h-8 text-sm">
                <li>
                    <button type="button" :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1, 'cursor-pointer': currentPage !== 1 }"
                        :disabled="currentPage === 1" @click="$emit('changePage', currentPage - 1)"
                        class="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-black bg-gray-50 hover:bg-gray-300">
                        <span class="sr-only">Previous</span>
                        <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 1 1 5l4 4" />
                        </svg>
                    </button>
                </li>

                <template v-for="(item, index) in paginationItems" :key="index">
                    <li v-if="item.type === 'page'">
                        <button type="button" :disabled="currentPage === item.value" @click="$emit('changePage', item.value)"
                            :class="['flex items-center justify-center px-3 h-8 leading-tight transition-all bg-gray-50 hover:bg-[#4EA84E]', {'bg-green text-white': item.value === currentPage, 'cursor-pointer': currentPage !== item.value, 'cursor-not-allowed': currentPage === item.value}]">
                            {{ item.value }}
                        </button>
                    </li>
                    <li v-else-if="item.type === 'ellipsis'">
                        <span class="flex items-center justify-center px-3 h-8 leading-tight text-black bg-gray-50">
                            ...
                        </span>
                    </li>
                </template>
                <li>
                    <button type="button" href="#" :class="{ 'opacity-50 cursor-not-allowed': currentPage === lastPage, 'cursor-pointer': currentPage !== lastPage }"
                        :disabled="currentPage === lastPage" @click="$emit('changePage', currentPage + 1)"
                        class="flex items-center justify-center px-3 h-8 leading-tight text-black bg-gray-50 hover:bg-gray-300">
                        <span class="sr-only">Next</span>
                        <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m1 9 4-4-4-4" />
                        </svg>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script>
import PerPageSelector from '@/views/components/app/forms/PerPageSelector.vue';

export default {
    components: {
        PerPageSelector
    },
    props: {
        currentPage: Number,
        lastPage: Number,
        perPage: {
            type: Number,
            default: 10
        },
        perPageOptions: {
            type: Array,
            default: () => [10, 20, 50, 100]
        },
        showPerPageSelector: {
            type: Boolean,
            default: true
        },
        storageKey: {
            type: String,
            default: 'perPage'
        }
    },
    emits: ['changePage', 'perPageChange'],
    computed: {
        paginationItems() {
            const items = [];
            const delta = 2;
            let start = Math.max(1, this.currentPage - delta);
            let end = Math.min(this.lastPage, this.currentPage + delta);
            
            const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            
            if (start > 1) {
                items.push({ type: 'page', value: 1 });
                if (start > 2) {
                    items.push({ type: 'ellipsis' });
                }
            }
            
            pages.forEach(page => {
                items.push({ type: 'page', value: page });
            });
            
            if (end < this.lastPage) {
                if (end < this.lastPage - 1) {
                    items.push({ type: 'ellipsis' });
                }
                items.push({ type: 'page', value: this.lastPage });
            }
            
            return items;
        }
    }
};
</script>

<style scoped>
button {
    transition: all 0.2s;
}

button:hover:not(:disabled) {
    background: #e2e8f0;
}
</style>
