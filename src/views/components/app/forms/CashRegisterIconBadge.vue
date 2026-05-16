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
            return getCashRegisterAccentHex(this.cashRegister);
        },
        iconClass() {
            return getCashRegisterShellIconClass(this.cashRegister);
        },
        sizeClass() {
            return this.size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
        },
        iconSizeClass() {
            return this.size === 'sm' ? 'text-xs leading-none' : 'text-sm';
        },
    },
};
</script>
