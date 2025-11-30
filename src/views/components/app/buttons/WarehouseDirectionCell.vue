<template>
    <div class="flex items-center">
        <span>{{ warehouseFromName }}</span>
        <i class="fas fa-right-long text-[#5CB85C] mx-2"></i>
        <span>{{ warehouseToName }}</span>
    </div>
</template>

<script>
export default {
    name: 'WarehouseDirectionCell',
    props: {
        movement: {
            type: Object,
            required: true
        }
    },
    computed: {
        warehouseFromName() {
            return this.movement.warehouseFromName || '';
        },
        warehouseToName() {
            return this.movement.warehouseToName || '';
        }
    }
}
</script>

