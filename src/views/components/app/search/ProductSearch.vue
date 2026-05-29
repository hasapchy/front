<template>
  <div class="relative">
    <label class="block mb-1" :class="{ 'required': required }">{{ $t('searchProductsAndServices') }}</label>
    <input ref="productInput" v-model="productSearch" type="text" :placeholder="$t('enterProductNameOrCode')"
      class="w-full rounded border border-gray-300 bg-[var(--input-bg)] p-2 text-gray-900 placeholder:text-gray-400 dark:border-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
      :disabled="disabled" @focus="onProductSearchFocus" @blur="handleBlur">
    <transition name="appear">
      <div v-show="showDropdown"
        class="absolute left-0 right-0 z-10 mt-1 flex w-full flex-col overflow-hidden rounded border border-gray-300 bg-[var(--surface-elevated)] shadow-lg dark:border-[var(--border-subtle)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]">
        <ul class="max-h-60 overflow-y-auto min-h-0" @scroll.passive="onResultsScroll">
          <li v-if="productSearchLoading" class="p-2 text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t('loading') }}
          </li>
          <template v-else-if="productSearch.length === 0">
            <li v-if="isWarehouseProductsLoading"
              class="p-2 text-gray-500 dark:text-[var(--text-secondary)]">
              {{ $t('loading') }}
            </li>
            <li v-else-if="lastProducts.length === 0" class="p-2 text-gray-500 dark:text-[var(--text-secondary)]">
              {{ $t('productSearchRecentEmpty') }}
            </li>
            <template v-else>
              <li v-for="product in lastProducts" :key="product.id"
                class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
                @mousedown.prevent="selectProduct(product)">
                <div class="flex items-center justify-between">
                  <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
                    <ProductLineImage
                      :item="product"
                      alt="icon"
                      class="mr-2"
                    />
                    {{ product.name }}
                  </div>
                  <div
                    class="product-search-dropdown__meta flex min-w-[90px] flex-col items-end text-xs">
                    <template v-if="dropdownProductTypeName(product) === 'product'">
                      <div>
                        {{ product.stockQuantity }}
                        {{ product.unitShortName ||
                          product.unitName }}
                        {{ $t('price') }} {{ dropdownRetailPriceFormatted(product) }}{{ defaultCurrencySymbol
                        }}
                      </div>
                      <div
                        v-if="enableAlternateUnitQuantity && dropdownStockAlternateSummary(product)"
                        class="mt-0.5 text-xs text-gray-500 dark:text-[var(--text-secondary)]"
                      >
                        ≈ {{ dropdownStockAlternateSummary(product) }}
                      </div>
                    </template>
                    <template v-else>
                      <div>
                        ∞{{ product.unitShortName ||
                          product.unitName }} | {{ dropdownRetailPriceFormatted(product) }}{{
                          defaultCurrencySymbol }}
                      </div>
                    </template>
                  </div>
                </div>
              </li>
            </template>
          </template>
          <li v-else-if="productSearch.length < 3" class="p-2 text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t('minimum3Characters') }}
          </li>
          <li v-else-if="productResults.length === 0" class="p-2 text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t('notFound') }}
          </li>
          <template v-else>
            <li v-for="product in productResults" :key="product.id"
              class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="selectProduct(product)">
              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
                  <ProductLineImage
                    :item="product"
                    alt="icon"
                    class="mr-2"
                  />
                  {{ product.name }}
                </div>
                <div class="product-search-dropdown__meta text-sm">
                  <template v-if="dropdownProductTypeName(product) === 'product'">
                    <div>
                      {{ product.stockQuantity }}
                      {{ product.unitShortName }}
                      {{ $t('price') }} {{ dropdownRetailPriceFormatted(product) }}{{ defaultCurrencySymbol }}
                    </div>
                    <div
                      v-if="enableAlternateUnitQuantity && dropdownStockAlternateSummary(product)"
                      class="mt-0.5 text-xs text-gray-600 dark:text-[var(--text-secondary)]"
                    >
                      ≈ {{ dropdownStockAlternateSummary(product) }}
                    </div>
                  </template>
                  <template v-else>
                    ∞{{ product.unitShortName }} | {{
                      dropdownRetailPriceFormatted(product) }}{{ defaultCurrencySymbol }}
                  </template>
                </div>
              </div>
            </li>
            <li v-if="searchLoadingMore"
              class="p-2 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]">
              {{ $t('loading') }}
            </li>
          </template>
        </ul>
        <div v-if="!receiptWaybillRestrictionActive"
          class="flex w-full shrink-0 gap-2 border-t border-gray-300 bg-[var(--surface-muted)] p-2 dark:border-[var(--border-subtle)]">
          <PrimaryButton class="flex-1 min-w-0 basis-0" :is-info="true" :is-full="true" icon="fas fa-plus"
            @mousedown.prevent="openCreateProductModal">
            {{ $t('createProductOrService') }}{{ productSearch ? ` "${productSearch}"` : '' }}
          </PrimaryButton>
          <PrimaryButton v-if="showTempProductButton" class="flex-1 min-w-0 basis-0" :is-light="true" :is-full="true"
            icon="fas fa-bolt" :disabled="!productSearch.trim() || disabled"
            @mousedown.prevent="createTempProductQuick">
            {{ $t('createTempProduct') }}
          </PrimaryButton>
        </div>
      </div>
    </transition>

    <label class="block mt-4 mb-1 text-center">{{ $t('specifiedProductsAndServices') }}</label>
    <CardViewEmptyState v-if="!products.length" class="mb-6" />
    <DocumentProductLinesTable
      v-else-if="useSharedLinesTable"
      class="mb-6"
      :lines="products"
      :currency-symbol="warehouseLineCurrencySymbol"
      :amount-rounding-scope="amountRoundingScope"
      :disabled="disabled"
      :quantity-min="warehouseLineInputMin"
      :price-min="warehouseLineInputMin"
      show-unit
      show-currency-suffix
      :show-footer="false"
      @remove="(line) => removeSelectedProduct(line.productId)"
      @quantity-change="onQuantityChange"
      @price-change="(line, v) => onPriceChange(line, v)"
    >
      <template #footer>
        <div class="product-search-sale-summary product-search-sale-summary--inline">
          <div class="product-search-sale-summary__segment">
            <span class="product-search-sale-summary__label">{{ $t('discount') }}:</span>
            <div class="line-input-group product-search-sale-summary__discount-control">
              <FormattedDecimalInput
                v-model="discountLocal"
                variant="amount"
                :amount-rounding-scope="amountRoundingScope"
                class="line-input-group__field"
                placeholder="0"
                :disabled="disabled"
                @update:model-value="updateTotals"
              />
              <div class="line-input-group__unit-picker product-search-sale-summary__discount-picker">
                <select
                  v-model="discountTypeLocal"
                  class="line-input-group__unit line-input-group__unit--select product-search-sale-summary__discount-type"
                  :disabled="disabled"
                  @change="updateTotals"
                >
                  <option value="percent">
                    %
                  </option>
                  <option value="fixed">
                    {{ currencySymbol || defaultCurrencySymbol }}
                  </option>
                </select>
                <i
                  v-if="!disabled"
                  class="fas fa-chevron-down line-input-group__unit-chevron"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div class="product-search-sale-summary__segment product-search-sale-summary__segment--total">
            <span class="product-search-sale-summary__label">{{ $t('total') }}:</span>
            <span
              v-if="saleFooterHasDiscount"
              class="product-search-sale-summary__value product-search-sale-summary__value--struck tabular-nums"
            >{{ saleFooterSubtotalFormatted }}</span>
            <span class="product-search-sale-summary__value product-search-sale-summary__value--total tabular-nums">
              {{ saleFooterTotalFormatted }}
            </span>
          </div>
        </div>
      </template>
    </DocumentProductLinesTable>
    <div v-else class="product-search-table-wrap mb-6 overflow-x-auto">
      <table
        class="product-search-table w-100 min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
      >
      <thead class="product-search-table__head rounded-t-sm bg-[var(--surface-muted)]">
        <tr>
          <th
            class="product-search-table__name-col w-48 border border-gray-300 px-4 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            {{ $t('name') }}
          </th>
          <th
            v-if="showQuantity"
            class="border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
            :class="showQuantityWithUnitColumn ? 'min-w-[11rem] w-44' : 'min-w-[8rem] w-36'"
            :title="$t('quantity')"
          >
            <span class="product-search-table__head-inner">
              <span>{{ $t('quantity') }}</span>
              <FieldHint
                v-if="showAlternateUnitColumn"
                :text="$t('productSearchQuantityColHint')"
                :aria-label="$t('productSearchQuantityColHintAria')"
                placement="top"
              />
            </span>
          </th>
          <th
            v-if="showPrice"
            class="w-48 border border-gray-300 px-4 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            <template v-if="isReceipt || isPurchase">
              <span class="product-search-table__head-inner">
                <span>{{ $t('purchasePrice') }}</span>
                <FieldHint
                  :text="$t('productSearchPurchasePriceBaseUnitHint')"
                  :aria-label="$t('productSearchPurchasePriceBaseUnitHintAria')"
                  placement="top"
                />
              </span>
            </template>
            <template v-else>
              {{ $t('price') }}
            </template>
          </th>
          <th
            v-if="warehouseLineShowsAmountColumn && showPrice && showAmount"
            class="w-48 border border-gray-300 px-4 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ $t('amount') }}
          </th>
          <th
            class="w-10 border border-gray-300 px-2 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            <span class="sr-only">{{ $t('actions') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(product, index) in products"
          :key="index"
          class="product-search-row border-b border-gray-300 dark:border-[var(--border-subtle)]"
          :class="{
            'product-search-row--even': index % 2 === 1,
            'product-search-row--disabled': disabled,
            'product-search-row--locked': product.priceLocked && !disabled,
          }"
        >
          <td class="product-search-table__name-col border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]">
            <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
              <ProductLineImage
                :item="product"
                alt="icon"
                class="mr-2 shrink-0"
              />
              <span class="min-w-0">{{ product.productName || product.name }}</span>
            </div>
          </td>
          <td
            v-if="showQuantity"
            class="border-x border-gray-300 px-2 py-2 align-middle dark:border-[var(--border-subtle)]"
            :class="showQuantityWithUnitColumn ? 'min-w-[11rem] w-44' : 'min-w-[8rem] w-36'"
          >
            <div
              class="line-input-group"
              :class="lineQuantityGroupClasses(product)"
            >
              <FormattedDecimalInput
                v-if="!enableAlternateUnitQuantity"
                v-model="product.quantity"
                variant="quantity"
                class="line-input-group__field"
                :placeholder="warehouseFieldPlaceholder"
                :disabled="disabled"
                :min="warehouseLineInputMin"
                @update:model-value="onQuantityChange(product)"
              />
              <template v-else>
                <FormattedDecimalInput
                  :model-value="lineQuantityInputModel(product)"
                  variant="quantity"
                  class="line-input-group__field"
                  :placeholder="warehouseFieldPlaceholder"
                  :disabled="disabled"
                  :min="warehouseLineInputMin"
                  @update:model-value="(v) => onLineQuantityInput(product, v)"
                />
                <template v-if="showAlternateUnitColumn">
                  <div
                    v-if="lineHasUnitSelect(product)"
                    class="line-input-group__unit-picker"
                  >
                    <select
                      class="line-input-group__unit line-input-group__unit--select"
                      :disabled="disabled"
                      :value="lineAlternateUnitSelectValue(product)"
                      @change="onLineAlternateUnitChange(product, $event.target.value)"
                    >
                      <option value="">
                        {{ lineBaseUnitLabel(product) }}
                      </option>
                      <option
                        v-for="u in alternateUnitSelectOptions(product)"
                        :key="u.unit_id"
                        :value="String(u.unit_id)"
                      >
                        {{ u.short_name }}
                      </option>
                    </select>
                    <i
                      v-if="!disabled"
                      class="fas fa-chevron-down line-input-group__unit-chevron"
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    v-else
                    class="line-input-group__unit line-input-group__unit--static"
                  >
                    {{ lineBaseUnitLabel(product) }}
                  </span>
                </template>
                <span
                  v-if="lineShowsBaseQuantityHint(product)"
                  class="line-input-group__hint line-input-group__hint--help"
                  :title="lineBaseQuantityHint(product)"
                >
                  {{ lineBaseQuantityHint(product) }}
                </span>
              </template>
            </div>
          </td>
          <td v-if="showPrice" class="border-x border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
            <div
              class="line-input-group"
              :class="lineWarehouseMoneyGroupClasses(product, 'price')"
            >
              <i
                v-if="product.priceLocked"
                class="fas fa-lock line-input-group__lock shrink-0 text-[10px] text-gray-400 dark:text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <FormattedDecimalInput
                v-model="product.price"
                variant="amount"
                :amount-rounding-scope="amountRoundingScope"
                class="line-input-group__field"
                :placeholder="warehouseFieldPlaceholder"
                :disabled="disabled || product.priceLocked"
                :min="warehouseLineInputMin"
                @update:model-value="(v) => onPriceChange(product, v)"
              />
              <span
                v-if="warehouseLineShowsCurrencySuffix"
                class="line-input-group__currency"
              >
                {{ warehouseLineCurrencySymbol }}
              </span>
              <span
                v-if="showDefaultCurrencyHint(product, 'price')"
                class="line-input-group__hint line-input-group__hint--help"
                :title="lineDefaultCurrencyHintFromDb(product, 'price')"
              >
                {{ lineDefaultCurrencyHintFromDb(product, 'price') }}
              </span>
            </div>
          </td>
          <td
            v-if="warehouseLineShowsAmountColumn && showPrice && showAmount"
            class="border-x border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]"
          >
            <div
              class="line-input-group"
              :class="lineWarehouseMoneyGroupClasses(product, 'amount')"
            >
              <i
                v-if="product.priceLocked"
                class="fas fa-lock line-input-group__lock shrink-0 text-[10px] text-gray-400 dark:text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <FormattedDecimalInput
                v-model="product.amount"
                variant="amount"
                :amount-rounding-scope="amountRoundingScope"
                class="line-input-group__field"
                :placeholder="warehouseFieldPlaceholder"
                :disabled="disabled || product.priceLocked"
                :min="warehouseLineInputMin"
                @update:model-value="(v) => onAmountChange(product, v)"
              />
              <span
                v-if="warehouseLineShowsCurrencySuffix"
                class="line-input-group__currency"
              >
                {{ warehouseLineCurrencySymbol }}
              </span>
              <span
                v-if="showDefaultCurrencyHint(product, 'amount')"
                class="line-input-group__hint line-input-group__hint--help"
                :title="lineDefaultCurrencyHintFromDb(product, 'amount')"
              >
                {{ lineDefaultCurrencyHintFromDb(product, 'amount') }}
              </span>
            </div>
          </td>
          <td v-if="showPriceType && !isReceipt && !isSale"
            class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]">
            <select v-model="product.priceType" class="w-full p-1" :disabled="disabled"
              @change="onPriceTypeChange(product)">
              <option v-if="product.purchasePrice !== undefined" value="purchase">
                {{ $t('purchasePrice')
                }}
              </option>
              <option value="retail">
                {{ $t('retailPrice') }}
              </option>
              <option v-if="product.wholesalePrice !== undefined && product.wholesalePrice > 0" value="wholesale">
                {{ $t('wholesalePrice') }}
              </option>
            </select>
          </td>
          <td class="border-x border-gray-300 px-2 py-2 text-center align-middle dark:border-[var(--border-subtle)]">
            <button
              type="button"
              class="product-search-row-remove z-50 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-2xl leading-none text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
              :disabled="disabled"
              :title="$t('remove')"
              :aria-label="$t('remove')"
              @click="removeSelectedProduct(product.productId)"
            >
              ×
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <SideModalDialog :show-form="modalCreateProduct" :title="productCreateModalTitle"
      :onclose="() => modalCreateProduct = false" :level="3">
      <ProductsCreatePage :default-type="defaultProductType" :default-name="defaultProductName" :editing-item="null"
        @saved="onProductCreated" @saved-error="onProductCreatedError" />
    </SideModalDialog>
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import WarehousePurchaseProductDto from '@/dto/warehouse/WarehousePurchaseProductDto';
import SaleProductDto from '@/dto/sale/SaleProductDto';
import OrderProductDto from '@/dto/order/OrderProductDto';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import ProductLineImage from '@/views/components/app/ProductLineImage.vue';
import DocumentProductLinesTable from '@/views/components/app/forms/DocumentProductLinesTable.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import notificationMixin from '@/mixins/notificationMixin';
import {
  formatCurrencyForDisplay,
  formatQuantity,
  roundQuantityValue,
  roundValue,
  roundValueForScope,
} from '@/utils/numberUtils';
import { catalogToDocumentMultiplier } from '@/utils/catalogToDocumentMultiplier';
import {
  documentAmountToDefault,
  resolveLineSubtotalInDefaultCurrency,
  fetchDocumentToDefaultFactor,
} from '@/utils/documentToDefaultCurrency';
import {
  alternateFromBase,
  baseFromAlternate,
  parseToBaseFactor,
} from '@/utils/warehouseUnitQuantity';
import {
  defaultProductLineIconHtml,
  resolveProductLineUnitLabel,
  resolveProductTypeName,
  resolveRetailPriceFormatted,
  resolveStockAlternateSummary,
} from '@/utils/productLineDisplayUtils';

export default {
  components: {
    ProductsCreatePage,
    SideModalDialog,
    PrimaryButton,
    CardViewEmptyState,
    DocumentProductLinesTable,
    FieldHint,
    ProductLineImage,
  },
  mixins: [notificationMixin],
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showQuantity: {
      type: Boolean,
      default: true,
    },
    showPrice: {
      type: Boolean,
      default: false,
    },
    showAmount: {
      type: Boolean,
      default: true,
    },
    showPriceType: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    isReceipt: {
      type: Boolean,
      default: false,
    },
    isPurchase: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    onlyProducts: {
      type: Boolean,
      default: false,
    },
    currencySymbol: {
      type: String,
      default: '',
    },
    documentCurrencyId: {
      type: [Number, String],
      default: null,
    },
    documentToDefaultFactor: {
      type: [Number, String],
      default: null,
    },
    exchangeRateDate: {
      type: [Number, String],
      default: null,
    },
    discount: {
      type: [Number, String],
      default: 0
    },
    discountType: {
      type: String,
      default: 'fixed'
    },
    amountRoundingScope: {
      type: String,
      default: 'default',
    },
    warehouseId: {
      type: [String, Number],
      default: null
    },
    projectId: {
      type: [String, Number],
      default: null
    },
    useAllProducts: {
      type: Boolean,
      default: false
    },
    allowTempProduct: {
      type: Boolean,
      default: false
    },
    allowAllWarehouseProducts: {
      type: Boolean,
      default: false
    },
    receiptWaybillCatalogProducts: {
      type: Array,
      default: () => [],
    },
    enableAlternateUnitQuantity: {
      type: Boolean,
      default: false,
    },
    waybillRemainingCapByProductId: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'update:discount', 'update:discountType', 'update:subtotal', 'update:totalPrice', 'product-removed'],
  data() {
    return {
      productSearch: '',
      productSearchLoading: false,
      productResults: [],
      searchAbortController: null,
      showDropdown: false,
      modalCreateProduct: false,
      defaultProductType: 'product',
      defaultProductName: '',
      warehouseProducts: [],
      warehouseProductsLoaded: false,
      searchMeta: null,
      searchLoadingMore: false,
      searchPerPage: 20,
      internalDocumentToDefaultFactor: 1,
    };
  },
  computed: {
    productCreateModalTitle() {
      return sideModalCrudTitle(this.$t.bind(this), {
        item: null,
        entityGenitiveKey: 'sideModalGenProduct',
        entityNominativeKey: 'sideModalNomProduct',
      });
    },
    products: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    subtotal() {
      const rawSubtotal = this.products.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        const qty = parseFloat(p.quantity) || 0;
        return sum + price * qty;
      }, 0);
      return roundValueForScope(rawSubtotal, this.amountRoundingScope);
    },
    discountAmount() {
      const sanitized = this.sanitizeDiscountValue(this.discount);
      if (!sanitized) {
        return 0;
      }

      let amount;
      if (this.discountType === 'percent') {
        amount = (this.subtotal * sanitized) / 100;
      } else {
        amount = sanitized;
      }
      amount = Math.min(amount, this.subtotal);

      return roundValueForScope(amount, this.amountRoundingScope);
    },
    totalPrice() {
      const total = this.subtotal - this.discountAmount;
      return roundValueForScope(total < 0 ? 0 : total, this.amountRoundingScope);
    },
    defaultCurrencySymbol() {
      const currencies = this.$store.state.currencies || [];
      const defaultCurrency = currencies.find(c => c.isDefault);
      return defaultCurrency ? defaultCurrency.symbol : this.$t('noCurrency');
    },
    isDocumentCurrencyDefault() {
      if (this.documentCurrencyId == null || this.documentCurrencyId === '') {
        return true;
      }
      const def = (this.$store.state.currencies || []).find((c) => c.isDefault);
      return !def || Number(def.id) === Number(this.documentCurrencyId);
    },
    showDocumentDefaultCurrencyHints() {
      return Boolean((this.isReceipt || this.isPurchase) && this.documentCurrencyId && !this.isDocumentCurrencyDefault);
    },
    warehouseLineInputMin() {
      return this.isPurchase || this.isReceipt ? 0 : 0.01;
    },
    warehouseLineShowsAmountColumn() {
      return this.isReceipt || this.isPurchase;
    },
    warehouseLineCurrencySymbol() {
      const sym = String(this.currencySymbol || '').trim();
      return sym || this.defaultCurrencySymbol;
    },
    warehouseLineShowsCurrencySuffix() {
      const usesLineCurrency = this.isReceipt || this.isPurchase || this.isSale;
      return usesLineCurrency && Boolean(String(this.warehouseLineCurrencySymbol || '').trim());
    },
    warehouseFieldPlaceholder() {
      return this.isPurchase || this.isReceipt ? '0' : undefined;
    },
    effectiveDocumentToDefaultFactor() {
      if (this.isDocumentCurrencyDefault) {
        return 1;
      }
      const propVal = Number(this.documentToDefaultFactor);
      if (
        this.documentToDefaultFactor != null
        && this.documentToDefaultFactor !== ''
        && Number.isFinite(propVal)
        && propVal > 1
      ) {
        return propVal;
      }
      const internal = Number(this.internalDocumentToDefaultFactor);
      return internal > 1 ? internal : 1;
    },
    discountLocal: {
      get() {
        return this.discount;
      },
      set(value) {
        this.emitSanitizedDiscount(value);
      }
    },
    discountTypeLocal: {
      get() {
        return this.discountType;
      },
      set(value) {
        this.$emit('update:discountType', value);
      }
    },
    receiptWaybillRestrictionActive() {
      return this.waybillRemainingCapByProductId != null
        || (Array.isArray(this.receiptWaybillCatalogProducts) && this.receiptWaybillCatalogProducts.length > 0);
    },
    receiptWaybillAllowedIds() {
      if (!this.receiptWaybillRestrictionActive) {
        return null;
      }
      return new Set(this.receiptWaybillCatalogProducts.map((p) => Number(p.id)));
    },
    isWarehouseProductsLoading() {
      return Boolean(
        this.warehouseId
        && !this.warehouseProductsLoaded
        && !this.receiptWaybillRestrictionActive,
      );
    },
    showAlternateUnitColumn() {
      return this.enableAlternateUnitQuantity && this.showQuantity;
    },
    showQuantityWithUnitColumn() {
      return this.showAlternateUnitColumn;
    },
    useSharedLinesTable() {
      return this.isSale && this.showQuantity && this.showPrice;
    },
    saleFooterSubtotalFormatted() {
      return formatCurrencyForDisplay(
        this.subtotal,
        this.currencySymbol,
        true,
      );
    },
    saleFooterTotalFormatted() {
      return formatCurrencyForDisplay(
        this.totalPrice,
        this.currencySymbol,
        true,
      );
    },
    saleFooterHasDiscount() {
      return this.discountAmount > 0;
    },
    lastProducts() {
      if (this.receiptWaybillRestrictionActive) {
        let products = this.receiptWaybillCatalogProducts;
        if (this.onlyProducts) {
          products = products.filter(p => Number(p.type) === 1);
        }
        return products;
      }
      if (this.warehouseId) {
        if (!this.warehouseProductsLoaded) {
          return [];
        }
        let products = this.warehouseProducts;
        if (this.onlyProducts) {
          products = products.filter(p => Number(p.type) === 1);
        }
        return products;
      }
      if (this.useAllProducts) {
        let products = this.$store.getters.allProducts;
        if (this.onlyProducts) {
          products = products.filter(p => Number(p.type) === 1);
        }
        return products;
      }
      return [];
    },
    canCreateTempProduct() {
      return this.$store.getters.hasPermission('products_create_temp');
    },
    showTempProductButton() {
      return this.allowTempProduct && !this.isReceipt && this.canCreateTempProduct;
    }
  },
  async created() {
    if (this.receiptWaybillRestrictionActive) {
      this.warehouseProductsLoaded = true;
      return;
    }
    if (this.warehouseId) {
      await this.loadWarehouseProducts();
    } else if (this.useAllProducts) {
      await this.$store.dispatch('loadAllProducts');
    }
  },
  methods: {
    async refreshDocumentToDefaultFactor() {
      const currencies = this.$store.state.currencies || [];
      this.internalDocumentToDefaultFactor = await fetchDocumentToDefaultFactor(
        this.documentCurrencyId,
        currencies,
        this.exchangeRateDate,
      );
    },
    clearStoredDefaultCurrency(product) {
      product.priceDefault = null;
      product.amountDefault = null;
    },
    linePriceInDefault(product) {
      if (!this.showDocumentDefaultCurrencyHints) {
        return null;
      }
      const fromDb = product.priceDefault != null && product.priceDefault !== ''
        ? Number(product.priceDefault)
        : null;
      if (fromDb != null && fromDb > 0) {
        return fromDb;
      }
      const price = Number(product.price) || 0;
      if (price <= 0) {
        return null;
      }
      return documentAmountToDefault(price, this.effectiveDocumentToDefaultFactor);
    },
    lineAmountInDefault(product) {
      if (!this.showDocumentDefaultCurrencyHints) {
        return null;
      }
      return resolveLineSubtotalInDefaultCurrency({
        amountDefault: product.amountDefault,
        lineSubtotalDefault: product.lineSubtotalDefault,
        unitPriceInDefault: this.linePriceInDefault(product),
        quantity: product.quantity,
        documentLineAmount: product.amount,
        factor: this.effectiveDocumentToDefaultFactor,
      });
    },
    showDefaultCurrencyHint(product, type = 'price') {
      if (!this.showDocumentDefaultCurrencyHints) {
        return false;
      }
      const val = type === 'amount'
        ? this.lineAmountInDefault(product)
        : this.linePriceInDefault(product);
      return val != null && Number(val) > 0;
    },
    lineDefaultCurrencyHintFromDb(product, type = 'price') {
      const val = type === 'amount'
        ? this.lineAmountInDefault(product)
        : this.linePriceInDefault(product);
      const formatted = formatCurrencyForDisplay(val, this.defaultCurrencySymbol, true);
      return this.$t('productSearchEquivDefaultCurrency', { amount: formatted });
    },
    alternateUnitSelectOptions(product) {
      const rows = this.catalogProductAlternateRows(product);
      const baseId = Number(product.unitId);
      if (!baseId) {
        return rows;
      }
      return rows.filter((r) => Number(r.unit_id) !== baseId);
    },
    lineHasUnitSelect(product) {
      if (this.disabled) {
        return false;
      }
      return 1 + this.alternateUnitSelectOptions(product).length > 1;
    },
    lineBaseUnitLabel(product) {
      const altId = product.alternateInputUnitId;
      if (altId != null && altId !== '') {
        const row = this.findStockByUnitRow(product, altId);
        if (row?.short_name) {
          return String(row.short_name).trim();
        }
        const opt = this.alternateUnitSelectOptions(product).find(
          (u) => Number(u.unit_id) === Number(altId),
        );
        if (opt?.short_name) {
          return String(opt.short_name).trim();
        }
      }
      const catalog = this.findCatalogProductById(product.productId ?? product.product_id);
      const merged = catalog
        ? {
          ...product,
          unitShortName: product.unitShortName ?? catalog.unitShortName ?? catalog.unit_short_name,
          unitId: product.unitId ?? catalog.unitId ?? catalog.unit_id,
        }
        : product;
      return resolveProductLineUnitLabel(
        merged,
        (id) => this.$store.getters.getUnitShortName(id),
      );
    },
    lineAlternateUnitSelectValue(product) {
      return product.alternateInputUnitId == null || product.alternateInputUnitId === ''
        ? ''
        : String(product.alternateInputUnitId);
    },
    lineBaseQuantityHint(product) {
      const q = Number(product.quantity) || 0;
      const unitLabel = this.lineBaseUnitLabel(product);
      const u = unitLabel === '—' ? '' : String(unitLabel).trim();
      return this.$t('productSearchEquivBase', {
        quantity: formatQuantity(q),
        unit: u ? ` ${u}` : '',
      });
    },
    lineShowsBaseQuantityHint(product) {
      if (!this.enableAlternateUnitQuantity) {
        return false;
      }
      return this.getLineToBaseFactor(product) !== 1;
    },
    lineQuantityGroupClasses(product) {
      return {
        'line-input-group--with-unit': this.showQuantityWithUnitColumn,
        'line-input-group--with-hint': this.enableAlternateUnitQuantity && this.lineShowsBaseQuantityHint(product),
      };
    },
    lineWarehouseMoneyGroupClasses(product, type = 'price') {
      return {
        'line-input-group--locked': Boolean(product.priceLocked),
        'line-input-group--with-suffix': this.warehouseLineShowsCurrencySuffix,
        'line-input-group--with-hint': this.showDefaultCurrencyHint(product, type),
      };
    },
    lineAlternateActive(product) {
      if (!this.enableAlternateUnitQuantity) {
        return false;
      }
      const baseId = Number(product.unitId);
      const altId = product.alternateInputUnitId != null && product.alternateInputUnitId !== ''
        ? Number(product.alternateInputUnitId)
        : null;
      return Boolean(baseId && altId && altId !== baseId);
    },
    refreshAlternateLine(product, altQty = null) {
      if (!this.lineAlternateActive(product)) {
        product.origUnitId = null;
        product.origQuantity = null;
        product.origUnitShortName = null;
        return;
      }
      const f = this.getLineToBaseFactor(product);
      product.origUnitId = Number(product.alternateInputUnitId);
      const row = this.findStockByUnitRow(product, product.alternateInputUnitId);
      product.origUnitShortName = row?.short_name ? String(row.short_name).trim() : null;
      product.origQuantity = altQty != null
        ? roundQuantityValue(altQty)
        : alternateFromBase(product.quantity, f);
      product.quantity = baseFromAlternate(product.origQuantity, f);
    },
    onLineAlternateUnitChange(product, raw) {
      product.alternateInputUnitId = raw === '' || raw == null ? null : Number(raw);
      if (!this.lineAlternateActive(product)) {
        product.origUnitId = null;
        product.origQuantity = null;
        product.origUnitShortName = null;
        return;
      }
      this.refreshAlternateLine(product);
    },
    findStockByUnitRow(product, alternateUnitId) {
      if (alternateUnitId == null || alternateUnitId === '') {
        return null;
      }
      const id = Number(alternateUnitId);
      return this.catalogProductAlternateRows(product).find((r) => Number(r.unit_id) === id) ?? null;
    },
    getLineToBaseFactor(product) {
      const row = this.findStockByUnitRow(product, product.alternateInputUnitId);
      return parseToBaseFactor(row?.to_base_factor);
    },
    lineQuantityInputModel(product) {
      if (!this.lineAlternateActive(product)) {
        return Number(product.quantity) || 0;
      }
      return Number(product.origQuantity) || 0;
    },
    onLineQuantityInput(product, v) {
      if (!this.lineAlternateActive(product)) {
        product.quantity = roundQuantityValue(Number(v) || 0);
        this.onQuantityChange(product);
        return;
      }
      const qBefore = product.quantity;
      this.refreshAlternateLine(product, Number(v) || 0);
      this.clampReceiptWaybillLineQuantity(product);
      if (product.quantity !== qBefore) {
        this.refreshAlternateLine(product);
      }
      this.clearStoredDefaultCurrency(product);
      this.calculateAmountFromPrice(product);
      this.updateTotals();
    },
    findCatalogProductById(productId) {
      const id = Number(productId);
      if (!id) {
        return null;
      }
      const localLists = [
        this.warehouseProducts,
        this.productResults,
        this.$store.getters.lastProducts,
        this.$store.getters.allProducts,
      ];
      for (const list of localLists) {
        if (!Array.isArray(list) || !list.length) {
          continue;
        }
        const found = list.find((p) => Number(p.id) === id);
        if (found) {
          return found;
        }
      }
      return null;
    },
    applyUnitFieldsFromCatalog(lineDto, catalogProduct = null) {
      const catalog = catalogProduct || this.findCatalogProductById(lineDto.productId ?? lineDto.product_id);
      if (!catalog) {
        return;
      }
      const unitId = catalog.unitId ?? catalog.unit_id;
      const unitShort = catalog.unitShortName ?? catalog.unit_short_name;
      if (unitId != null && unitId !== '' && (lineDto.unitId == null || lineDto.unitId === '')) {
        lineDto.unitId = unitId;
      }
      if (unitShort && !lineDto.unitShortName) {
        lineDto.unitShortName = unitShort;
      }
    },
    catalogProductAlternateRows(catalogProduct) {
      const alt = catalogProduct.alternateUnitOptions;
      if (alt && alt.length) {
        return alt;
      }
      return catalogProduct.stockByUnits || [];
    },
    applyLineAlternateUnitsFromProduct(lineDto, catalogProduct) {
      if (!this.enableAlternateUnitQuantity || !catalogProduct) {
        return;
      }
      const rows = this.catalogProductAlternateRows(catalogProduct);
      if (rows.length) {
        lineDto.stockByUnits = rows.map((r) => ({
          unit_id: r.unit_id,
          short_name: r.short_name,
          quantity: r.quantity,
          to_base_factor: r.to_base_factor,
        }));
      }
      lineDto.alternateInputUnitId = null;
      lineDto.origUnitId = null;
      lineDto.origQuantity = null;
      lineDto.origUnitShortName = null;
    },
    onProductSearchFocus() {
      this.showDropdown = true;
    },
    sanitizeDiscountValue(value) {
      const numeric = Number(value) || 0;
      const nonNegative = numeric < 0 ? 0 : numeric;

      if (this.discountType === 'percent') {
        return Math.min(nonNegative, 100);
      }

      if (this.subtotal <= 0) {
        return 0;
      }

      return Math.min(nonNegative, this.subtotal);
    },
    emitSanitizedDiscount(value = this.discount) {
      const sanitized = this.sanitizeDiscountValue(value);
      if (sanitized !== this.discount) {
        this.$emit('update:discount', sanitized);
      }
      return sanitized;
    },
    warehouseListParams() {
      const params = { warehouseId: this.warehouseId };
      if (this.allowAllWarehouseProducts) {
        params.warehouseStockPolicy = 'all';
      }
      return params;
    },
    async loadWarehouseProducts() {
      const limit = 50;
      this.warehouseProductsLoaded = false;
      const params = this.warehouseListParams();
      try {
        if (this.onlyProducts) {
          const results = await ProductController.getItems(1, true, params, limit);
          this.warehouseProducts = results.items || [];
        } else {
          const half = Math.ceil(limit / 2);
          const other = Math.max(1, limit - half);
          const [prodRes, servRes] = await Promise.all([
            ProductController.getItems(1, true, params, half),
            ProductController.getItems(1, false, params, other),
          ]);
          const pItems = prodRes.items || [];
          const sItems = servRes.items || [];
          const merged = [...pItems, ...sItems].sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || 0).getTime();
            return tb - ta;
          }).slice(0, limit);
          this.warehouseProducts = merged;
        }
        this.warehouseProductsLoaded = true;
      } catch (error) {
        console.error('[ProductSearch] loadWarehouseProducts error', error);
        this.warehouseProducts = [];
        this.warehouseProductsLoaded = true;
      }
    },
    searchProducts: debounce(async function () {
      if (this.productSearch.length >= 3) {
        if (this.searchAbortController) {
          this.searchAbortController.abort();
        }
        this.searchAbortController = new AbortController();
        const signal = this.searchAbortController.signal;
        this.productSearchLoading = true;
        this.searchMeta = null;
        try {
          const { items, meta } = await ProductController.search(
            this.productSearch,
            this.onlyProducts ? true : null,
            this.warehouseId,
            signal,
            this.allowAllWarehouseProducts ? 'all' : null,
            1,
            this.searchPerPage
          );
          if (signal.aborted) return;

          let products = items;

          if (this.onlyProducts) {
            products = products.filter(p => Number(p.type) === 1);
          }

          this.productResults = this.filterProductsToReceiptWaybillCatalog(products);
          this.searchMeta = meta;
        } catch (error) {
          if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
          this.productResults = [];
          this.searchMeta = null;
        } finally {
          if (!signal.aborted) this.productSearchLoading = false;
        }
      } else {
        this.productResults = [];
        this.searchMeta = null;
      }
    }, 250),
    onResultsScroll(e) {
      const el = e.target;
      if (this.productSearch.length < 3 || this.productSearchLoading || this.searchLoadingMore) return;
      if (!this.searchMeta || this.searchMeta.current_page >= this.searchMeta.last_page) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 56) return;
      this.loadMoreSearchResults();
    },
    async loadMoreSearchResults() {
      if (this.productSearch.length < 3 || this.productSearchLoading || this.searchLoadingMore) return;
      if (!this.searchMeta || this.searchMeta.current_page >= this.searchMeta.last_page) return;
      const nextPage = this.searchMeta.current_page + 1;
      this.searchLoadingMore = true;
      try {
        const { items, meta } = await ProductController.search(
          this.productSearch,
          this.onlyProducts ? true : null,
          this.warehouseId,
          null,
          this.allowAllWarehouseProducts ? 'all' : null,
          nextPage,
          this.searchPerPage
        );
        let products = items;
        if (this.onlyProducts) {
          products = products.filter(p => Number(p.type) === 1);
        }
        const merged = this.filterProductsToReceiptWaybillCatalog(products);
        this.productResults = [...this.productResults, ...merged];
        this.searchMeta = meta;
      } finally {
        this.searchLoadingMore = false;
      }
    },
    filterProductsToReceiptWaybillCatalog(products) {
      const allowed = this.receiptWaybillAllowedIds;
      if (!allowed || !Array.isArray(products)) {
        return products;
      }
      return products.filter((p) => allowed.has(Number(p.id)));
    },
    clampReceiptWaybillLineQuantity(product) {
      if (!this.receiptWaybillRestrictionActive || !this.waybillRemainingCapByProductId || !this.isReceipt) {
        return;
      }
      const pid = Number(product.productId);
      const cap = this.waybillRemainingCapByProductId[pid];
      if (cap === undefined || cap === null) {
        return;
      }
      const idx = this.products.indexOf(product);
      const othersInForm = this.products.reduce((s, p, i) => {
        if (i === idx) {
          return s;
        }
        return Number(p.productId) === pid ? s + (Number(p.quantity) || 0) : s;
      }, 0);
      const maxLine = Math.max(0, Number(cap) - othersInForm);
      const q = Number(product.quantity) || 0;
      if (q > maxLine) {
        product.quantity = maxLine;
      }
    },
    async selectProduct(product) {
      try {
        this.showDropdown = false;
        this.productSearch = '';
        this.productResults = [];
        this.searchMeta = null;

        const allowedSet = this.receiptWaybillAllowedIds;
        if (allowedSet && !allowedSet.has(Number(product.id))) {
          const messageKey = this.waybillRemainingCapByProductId != null
            ? 'purchaseReceiptProductNotAvailable'
            : 'waybillProductNotInReceiptClient';
          this.showNotification(this.$t(messageKey), '', true);
          return;
        }

        const productId = Number(product.id);
        const existing = this.products.find((p) => Number(p.productId ?? p.product_id) === productId);
        if (existing && (this.isSale || this.isPurchase)) {
          this.applyUnitFieldsFromCatalog(existing, product);
          existing.quantity = (Number(existing.quantity) || 0) + 1;
          if (this.isReceipt || this.isPurchase) {
            existing.amount = (Number(existing.quantity) || 0) * (Number(existing.price) || 0);
          }
          this.clampReceiptWaybillLineQuantity(existing);
          this.updateTotals();
          this.$refs.productInput.blur();
          return;
        } else {
          let productDto;
          if (this.isPurchase) {
            productDto = WarehousePurchaseProductDto.fromProductDto(product, true);
          } else if (this.isReceipt) {
            productDto = WarehouseReceiptProductDto.fromProductDto(product, true);
          } else if (this.showPrice && (this.isSale && !this.showPriceType || !this.isSale)) {
            productDto = OrderProductDto.fromProductDto(product, true);
            const retailPrice = Number(product.retailPrice) || 0;
            const wholesalePrice = Number(product.wholesalePrice) || 0;
            let mult = 1;
            if (this.documentCurrencyId) {
              mult = await catalogToDocumentMultiplier(
                this.documentCurrencyId,
                this.$store.state.currencies || []
              );
            }
            productDto.retailPrice = roundValue(retailPrice * mult);
            productDto.wholesalePrice = roundValue(wholesalePrice * mult);
            productDto.price = (this.projectId && wholesalePrice > 0) ? productDto.wholesalePrice : productDto.retailPrice;
          } else if (this.isSale && this.showPriceType) {
            productDto = SaleProductDto.fromProductDto(product, true);
            productDto.retailPrice = product.retailPrice || 0;
            productDto.wholesalePrice = product.wholesalePrice || 0;
            if (this.projectId && productDto.wholesalePrice > 0) {
              productDto.priceType = 'wholesale';
              productDto.price = productDto.wholesalePrice;
            } else {
              productDto.priceType = 'retail';
              productDto.price = productDto.retailPrice;
            }
          } else {
            productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
            if (this.showPriceType) {
              productDto.priceType = 'purchase';
            }
          }
          if (productDto && product.id) {
            productDto.productId = product.id;
          }
          if (product?.priceLocked === true) {
            productDto.priceLocked = true;
          }
          if (this.isReceipt || this.isPurchase) {
            productDto.amount = (Number(productDto.quantity) || 0) * (Number(productDto.price) || 0);
          }
          this.applyUnitFieldsFromCatalog(productDto, product);
          this.applyLineAlternateUnitsFromProduct(productDto, product);
          this.products = [...this.products, productDto];
          this.clampReceiptWaybillLineQuantity(productDto);
        }
        this.updateTotals();
        this.$refs.productInput.blur();
      } catch (error) {
        console.error('[ProductSearch] selectProduct failed', {
          productId: product?.id,
          productName: product?.name,
          isReceipt: this.isReceipt,
          isSale: this.isSale,
          error,
        });
        this.showNotification(this.$t('error'), error?.message || String(error), true);
      }
    },
    calculateAmountFromPrice(product) {
      if ((this.isReceipt || this.isPurchase) && product.quantity && product.quantity > 0 && product.price) {
        product.amount = (Number(product.price) || 0) * (Number(product.quantity) || 0);
      }
    },
    onPriceTypeChange(product) {
      if (this.isSale || (this.showPrice && product.retailPrice !== undefined && product.wholesalePrice !== undefined)) {
        if (product.priceType === 'retail') {
          product.price = product.retailPrice || 0;
        } else if (product.priceType === 'wholesale') {
          product.price = product.wholesalePrice || 0;
        } else if (product.priceType === 'purchase') {
          product.price = product.purchasePrice || 0;
        }
        this.updateTotals();
      }
    },
    onPriceChange(product, priceValue) {
      if (priceValue !== undefined && priceValue !== null) {
        product.price = Number(priceValue) || 0;
      }
      this.clearStoredDefaultCurrency(product);
      this.calculateAmountFromPrice(product);
      this.updateTotals();
    },
    onAmountChange(product, amountValue) {
      if (amountValue !== undefined && amountValue !== null) {
        product.amount = Number(amountValue) || 0;
      }
      if ((this.isReceipt || this.isPurchase || this.isSale) && product.quantity && product.quantity > 0) {
        product.price = (Number(product.amount) || 0) / (Number(product.quantity) || 1);
      }
      this.clearStoredDefaultCurrency(product);
      this.updateTotals();
    },
    onQuantityChange(product) {
      this.clampReceiptWaybillLineQuantity(product);
      product.quantity = roundQuantityValue(Number(product.quantity) || 0);
      this.clearStoredDefaultCurrency(product);
      this.calculateAmountFromPrice(product);
      this.updateTotals();
    },
    removeSelectedProduct(id) {
      const removedProduct = this.products.find(p => p.productId === id);

      this.products = this.products.filter(p => p.productId !== id);
      this.updateTotals();

      this.$emit('product-removed', {
        id,
        wasTempProduct: removedProduct?.isTempProduct,
        name: removedProduct?.name,
        orderProductId: removedProduct?.orderProductId || null
      });
    },
    handleBlur() {
      requestAnimationFrame(() => {
        this.showDropdown = false;
      });
    },
    updateTotals() {
      this.emitSanitizedDiscount(this.discount);
      this.$emit('update:discountType', this.discountType);
      this.$emit('update:subtotal', this.subtotal);
      this.$emit('update:totalPrice', this.totalPrice);
    },
    createTempProductQuick() {
      const name = (this.productSearch).trim();
      if (!name) return;
      this.showDropdown = false;
      const tempItem = {
        name,
        productName: name,
        description: '',
        quantity: 1,
        price: 0,
        unitId: null,
        productId: Date.now() + Math.floor(Math.random() * 1000),
        isTempProduct: true,
        icons() { return '<i class="fas fa-bolt text-[#EAB308]"></i>'; }
      };
      this.products = [...this.products, tempItem];
      this.productSearch = '';
      this.productResults = [];
      this.searchMeta = null;
      this.updateTotals();
      if (this.$refs.productInput) this.$refs.productInput.blur();
    },
    openCreateProductModal() {
      this.defaultProductType = this.onlyProducts ? 'product' : 'service';
      this.defaultProductName = this.productSearch;
      this.modalCreateProduct = true;
    },
    async onProductCreated(newProduct) {
      this.modalCreateProduct = false;
      if (newProduct) {
        await this.selectProduct(newProduct);
      }
    },
    onProductCreatedError(error) {
      this.showNotification(this.$t('errorCreatingProduct'), error, true);
    },
    defaultProductLineIconHtml,
    dropdownProductTypeName(product) {
      return resolveProductTypeName(product);
    },
    dropdownRetailPriceFormatted(product) {
      return resolveRetailPriceFormatted(product);
    },
    dropdownStockAlternateSummary(product) {
      return resolveStockAlternateSummary(product);
    },
  },
  watch: {
    documentCurrencyId: {
      handler() {
        this.refreshDocumentToDefaultFactor();
      },
      immediate: true,
    },
    exchangeRateDate() {
      this.refreshDocumentToDefaultFactor();
    },
    documentToDefaultFactor(val) {
      const propVal = Number(val);
      if (val != null && val !== '' && Number.isFinite(propVal) && propVal > 1) {
        this.internalDocumentToDefaultFactor = propVal;
        return;
      }
      this.refreshDocumentToDefaultFactor();
    },
    productSearch: {
      handler: 'searchProducts',
      immediate: true,
    },
    warehouseId: {
      async handler(newWarehouseId, oldWarehouseId) {
        if (this.receiptWaybillRestrictionActive) {
          return;
        }
        if (newWarehouseId !== oldWarehouseId) {
          if (newWarehouseId) {
            await this.loadWarehouseProducts();
          } else {
            this.warehouseProducts = [];
            this.warehouseProductsLoaded = true;
          }
          if (this.productSearch.length >= 3) {
            this.searchProducts();
          }
        }
      },
    },
    projectId: {
      handler(newProjectId, oldProjectId) {
        if (newProjectId !== oldProjectId && this.showPrice && !this.isReceipt) {
          this.products.forEach(product => {
            if (product.retailPrice !== undefined && product.wholesalePrice !== undefined) {
              if (newProjectId && product.wholesalePrice > 0) {
                product.price = product.wholesalePrice;
              } else {
                product.price = product.retailPrice;
              }
            }
          });
          this.updateTotals();
        }
      },
      immediate: false
    },
    discountType: {
      handler() {
        this.emitSanitizedDiscount();
      },
      immediate: true,
    },
    subtotal(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.emitSanitizedDiscount();
      }
    },
  },
};
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
  transform: scaleY(0);
  opacity: 0;
  transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
  transform: scaleY(1);
  opacity: 1;
  transform-origin: top;
}
</style>