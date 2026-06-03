<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-lg"
    :class="sizeClass"
    :style="{ backgroundColor: `color-mix(in srgb, ${accentHex} 22%, transparent)` }"
  >
    <i
      :class="[iconClass, iconSizeClass]"
      :style="{ color: accentHex }"
    />
  </span>
</template>

<script>
import { getCashRegisterAccentHex, getCashRegisterShellIconClass, resolveCashRegisterIconSize } from '@/utils/cashRegisterUtils';

export default {
    name: 'CashRegisterIconBadge',
    props: {
        cashRegister: { type: Object, default: null },
        size: { type: String, default: 'md' },
    },
    computed: {
        accentHex() {
            void this.$store.state.cashRegisterUserColorsRevision;
            return getCashRegisterAccentHex(this.cashRegister);
        },
        iconClass() {
            return getCashRegisterShellIconClass(this.cashRegister);
        },
        sizeClass() {
            const iconSize = resolveCashRegisterIconSize(this.cashRegister);
            if (this.size === 'sm') {
                if (iconSize === 'small') return 'h-5 w-5';
                if (iconSize === 'large') return 'h-8 w-8';
                return 'h-6 w-6';
            }
            if (this.size === 'lg') {
                if (iconSize === 'small') return 'h-7 w-7';
                if (iconSize === 'large') return 'h-12 w-12';
                return 'h-9 w-9';
            }
            if (iconSize === 'small') return 'h-[21px] w-[21px]';
            if (iconSize === 'large') return 'h-10 w-10';
            return 'h-7 w-7';
        },
        iconSizeClass() {
            const iconSize = resolveCashRegisterIconSize(this.cashRegister);
            if (this.size === 'sm') {
                if (iconSize === 'small') return 'text-[10px] leading-none';
                if (iconSize === 'large') return 'text-sm leading-none';
                return 'text-xs leading-none';
            }
            if (this.size === 'lg') {
                if (iconSize === 'small') return 'text-sm leading-none';
                if (iconSize === 'large') return 'text-2xl leading-none';
                return 'text-lg leading-none';
            }
            if (iconSize === 'small') return 'text-xs';
            if (iconSize === 'large') return 'text-lg';
            return 'text-sm';
        },
    },
};
</script>
