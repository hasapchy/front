<template>
    <li class="mb-2">
        <router-link :to="to"
            :class="['flex items-center p-2', settings ? 'hover:bg-[#939699]' : 'hover:bg-[#53585C]', isActive ? settings ? 'bg-[#939699]' : 'bg-[#53585C]' : '', isActive ? 'border-l-2 border-red-500' : '', 'transition-colors text-sm']">
            <i :class="[icon]"></i>
            <slot></slot>
        </router-link>
    </li>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
    props: {
        to: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        settings: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    setup(props) {
        const route = useRoute();
        const isActive = computed(() => route.path === props.to);
        return {
            route,
            isActive
        }
    }
}
</script>