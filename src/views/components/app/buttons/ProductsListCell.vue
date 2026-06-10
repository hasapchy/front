<template>
  <ul v-if="totalCount > 0">
    <li
      v-for="(product, index) in visibleProducts"
      :key="index"
      class="flex items-center gap-2.5"
    >
      <ProductLineImage
        :item="product"
        img-class="rounded object-cover"
        wrapper-class="w-5 h-5"
        width="20"
        height="20"
        :with-icon-fallback="false"
      />
      <span><span v-html="highlightedProductName(product)" /> — {{ lineQtyLabel(product) }}</span>
    </li>
    <li v-if="showToggle">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-medium text-[var(--nav-accent)] transition-opacity hover:opacity-80 focus:outline-none dark:text-[var(--label-accent)]"
        @click.stop="toggleExpanded"
      >
        <span>{{ toggleLabel }}</span>
        <i
          class="fas text-[10px] opacity-80"
          :class="expanded ? 'fa-chevron-up' : 'fa-chevron-down'"
        />
      </button>
    </li>
  </ul>
  <span v-else>-</span>
</template>

<script>
import ProductLineImage from '@/views/components/app/ProductLineImage.vue';
import { formatQuantity } from '@/utils/numberUtils';
import { formatLineOrigThenBaseQty } from '@/utils/warehouseLineOrigDisplay';
import { highlightMatches } from '@/utils/searchUtils';

export const PRODUCTS_LIST_CELL_DEFAULT_MAX = 3;

export default {
    name: 'ProductsListCell',
    components: { ProductLineImage },
    props: {
        products: {
            type: Array,
            default: () => []
        },
        getQuantityFn: {
            type: Function,
            default: null
        },
        maxItems: {
            type: Number,
            default: PRODUCTS_LIST_CELL_DEFAULT_MAX
        },
        searchQuery: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            expanded: false
        };
    },
    computed: {
        totalCount() {
            return this.products?.length || 0;
        },
        effectiveLimit() {
            if (this.maxItems <= 0) {
                return null;
            }
            return this.maxItems;
        },
        visibleProducts() {
            if (!this.products?.length) {
                return [];
            }
            if (!this.effectiveLimit || this.expanded) {
                return this.products;
            }
            return this.products.slice(0, this.effectiveLimit);
        },
        showToggle() {
            return this.effectiveLimit != null && this.totalCount > this.effectiveLimit;
        },
        toggleLabel() {
            return this.expanded ? this.$t('collapse') : this.$t('showAll');
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        quantity(product) {
            const q = product.quantity;
            return this.getQuantityFn ? this.getQuantityFn(q) : formatQuantity(q);
        },
        unitName(product) {
            return product.unitShortName;
        },
        productName(product) {
            return product.productName;
        },
        highlightedProductName(product) {
            const name = this.productName(product) || '';
            const query = this.searchQuery?.trim();
            return query ? highlightMatches(name, query) : name;
        },
        lineQtyLabel(product) {
            const dual = formatLineOrigThenBaseQty(product);
            if (dual) {
                return dual;
            }
            return `${this.quantity(product)}${this.unitName(product) ? ` ${this.unitName(product)}` : ''}`;
        },
    }
}
</script>
