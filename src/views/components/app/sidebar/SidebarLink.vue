<template>
    <li class="mb-2">
        <router-link :to="to"
            :class="[
                'flex items-center p-2', 
                settings ? 'hover:bg-[#939699]' : 'hover:bg-[#53585C]', 
                isActive ? settings ? 'bg-[#939699]' : 'bg-[#53585C]' : '', 
                isActive ? 'border-l-2 border-red-500' : '', 
                'transition-colors text-sm',
                isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            ]"
            :disabled="isLoading">
            <i :class="[icon]"></i>
            <slot></slot>
        </router-link>
    </li>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

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
        const store = useStore();
        
        const isActive = computed(() => route.path === props.to);
        const isLoading = computed(() => store.getters.isLoading);
        
        return {
            route,
            isActive,
            isLoading
        }
    }
}
</script>