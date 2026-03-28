<template>
  <div class="flex items-center">
    <select
      v-model="selectedPerPage"
      class="px-2 py-1 pr-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none w-auto min-w-fit cursor-pointer"
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
select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: none;
    padding-right: 0.5rem;
    width: auto;
    min-width: fit-content;
}
</style>
