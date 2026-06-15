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
            {{ $t('price') }}
          </th>
          <th
            v-if="showAmount && showPrice"
            class="w-48 border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ $t('amount') }}
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
          :class="{
            'product-search-row--even': index % 2 === 1,
            'product-search-row--disabled': disabled || readonly,
            'product-search-row--locked': line.priceLocked && !disabled && !readonly,
          }">
          <td
            class="product-search-table__name-col border-x border-gray-300 px-4 py-2 text-center dark:border-[var(--border-subtle)]">
            <div class="flex items-center justify-center text-gray-900 dark:text-[var(--text-primary)]">
              <ProductLineImage
                :item="line"
                wrapper-class="w-7 h-7"
                class="mr-2 shrink-0"
              />
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
              'line-input-group--with-price-type': showLinePriceType && lineShowsPriceTypeSelector(line),
              'line-input-group--locked': line.priceLocked,
            }">
              <i v-if="line.priceLocked"
                class="fas fa-lock line-input-group__lock shrink-0 text-[10px] text-gray-400 dark:text-[var(--text-secondary)]"
                aria-hidden="true" />
              <FormattedDecimalInput v-if="!readonly" v-model="line.price" variant="amount"
                :amount-rounding-scope="amountRoundingScope"
                class="line-input-group__field"
                :disabled="disabled || line.priceLocked" :min="priceMin"
                @update:model-value="(v) => onPriceInput(line, v)" />
              <span v-else class="line-input-group__field text-right text-sm tabular-nums">{{
                formatPriceDisplay(line.price) }}</span>
              <span v-if="showCurrencySuffix" class="line-input-group__currency">
                {{ effectiveCurrencyCode }}
              </span>
              <div
                v-if="showLinePriceType && lineShowsPriceTypeSelector(line)"
                class="line-input-group__price-type"
                role="group"
                :aria-label="$t('orderLinePriceType')"
              >
                <button
                  type="button"
                  class="line-input-group__price-type-btn"
                  :class="{ 'line-input-group__price-type-btn--active': line.priceType === 'retail' }"
                  :disabled="disabled || readonly"
                  :title="$t('retailPrice')"
                  :aria-label="$t('retailPrice')"
                  @click="setLinePriceType(line, 'retail')"
                >
                  <i class="fas fa-tag" aria-hidden="true" />
                </button>
                <button
                  v-if="lineWholesaleAvailable(line)"
                  type="button"
                  class="line-input-group__price-type-btn"
                  :class="{ 'line-input-group__price-type-btn--active': line.priceType === 'wholesale' }"
                  :disabled="disabled || readonly"
                  :title="$t('wholesalePrice')"
                  :aria-label="$t('wholesalePrice')"
                  @click="setLinePriceType(line, 'wholesale')"
                >
                  <i class="fas fa-boxes" aria-hidden="true" />
                </button>
              </div>
            </div>
          </td>
          <td
            v-if="showAmount && showPrice"
            class="border-x border-gray-300 px-2 py-2 align-middle dark:border-[var(--border-subtle)]"
          >
            <div
              class="line-input-group"
              :class="{
                'line-input-group--with-suffix': showCurrencySuffix,
                'line-input-group--locked': line.priceLocked,
              }"
            >
              <i
                v-if="line.priceLocked"
                class="fas fa-lock line-input-group__lock shrink-0 text-[10px] text-gray-400 dark:text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <FormattedDecimalInput
                v-if="!readonly"
                v-model="line.amount"
                variant="amount"
                :amount-rounding-scope="amountRoundingScope"
                class="line-input-group__field"
                :disabled="disabled || line.priceLocked"
                :min="amountMin"
                @update:model-value="(v) => onAmountInput(line, v)"
              />
              <span
                v-else
                class="line-input-group__field text-right text-sm tabular-nums"
              >{{ formatPriceDisplay(line.amount) }}</span>
              <span
                v-if="showCurrencySuffix"
                class="line-input-group__currency"
              >
                {{ effectiveCurrencyCode }}
              </span>
            </div>
          </td>
          <td v-if="removable"
            class="border-x border-gray-300 px-2 py-2 text-center align-middle dark:border-[var(--border-subtle)]">
            <button type="button"
              class="product-search-row-remove z-50 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-2xl leading-none text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[var(--color-danger)] dark:hover:bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)]"
              :disabled="disabled" :title="$t('remove')" :aria-label="$t('remove')" @click="$emit('remove', line)">
              ×
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="lines.length && $slots.footer">
        <tr>
          <td :colspan="footerColspan" class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
            <slot name="footer" />
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
import ProductLineImage from '@/views/components/app/ProductLineImage.vue';
import FormattedDecimalInput from '@/views/components/app/forms/FormattedDecimalInput.vue';
import {
  formatNumberForDisplay,
  formatQuantity,
} from '@/utils/numberUtils';
import { resolveProductLineUnitLabel } from '@/utils/productLineDisplayUtils';

export default {
  name: 'DocumentProductLinesTable',
  components: {
    FormattedDecimalInput,
    ProductLineImage,
  },
  props: {
    lines: {
      type: Array,
      default: () => [],
    },
    currencyCode: {
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
    showAmount: {
      type: Boolean,
      default: false,
    },
    showLinePriceType: {
      type: Boolean,
      default: false,
    },
    showUnit: {
      type: Boolean,
      default: true,
    },
    showCurrencySuffix: {
      type: Boolean,
      default: true,
    },
    removable: {
      type: Boolean,
      default: true,
    },
    quantityMin: {
      type: [Number, String],
      default: 0.01,
    },
    priceMin: {
      type: [Number, String],
      default: 0.01,
    },
    amountMin: {
      type: [Number, String],
      default: 0.01,
    },
    lineKeyField: {
      type: String,
      default: 'productId',
    },
  },
  emits: ['remove', 'quantity-change', 'price-change', 'amount-change', 'price-type-change'],
  computed: {
    effectiveCurrencyCode() {
      const code = String(this.currencyCode || '').trim();
      if (code) {
        return code;
      }
      const currencies = this.$store.state.currencies || [];
      const defaultCurrency = currencies.find((c) => c.isDefault);
      return defaultCurrency ? defaultCurrency.code : '';
    },
    footerColspan() {
      let cols = 1;
      if (this.showQuantity) {
        cols += 1;
      }
      if (this.showPrice) {
        cols += 1;
      }
      if (this.showAmount && this.showPrice) {
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
    lineKey(line, index) {
      const stableId = line.orderProductId ?? line.id;
      if (stableId != null && stableId !== '') {
        return String(stableId);
      }
      const excludeKey = line.excludeKey;
      if (excludeKey != null && excludeKey !== '') {
        return String(excludeKey);
      }
      const field = line[this.lineKeyField] ?? line.id;
      if (field != null && field !== '') {
        return `${String(field)}-${index}`;
      }
      return `line-${index}`;
    },
    lineUnitLabel(line) {
      return resolveProductLineUnitLabel(
        line,
        (id) => this.$store.getters.getUnitShortName(id),
      );
    },
    formatPriceDisplay(value) {
      return formatNumberForDisplay(value, true);
    },
    onQuantityInput(line) {
      this.$emit('quantity-change', line);
    },
    lineShowsPriceTypeSelector(line) {
      return !line?.isTempProduct && !!(line?.productId ?? line?.product_id);
    },
    lineWholesaleAvailable(line) {
      return Number(line?.wholesalePrice) > 0;
    },
    setLinePriceType(line, priceType) {
      if (line.priceType === priceType) {
        return;
      }
      line.priceType = priceType;
      this.$emit('price-type-change', line);
    },
    onPriceInput(line, value) {
      line.price = Number(value);
      this.$emit('price-change', line, line.price);
    },
    onAmountInput(line, value) {
      line.amount = Number(value);
      this.$emit('amount-change', line, line.amount);
    },
  },
};
</script>

