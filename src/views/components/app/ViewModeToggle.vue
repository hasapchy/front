<template>
    <div class="flex items-center border border-gray-300 rounded overflow-hidden">
        <button @click="$emit('change', 'table')" class="px-3 py-2 transition-colors cursor-pointer"
            :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
            <i class="fas fa-table"></i>
        </button>
        <button @click="$emit('change', 'kanban')" class="px-3 py-2 transition-colors cursor-pointer"
            :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
            <i class="fas fa-columns"></i>
        </button>
    </div>
</template>

<script>
export default {
    props: {
        viewMode: {
            type: String,
            required: true,
            validator: (value) => ['table', 'kanban'].includes(value)
        }
    },
    emits: ['change']
};
</script>

