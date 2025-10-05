<template>
    <div class="flex items-center">
        <select 
            v-model="selectedPerPage" 
            @change="handlePerPageChange"
            class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
            <option v-for="option in perPageOptions" :key="option" :value="option">
                {{ option }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'PerPageSelector',
    props: {
        perPage: {
            type: Number,
            default: 10
        },
        perPageOptions: {
            type: Array,
            default: () => [10, 25, 50, 100]
        },
        storageKey: {
            type: String,
            default: 'perPage'
        }
    },
    emits: ['perPageChange'],
    data() {
        return {
            selectedPerPage: this.getStoredPerPage()
        }
    },
    mounted() {
        this.loadStoredPerPage();
    },
    watch: {
        perPage(newVal) {
            this.selectedPerPage = newVal;
        }
    },
    methods: {
        getStoredPerPage() {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? parseInt(stored) : this.perPage;
        },
        loadStoredPerPage() {
            const stored = this.getStoredPerPage();
            if (stored !== this.perPage) {
                this.$emit('perPageChange', stored);
            }
        },
        handlePerPageChange() {
            localStorage.setItem(this.storageKey, this.selectedPerPage.toString());
            this.$emit('perPageChange', this.selectedPerPage);
        }
    }
}
</script>
