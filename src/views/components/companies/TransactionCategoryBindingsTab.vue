<template>
  <div class="rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
    <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
      {{ $t("transactionCategoryBindings") }}
    </h3>
    <div class="space-y-3">
      <div
        v-for="group in bindingGroups"
        :key="group.id"
        class="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-start"
      >
        <div class="flex items-start gap-2 pt-2 text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="shrink-0" aria-hidden="true">{{ scenarioTypeIcon(group) }}</span>
          <span>{{ $t(group.label) }}</span>
        </div>
        <TransactionCategorySearch
          :model-value="groupCategoryId(group)"
          :categories="categoriesForGroup(group)"
          :disabled="disabled"
          :allow-empty="!disabled"
          :show-label="false"
          @update:model-value="onGroupCategoryChange(group, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TransactionCategorySearch from "@/views/components/transactions/TransactionCategorySearch.vue";
import {
  TRANSACTION_CATEGORY_BINDING_UI_GROUPS,
  applyBindingGroupCategoryId,
  filterCategoriesForBindingGroup,
  resolveBindingGroupCategoryId,
} from "@/constants/transactionCategoryBindings";
import { getBindingScenarioTypeIcon } from "@/utils/transactionCategoryUtils";

export default {
  components: { TransactionCategorySearch },
  props: {
    modelValue: {
      type: Object,
      default: () => ({}),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      bindingGroups: TRANSACTION_CATEGORY_BINDING_UI_GROUPS,
    };
  },
  computed: {
    categories() {
      const items = this.$store.getters.transactionCategories;
      return Array.isArray(items) ? items : [];
    },
  },
  async mounted() {
    if (this.categories.length === 0) {
      await this.$store.dispatch("loadTransactionCategories");
    }
  },
  methods: {
    scenarioTypeIcon(group) {
      return getBindingScenarioTypeIcon(group.categoryType);
    },
    groupCategoryId(group) {
      return resolveBindingGroupCategoryId(this.modelValue, group);
    },
    categoriesForGroup(group) {
      return filterCategoriesForBindingGroup(
        this.categories,
        group,
        this.groupCategoryId(group),
      );
    },
    onGroupCategoryChange(group, categoryId) {
      if (this.disabled) {
        return;
      }
      this.$emit(
        "update:modelValue",
        applyBindingGroupCategoryId(this.modelValue, group, categoryId),
      );
    },
  },
};
</script>
