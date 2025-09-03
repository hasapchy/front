<template>
    <button :disabled="isLoading || isDisabled || isClickBlocked" :class="[
        buttonClasses,
        {
            'cursor-pointer': !isDisabled && !isLoading && !isClickBlocked,
            'opacity-50 cursor-not-allowed': isDisabled || isLoading || isClickBlocked
        }
    ]" @click="handleClick">
        <transition name="fade">
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else-if="icon" :class="icon"></i>
        </transition>
        <div :class="{ 'ml-2': (isLoading || icon) && $slots.default, 'inline-block': true }"></div>
        <slot></slot>
    </button>
</template>

<script>
export default {
    data() {
        return {
            isClickBlocked: false,
        };
    },
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
        },
        disabled: {
            type: Boolean,
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
                'px-3 py-2 rounded focus:outline-none focus:shadow-outline transition duration-300': true,
                'w-full': this.isFull
            }
        },
        isDisabled() {
            return this.disabled;
        }
    },
    methods: {
        handleClick(e) {
            if (this.isDisabled || this.isLoading || this.isClickBlocked) return;
            
            // Защита от двойного клика - блокируем кнопку
            this.isClickBlocked = true;
            
            // Выполняем действие
            if (this.onclick) {
                const result = this.onclick(e);
                
                // Если onclick возвращает Promise, ждем его завершения
                if (result && typeof result.then === 'function') {
                    result.finally(() => {
                        // Разблокируем кнопку через небольшую задержку
                        setTimeout(() => {
                            this.isClickBlocked = false;
                        }, 500);
                    });
                } else {
                    // Если не Promise, разблокируем через задержку
                    setTimeout(() => {
                        this.isClickBlocked = false;
                    }, 500);
                }
            } else {
                // Если нет onclick, просто разблокируем через задержку
                setTimeout(() => {
                    this.isClickBlocked = false;
                }, 500);
            }
        }
    }
}
</script>
