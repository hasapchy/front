<template>
    <TableFilterButton v-if="cardFields.length" :onReset="onReset">
        <ul>
            <li v-for="(element, index) in cardFields" :key="element.name"
                @click="$emit('toggle', index)"
                class="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer">
                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                    <div>
                        <i class="text-sm mr-2 text-[#337AB7]"
                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                        {{ $te(element.label) ? $t(element.label) : element.label }}
                    </div>
                </div>
            </li>
        </ul>
    </TableFilterButton>
</template>

<script>
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';

export default {
    name: 'CardFieldsGearMenu',
    components: { TableFilterButton },
    props: {
        cardFields: { type: Array, default: () => [] },
        onReset: { type: Function, default: null }
    },
    emits: ['toggle']
};
</script>
