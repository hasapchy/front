<template>
  <div class="product-search-table-wrap overflow-x-auto">
    <table
      class="product-search-table w-100 min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
      <thead class="product-search-table__head rounded-t-sm bg-[var(--surface-muted)]">
        <tr>
          <th
            class="product-search-table__name-col w-48 border border-gray-300 px-4 py-2 text-center font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            {{ $t('name') }}
          </th>
          <th v-if="showQuantity"
            class="border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)] min-w-[11rem] w-44">
            {{ $t('quantity') }}
          </th>
          <th v-if="showPrice"
            class="w-48 border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            {{ priceHeaderLabel }}
          </th>
          <th
            v-if="showOrderColumn"
            class="w-28 border border-gray-300 px-2 py-2 text-center font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ $t('orderNumber') }}
          </th>
          <th v-if="removable"
            class="w-10 border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            <span class="sr-only">{{ $t('actions') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, index) in lines" :key="lineKey(line, index)"
          class="product-search-row border-b border-gray-300 dark:border-[var(--border-subtle)]"
          :class="{ 'product-search-row--even': index % 2 === 1 }">
          <td
            class="product-search-table__name-col border-x border-gray-300 px-4 py-2 text-center dark:border-[var(--border-subtle)]">
            <div class="flex items-center justify-center text-gray-900 dark:text-[var(--text-primary)]">
              <div class="w-7 h-7 flex items-center justify-center mr-2 shrink-0">
                <img v-if="line.imgUrl && line.imgUrl()" :src="line.imgUrl()" alt=""
                  class="w-7 h-7 object-cover rounded" loading="lazy">
                <span v-else v-html="line.icons ? line.icons() : defaultProductLineIconHtml(line)" />
              </div>
              <span class="min-w-0">{{ line.productName || line.name }}</span>
            </div>
          </td>
          <td v-if="showQuantity"
            class="border-x border-gray-300 px-2 py-2 align-middle dark:border-[var(--border-subtle)]">
            <div class="line-input-group line-input-group--with-unit"
              :class="{ 'line-input-group--locked': line.priceLocked }">
              <FormattedDecimalInput v-if="!readonly" v-model="line.quantity" variant="quantity"
                class="line-input-group__field" :disabled="disabled" :min="quantityMin"
                @update:model-value="onQuantityInput(line)" />
              <span v-else class="line-input-group__field text-right text-sm tabular-nums">{{
                formatQuantity(line.quantity) }}</span>
              <span v-if="showUnit" class="line-input-group__unit line-input-group__unit--static">
                {{ lineUnitLabel(line) }}
              </span>
            </div>
          </td>
          <td v-if="showPrice"
            class="border-x border-gray-300 px-2 py-2 align-middle dark:border-[var(--border-subtle)]">
            <div class="line-input-group" :class="{
              'line-input-group--with-suffix': showCurrencySuffix,
              'line-input-group--locked': line.priceLocked,
            }">
              <i v-if="line.priceLocked"
                class="fas fa-lock line-input-group__lock shrink-0 text-[10px] text-gray-400 dark:text-[var(--text-secondary)]"
                aria-hidden="true" />
              <FormattedDecimalInput v-if="!readonly" v-model="line.price" variant="amount"
                :amount-rounding-scope="amountRoundingScope" class="line-input-group__field"
                :disabled="disabled || line.priceLocked" :min="priceMin"
                @update:model-value="(v) => onPriceInput(line, v)" />
              <span v-else class="line-input-group__field text-right text-sm tabular-nums">{{
                formatPriceDisplay(line.price) }}</span>
              <span v-if="showCurrencySuffix" class="line-input-group__currency">
                {{ effectiveCurrencySymbol }}
              </span>
            </div>
          </td>
          <td
            v-if="showOrderColumn"
            class="border-x border-gray-300 px-2 py-2 text-center align-middle text-sm dark:border-[var(--border-subtle)]"
          >
            <template v-if="line.orderId && line.orderId !== 'N/A'">
              #{{ line.orderId }}
            </template>
            <span
              v-else
              class="text-gray-400 dark:text-[var(--text-muted)]"
            >{{ $t('notSpecified') }}</span>
          </td>
          <td v-if="removable"
            class="border-x border-gray-300 px-2 py-2 text-center align-middle dark:border-[var(--border-subtle)]">
            <button type="button"
              class="product-search-row-remove z-50 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-2xl leading-none text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
              :disabled="disabled" :title="$t('remove')" :aria-label="$t('remove')" @click="$emit('remove', line)">
              ×
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="lines.length && (showFooter || $slots.footer)">
        <tr>
          <td :colspan="footerColspan" class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
            <slot name="footer">
              <div v-if="showFooter" class="product-search-sale-summary product-search-sale-summary--inline">
                <div class="product-search-sale-summary__segment product-search-sale-summary__segment--total">
                  <span class="product-search-sale-summary__label">{{ $t(footerLabelKey) }}:</span>
                  <span
                    class="product-search-sale-summary__value product-search-sale-summary__value--total tabular-nums">
                    {{ footerSubtotalFormatted }}
                  </span>
                </div>
              </div>
            </slot>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
import FormattedDecimalInput from '@/views/components/app/forms/FormattedDecimalInput.vue';
import {
  formatCurrencyWithRounding,
  formatNumber,
  formatQuantity,
} from '@/utils/numberUtils';
import {
  defaultProductLineIconHtml,
  resolveProductLineUnitLabel,
} from '@/utils/productLineDisplayUtils';

export default {
  name: 'DocumentProductLinesTable',
  components: {
    FormattedDecimalInput,
  },
  props: {
    lines: {
      type: Array,
      default: () => [],
    },
    currencySymbol: {
      type: String,
      default: '',
    },
    amountRoundingScope: {
      type: String,
      default: 'order',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    showQuantity: {
      type: Boolean,
      default: true,
    },
    showPrice: {
      type: Boolean,
      default: true,
    },
    showUnit: {
      type: Boolean,
      default: true,
    },
    showCurrencySuffix: {
      type: Boolean,
      default: true,
    },
    showOrderColumn: {
      type: Boolean,
      default: false,
    },
    removable: {
      type: Boolean,
      default: true,
    },
    showFooter: {
      type: Boolean,
      default: true,
    },
    footerLabelKey: {
      type: String,
      default: 'subtotal',
    },
    footerSubtotal: {
      type: Number,
      default: null,
    },
    quantityMin: {
      type: [Number, String],
      default: 0.01,
    },
    priceMin: {
      type: [Number, String],
      default: 0.01,
    },
    priceHeaderKey: {
      type: String,
      default: 'price',
    },
    lineKeyField: {
      type: String,
      default: 'productId',
    },
  },
  emits: ['remove', 'quantity-change', 'price-change'],
  computed: {
    effectiveCurrencySymbol() {
      const sym = String(this.currencySymbol || '').trim();
      if (sym) {
        return sym;
      }
      const currencies = this.$store.state.currencies || [];
      const defaultCurrency = currencies.find((c) => c.isDefault);
      return defaultCurrency ? defaultCurrency.symbol : '';
    },
    priceHeaderLabel() {
      return this.$t(this.priceHeaderKey);
    },
    resolvedFooterSubtotal() {
      if (this.footerSubtotal != null) {
        return Number(this.footerSubtotal) || 0;
      }
      return this.lines.reduce((sum, line) => {
        const total = Number(line.totalPrice);
        if (!Number.isNaN(total) && line.totalPrice != null && line.totalPrice !== '') {
          return sum + total;
        }
        return sum + (Number(line.price) || 0) * (Number(line.quantity) || 0);
      }, 0);
    },
    footerSubtotalFormatted() {
      return formatCurrencyWithRounding(
        this.resolvedFooterSubtotal,
        this.effectiveCurrencySymbol,
        true,
        this.amountRoundingScope,
      );
    },
    footerColspan() {
      let cols = 1;
      if (this.showQuantity) {
        cols += 1;
      }
      if (this.showPrice) {
        cols += 1;
      }
      if (this.showOrderColumn) {
        cols += 1;
      }
      if (this.removable) {
        cols += 1;
      }
      return cols;
    },
  },
  methods: {
    formatQuantity,
    defaultProductLineIconHtml,
    lineKey(line, index) {
      const field = line[this.lineKeyField] ?? line.id ?? line.excludeKey;
      return field != null ? String(field) : `line-${index}`;
    },
    lineUnitLabel(line) {
      return resolveProductLineUnitLabel(
        line,
        (id) => this.$store.getters.getUnitShortName(id),
      );
    },
    formatPriceDisplay(value) {
      return formatNumber(value, null, true);
    },
    onQuantityInput(line) {
      this.$emit('quantity-change', line);
    },
    onPriceInput(line, value) {
      this.$emit('price-change', line, value);
    },
  },
};
</script>

<style scoped src="@/assets/document-product-lines-table.css"></style>
