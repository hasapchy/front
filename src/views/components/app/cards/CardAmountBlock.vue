<template>
  <div
    v-if="hasValue"
    class="card-amount-block"
  >
    <span
      v-if="amountHtml"
      class="card-amount-block__amount"
      v-html="amountHtml"
    />
    <span
      v-else
      class="card-amount-block__amount"
    >{{ amount }}</span>
    <span
      v-if="subLabelHtml"
      class="card-amount-block__sub"
      v-html="subLabelHtml"
    />
    <span
      v-else-if="subLabel"
      class="card-amount-block__sub"
      :style="subStyle"
    >{{ subLabel }}</span>
  </div>
</template>

<script>
export default {
    name: 'CardAmountBlock',
    props: {
        amount: {
            type: String,
            default: '',
        },
        amountHtml: {
            type: String,
            default: '',
        },
        subLabel: {
            type: String,
            default: '',
        },
        subLabelHtml: {
            type: String,
            default: '',
        },
        subColor: {
            type: String,
            default: '',
        },
    },
    computed: {
        hasValue() {
            return Boolean(this.amount || this.amountHtml);
        },
        subStyle() {
            if (!this.subColor) {
                return undefined;
            }
            return { color: this.subColor };
        },
    },
};
</script>
