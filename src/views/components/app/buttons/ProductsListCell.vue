<template>
  <ul v-if="displayProducts.length > 0">
    <li
      v-for="(product, index) in displayProducts"
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
      <span>{{ productName(product) }} — {{ lineQtyLabel(product) }}</span>
    </li>
    <li
      v-if="hasMore"
      class="text-gray-600 italic"
    >
      ... и еще {{ totalCount - maxItems }}
    </li>
  </ul>
  <span v-else>-</span>
</template>

<script>
import ProductLineImage from '@/views/components/app/ProductLineImage.vue';
import { formatQuantity } from '@/utils/numberUtils';
import { formatLineOrigThenBaseQty } from '@/utils/warehouseLineOrigDisplay';

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
            default: null
        }
    },
    computed: {
        totalCount() {
            return this.products?.length || 0;
        },
        displayProducts() {
            if (!this.products?.length) return [];
            if (this.maxItems != null && this.maxItems > 0) {
                return this.products.slice(0, this.maxItems);
            }
            return this.products;
        },
        hasMore() {
            return this.maxItems != null && this.maxItems > 0 && this.totalCount > this.maxItems;
        }
    },
    methods: {
        quantity(product) {
            const q = product.quantity;
            return this.getQuantityFn ? this.getQuantityFn(q) : formatQuantity(q);
        },
        unitName(product) {
            return product.unitShortName ;
        },
        productName(product) {
            return product.productName ;
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


