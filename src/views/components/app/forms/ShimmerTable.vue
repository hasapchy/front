<template>
    <table class="min-w-full bg-white shadow-md rounded mb-6">
        <thead class="bg-gray-100">
            <tr>
                <th v-for="(column, index) in columns" :key="index" class="text-left py-2 px-4 font-medium">
                    {{ column }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in rows" :key="row" class="border-b border-gray-200 animate-pulse">
                <td v-for="(column, index) in columns" :key="index" class="py-2 px-4">
                    <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    props: {
        columns: {
            type: Array,
            required: true
        },
        rows: {
            type: Number,
            default: 5
        }
    }
};
</script>

<style scoped>
.animate-pulse {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        background-color: #e2e8f0;
    }
    50% {
        background-color: #cbd5e1;
    }
    100% {
        background-color: #e2e8f0;
    }
}
</style>
