<template>
    <button :disabled="isLoading" :class="{ 'opacity-50 cursor-not-allowed': isLoading, ...buttonClasses }"
        @click="onclick">
        <transition name="fade">
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else-if="icon" :class="icon"></i>
        </transition>
        <div :class="{ 'ml-2': (isLoading || icon) && $slots.default, 'inline-block': true }"></div>
        <slot></slot>
    </button>
</template>

<script>
// class="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 focus:outline-none focus:shadow-outline transition duration-300 cursor-pointer"
export default {
    props: {
        icon: {
            type: String,
            required: false,
            default: null
        },
        isLoading: {
            type: Boolean,
            required: false,
            default: false
        },
        onclick: {
            type: Function,
            required: false,
            default: null
        },
        isDanger: {
            type: Boolean,
            required: false,
            default: false
        },
        isLight: {
            type: Boolean,
            required: false,
            default: false
        },
        isInfo: {
            type: Boolean,
            required: false,
            default: false
        },
        isFull: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    computed: {
        buttonClasses() {
            return {
                'bg-[#EE4F47]': this.isDanger,
                'bg-[#5CB85C]': !this.isDanger && !this.isLight && !this.isInfo,
                'bg-white border border-gray-300': this.isLight && !this.isDanger && !this.isInfo,
                'bg-[#337AB7]': this.isInfo && !this.isDanger && !this.isLight,
                'text-white': !this.isLight,
                'text-black': this.isLight,
                'hover:bg-[#4EA84E]': !this.isDanger && !this.isLight && !this.isInfo,
                'hover:bg-[#D53935]': this.isDanger && !this.isLight && !this.isInfo,
                'hover:bg-[#3571A4]': this.isInfo && !this.isDanger && !this.isLight,
                'hover:bg-gray-300/50': this.isLight && !this.isDanger && !this.isInfo,
                'px-3 py-2 rounded focus:outline-none focus:shadow-outline transition duration-300 cursor-pointer': true,
                'w-full': this.isFull
            }
        }
    }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.05s;
}

.fade-enter-from,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
    {
    opacity: 0;
    font-size: 0;
}

.fade-enter-to,
.fade-leave-from

/* .fade-leave-active in <2.1.8 */
    {
    opacity: 1;
    font-size: auto;
}
</style>