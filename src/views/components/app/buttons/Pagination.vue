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
        <nav>
            <ul class="flex items-center -space-x-px h-8 text-sm">
                <li>
                    <button type="button" :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
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

                <li v-for="page in pages" :key="page">
                    <button type="button" :disabled="currentPage === page" @click="$emit('changePage', page)"
                        class="flex items-center justify-center px-3 h-8 leading-tight transition-all bg-gray-50 hover:bg-[#4EA84E]" :class="{'bg-green text-white': page === currentPage}"> {{ page }}</button>
                </li>
                <li>
                    <button type="button" href="#" :class="{ 'opacity-50 cursor-not-allowed': currentPage === lastPage }"
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
            default: () => [10, 25, 50, 100]
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
        pages() {
            let start = Math.max(1, this.currentPage - 2);
            let end = Math.min(this.lastPage, this.currentPage + 2);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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
