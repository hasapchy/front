<template>
  <div class="relative w-full">
    <AppFieldPicker
      ref="root"
      :has-selection="selectedCategory != null"
      inline-selected
      :inline-selected-value="selectedCategoryLabel"
      :show-label="showLabel"
      :label="$t('category')"
      :required="required"
      :disabled="disabled"
      :allow-deselect="allowEmpty"
      :dropdown-open="open"
      :search-value="categorySearch"
      :placeholder="placeholder || $t('searchTransactionCategoryByName')"
      @update:search-value="categorySearch = $event"
      @focus="handleFocus"
      @blur="handleBlur"
      @deselect="clearSelection"
    >
      <template #dropdown>
        <template v-if="isSearchActive">
          <li
            v-if="categorySearch.trim().length < searchMinLength"
            class="app-field-picker__message"
          >
            {{ $t('minimum2Characters') }}
          </li>
          <li
            v-else-if="searchResults.length === 0"
            class="app-field-picker__message"
          >
            {{ $t('notFound') }}
          </li>
          <li
            v-for="cat in searchResults"
            :key="cat.id"
            class="app-field-picker__option"
            :class="{
              'app-field-picker__option--selected': isSelected(cat),
              'pointer-events-none opacity-40': isCategoryOptionDisabled(cat),
            }"
            @mousedown.prevent="!isCategoryOptionDisabled(cat) && selectCategory(cat)"
          >
            <span class="app-field-picker__option-primary">
              {{ categoryOptionLabel(cat) }}
            </span>
          </li>
        </template>
        <template v-else>
          <li
            v-for="root in rootCategories"
            :key="root.id"
            class="app-field-picker__tree-group"
          >
            <div
              class="app-field-picker__tree-row"
              :class="{ 'app-field-picker__option--selected': isSelected(root) }"
              @mousedown.prevent="onRootClick(root)"
            >
              <span
                v-if="childrenOf(root.id).length"
                class="app-field-picker__tree-expand pointer-events-none"
              >
                <i
                  class="fas fa-chevron-right text-[10px] transition-transform"
                  :class="isExpanded(root.id) ? 'rotate-90' : ''"
                />
              </span>
              <div
                class="app-field-picker__option min-w-0 flex-1"
                :class="{ 'opacity-40': isCategoryOptionDisabled(root) && !childrenOf(root.id).length }"
              >
                <span class="app-field-picker__option-primary app-field-picker__tree-root-label">
                  {{ formatTransactionCategoryLabel(root, $t) }}
                </span>
              </div>
            </div>
            <ul
              v-if="isExpanded(root.id)"
              class="app-field-picker__tree-children"
            >
              <li
                v-for="child in childrenOf(root.id)"
                :key="child.id"
                class="app-field-picker__option"
                :class="{
                  'app-field-picker__option--selected': isSelected(child),
                  'pointer-events-none opacity-40': isCategoryOptionDisabled(child),
                }"
                @mousedown.prevent="!isCategoryOptionDisabled(child) && selectCategory(child)"
              >
                <span class="app-field-picker__option-primary app-field-picker__tree-child-label">
                  {{ formatTransactionCategoryLabel(child, $t) }}
                </span>
              </li>
            </ul>
          </li>
        </template>
      </template>
      <template #selected>
        <p class="app-field-picker__selected-line">
          {{ selectedCategoryLabel }}
        </p>
      </template>
    </AppFieldPicker>
    <input
      v-if="required"
      :value="modelValue == null || modelValue === '' ? '' : String(modelValue)"
      required
      class="pointer-events-none absolute h-0 w-0 opacity-0"
      tabindex="-1"
    >
  </div>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import {
    formatTransactionCategoryLabel,
    getTransactionCategoryLabelWithParent,
    isTransactionCategorySelectable,
    resolveTransactionCategoryParentId,
    searchTransactionCategoriesLocal,
} from '@/utils/transactionCategoryUtils';

const SEARCH_MIN_LENGTH = 2;

export default {
    name: 'TransactionCategorySearch',
    components: { AppFieldPicker },
    props: {
        modelValue: { type: [String, Number, null], default: null },
        categories: { type: Array, default: () => [] },
        disabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
        allowEmpty: { type: Boolean, default: false },
        showLabel: { type: Boolean, default: false },
        placeholder: { type: String, default: '' },
        disableCategory: { type: Function, default: null },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            open: false,
            categorySearch: '',
            expandedRootIds: [],
            searchMinLength: SEARCH_MIN_LENGTH,
        };
    },
    computed: {
        currentCategoryId() {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return null;
            }
            const parsed = Number(v);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        },
        selectableIncludeIds() {
            return this.currentCategoryId ? [this.currentCategoryId] : [];
        },
        selectedCategory() {
            if (!this.currentCategoryId) {
                return null;
            }
            return this.categories.find((c) => c.id == this.currentCategoryId) || null;
        },
        selectedCategoryLabel() {
            return formatTransactionCategoryLabel(this.selectedCategory, this.$t);
        },
        isSearchActive() {
            return this.categorySearch.trim().length > 0;
        },
        rootCategories() {
            return this.categories.filter((c) => resolveTransactionCategoryParentId(c) == null);
        },
        searchResults() {
            if (!this.isSearchActive) {
                return [];
            }
            return searchTransactionCategoriesLocal(
                this.categories,
                this.categorySearch,
                this.$t,
                null,
            );
        },
    },
    methods: {
        formatTransactionCategoryLabel,
        childrenOf(parentId) {
            const pid = Number(parentId);
            return this.categories.filter(
                (c) => resolveTransactionCategoryParentId(c) === pid,
            );
        },
        categoryOptionLabel(cat) {
            return getTransactionCategoryLabelWithParent(cat, this.categories, this.$t);
        },
        isSelected(cat) {
            if (!this.currentCategoryId) {
                return false;
            }
            return cat.id == this.currentCategoryId;
        },
        isCategoryOptionDisabled(cat) {
            if (this.disabled) {
                return true;
            }
            if (this.disableCategory && this.disableCategory(cat)) {
                return true;
            }
            return !isTransactionCategorySelectable(
                cat,
                this.categories,
                this.selectableIncludeIds,
            );
        },
        isExpanded(rootId) {
            return this.expandedRootIds.includes(rootId);
        },
        toggleExpand(rootId) {
            const i = this.expandedRootIds.indexOf(rootId);
            if (i === -1) {
                this.expandedRootIds.push(rootId);
            } else {
                this.expandedRootIds.splice(i, 1);
            }
        },
        onRootClick(root) {
            if (this.childrenOf(root.id).length) {
                this.toggleExpand(root.id);
                return;
            }
            if (!this.isCategoryOptionDisabled(root)) {
                this.selectCategory(root);
            }
        },
        expandForCurrentValue() {
            const parentId = resolveTransactionCategoryParentId(this.selectedCategory);
            if (parentId && !this.expandedRootIds.includes(parentId)) {
                this.expandedRootIds.push(parentId);
            }
        },
        handleFocus() {
            this.open = true;
            this.expandForCurrentValue();
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.open = false;
            });
        },
        selectCategory(cat) {
            if (this.isCategoryOptionDisabled(cat)) {
                return;
            }
            this.$emit('update:modelValue', cat.id);
            this.open = false;
            this.categorySearch = '';
        },
        clearSelection() {
            this.$emit('update:modelValue', '');
            this.categorySearch = '';
            this.open = false;
        },
    },
};
</script>
