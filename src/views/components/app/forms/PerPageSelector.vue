<template>
  <div class="flex items-center">
    <select
      v-model="selectedPerPage"
      class="per-page-select min-h-9 w-auto min-w-fit cursor-pointer rounded border border-solid border-gray-300 bg-white text-center text-sm text-black transition duration-300 focus:border-gray-300 focus:outline-none focus:shadow-outline hover:bg-gray-300/50"
      @change="handlePerPageChange"
    >
      <option
        v-for="option in perPageOptions"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
    name: 'PerPageSelector',
    props: {
        perPage: {
            type: Number,
            default: 20
        },
        perPageOptions: {
            type: Array,
            default: () => [20, 50]
        },
        storageKey: {
            type: String,
            default: 'perPage'
        }
    },
    emits: ['perPageChange'],
    data() {
        return {
            selectedPerPage: this.perPage
        };
    },
    watch: {
        perPage(newVal) {
            this.selectedPerPage = newVal;
        }
    },
    methods: {
        handlePerPageChange() {
            this.$emit('perPageChange', this.selectedPerPage);
        }
    }
}
</script>

<style scoped>
.per-page-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: none;
    box-shadow: none;
    border-width: 1px;
    border-style: solid;
    text-align: center;
    text-align-last: center;
    padding: 0.5rem 0.75rem;
}

.per-page-select::-ms-expand {
    display: none;
}
</style>
