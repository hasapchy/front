<template>
    <ul class="flex border-b" style="border-bottom-color: #3571A4">
        <li v-for="tab in tabs" :key="tab.name" class="-mb-px mr-1">
            <a @click.prevent="tabClick(tab.name)"
            :class="['inline-block py-1 px-4 text-[#337AB7] hover:text-[#3571A4] font-semibold', 'cursor-pointer', { 'border-l border-t border-r rounded-t text-[#337AB7] bg-white': tab.name === activeTab }]">
            {{ tab.label }}
            </a>
        </li>
    </ul>
</template>

<script>
export default {
    props: {
        activeTab: {
            type: String,
            default: null
        },
        tabs: {
            type: Array,
            default: () => []
        },
        tabClick: {
            type: Function,
            default: () => {}
        }
    }
}
</script>