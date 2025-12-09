<template>
    <ul v-if="displayProducts.length > 0">
        <li v-for="(product, index) in displayProducts" :key="index" class="flex items-center gap-2.5">
            <img v-if="product.productImage && product.imgUrl" 
                 :src="product.imgUrl()" 
                 alt="" 
                 width="20" 
                 height="20"
                 class="rounded" />
            <span>{{ productName(product) }} - {{ quantity(product) }}{{ unitName(product) }}</span>
        </li>
        <li v-if="hasMore" class="text-gray-600 italic">
            ... и еще {{ totalCount - maxItems }}
        </li>
    </ul>
    <span v-else>-</span>
</template>

<script>
export default {
    name: 'ProductsListCell',
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
            return this.getQuantityFn ? this.getQuantityFn(product.quantity) : product.quantity;
        },
        unitName(product) {
            return product.unitShortName || product.unitName || '';
        },
        productName(product) {
            return product.productName || '';
        }
    }
}
</script>


