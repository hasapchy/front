<template>
  <button
    type="button"
    :disabled="isLoading || isDisabled || isClickBlocked"
    :aria-label="ariaLabel || undefined"
    :title="(ariaLabel || title) || undefined"
    :class="[
      buttonClasses,
      {
        'cursor-pointer': !isDisabled && !isLoading && !isClickBlocked,
        'opacity-50 cursor-not-allowed': isDisabled || isLoading || isClickBlocked
      }
    ]"
    @click="handleClick"
  >
    <transition name="fade">
      <SpinnerIcon
        v-if="isLoading"
        size-class=""
      />
      <i
        v-else-if="icon"
        :class="icon"
      />
    </transition>
    <div :class="{ 'ml-2': (isLoading || icon) && $slots.default, 'inline-block': true }" />
    <slot />
  </button>
</template>

<script>
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
        isSuccess: {
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
        },
        ariaLabel: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            isClickBlocked: false,
        };
    },
    computed: {
        buttonClasses() {
            const green = !this.isDanger && !this.isLight && (!this.isInfo || this.isSuccess);
            const infoGradient = this.isInfo && !this.isDanger && !this.isLight && !this.isSuccess;
            return {
                'bg-[var(--color-danger)]': this.isDanger,
                'bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success-hover)]': green,
                'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]': this.isLight && !this.isDanger && !this.isInfo,
                'bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)]': infoGradient,
                'text-white': !this.isLight,
                'text-[var(--text-primary)]': this.isLight,
                'shadow-sm shadow-black/10': green || infoGradient,
                'hover:brightness-110': green || infoGradient,
                'hover:bg-[var(--color-danger-hover)]': this.isDanger && !this.isLight && !this.isInfo,
                'hover:bg-[color-mix(in_srgb,var(--surface-muted)_85%,var(--border-subtle))] dark:hover:bg-[var(--surface-muted)]': this.isLight && !this.isDanger && !this.isInfo,
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
            
            this.isClickBlocked = true;
            
            if (this.onclick) {
                const result = this.onclick(e);
                Promise.resolve(result).finally(() => {
                    setTimeout(() => {
                        this.isClickBlocked = false;
                    }, 500);
                });
            } else {
                setTimeout(() => {
                    this.isClickBlocked = false;
                }, 500);
            }
        }
    }
}
</script>
