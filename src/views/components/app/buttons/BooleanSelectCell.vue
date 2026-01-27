<template>
    <div ref="dropdownRef" class="relative inline-block" @dblclick.stop>
        <div
            class="px-2 py-2 rounded cursor-pointer flex items-center justify-between min-w-[120px]"
            :style="selectedStyle"
            @click.stop="toggleDropdown"
        >
            <span class="truncate text-[12px] text-white">{{ selectedOption ? selectedOption.label : placeholder }}</span>
            <i class="fas fa-chevron-down text-xs ml-2 text-white"></i>
        </div>

        <ul
            v-if="isOpen"
            class="fixed z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
            :style="dropdownStyle"
            @click.stop
        >
            <li
                v-for="opt in options"
                :key="String(opt.value)"
                :class="[
                    'px-4 py-3 cursor-pointer flex items-center transition-all duration-200',
                    opt.value === value
                        ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 font-semibold'
                        : 'hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-400 hover:bg-blue-50'
                ]"
                @click.stop="selectValue(opt.value)"
            >
                <div
                    :class="[
                        'w-3 h-3 rounded-full mr-3 flex-shrink-0',
                        opt.value === value ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    ]"
                    :style="{ backgroundColor: opt.color || 'transparent' }"
                ></div>
                <span
                    :class="[
                        'text-sm font-medium',
                        opt.value === value ? 'text-blue-700' : 'text-gray-700'
                    ]"
                >
                    {{ opt.label }}
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: Boolean,
            default: false
        },
        options: {
            type: Array,
            required: true
        },
        onChange: {
            type: Function,
            default: null
        },
        placeholder: {
            type: String,
            default: ''
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isOpen: false,
            dropdownStyle: {}
        };
    },
    computed: {
        selectedOption() {
            return (this.options || []).find(o => o.value === this.value) || null;
        },
        selectedStyle() {
            const color = this.selectedOption?.color || '#3571A4';
            const opacity = this.disabled ? 0.6 : 1;

            return {
                backgroundColor: color,
                opacity: opacity
            };
        }
    },
    methods: {
        toggleDropdown() {
            if (this.disabled) return;

            this.isOpen = !this.isOpen;
            if (!this.isOpen) return;

            this.$nextTick(() => {
                const rect = this.$refs.dropdownRef?.getBoundingClientRect?.();
                if (!rect) return;

                this.dropdownStyle = {
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left}px`
                };
            });
        },
        selectValue(newValue) {
            this.isOpen = false;
            this.onChange?.(newValue);
        },
        handleClickOutside(e) {
            if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(e.target)) {
                this.isOpen = false;
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    }
};
</script>

