<template>
  <div class="flex items-center">
    <select
      v-model="selectedPerPage"
      class="pagination-per-page-select"
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
