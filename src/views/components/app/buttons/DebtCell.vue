<template>
    <i v-if="variant === 'icon'" :class="iconClass"></i>
    <span v-else :class="textClass">{{ textSymbol }}</span>
</template>

<script>
export default {
    name: 'DebtCell',
    props: {
        isDebt: {
            type: [Number, Boolean, String],
            default: 0
        },
        variant: {
            type: String,
            default: 'icon',
            validator: (value) => ['icon', 'text'].includes(value)
        }
    },
    computed: {
        isDebtValue() {
            if (this.isDebt === true || this.isDebt === 1 || this.isDebt === '1' || this.isDebt === 'true') {
                return true;
            }
            return false;
        },
        iconClass() {
            return this.isDebtValue 
                ? 'fas fa-check text-green-500' 
                : 'fas fa-times text-red-500';
        },
        textClass() {
            return this.isDebtValue 
                ? 'text-green-500 font-bold' 
                : 'text-gray-400';
        },
        textSymbol() {
            return this.isDebtValue ? '✓' : '-';
        }
    }
}
</script>

