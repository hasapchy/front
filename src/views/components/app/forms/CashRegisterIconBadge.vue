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
import { getCashRegisterAccentHex, getCashRegisterShellIconClass } from '@/utils/cashRegisterUtils';

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
            if (this.size === 'sm') return 'h-6 w-6';
            if (this.size === 'lg') return 'h-9 w-9';
            return 'h-7 w-7';
        },
        iconSizeClass() {
            if (this.size === 'sm') return 'text-xs leading-none';
            if (this.size === 'lg') return 'text-lg leading-none';
            return 'text-sm';
        },
    },
};
</script>
