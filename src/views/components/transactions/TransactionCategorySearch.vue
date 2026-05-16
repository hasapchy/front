<template>
  <div class="relative w-full">
    <AppFieldPicker
      ref="root"
      :has-selection="selectedCategory != null"
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
          <AppFieldPickerOption
            v-for="cat in searchResults"
            :key="cat.id"
            :class="{ 'app-field-picker__option--selected': isSelected(cat) }"
            :primary="formatTransactionCategoryLabel(cat, $t)"
            :disabled="isCategoryOptionDisabled(cat)"
            @select="selectCategory(cat)"
          />
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
            >
              <button
                v-if="childrenOf(root.id).length"
                type="button"
                class="app-field-picker__tree-expand"
                @mousedown.prevent.stop="toggleExpand(root.id)"
              >
                <i
                  class="fas fa-chevron-right text-[10px] transition-transform"
                  :class="isExpanded(root.id) ? 'rotate-90' : ''"
                />
              </button>
              <div
                class="app-field-picker__option min-w-0 flex-1"
                :class="{
                  'pointer-events-none opacity-40': isCategoryOptionDisabled(root),
                }"
                @mousedown.prevent="!isCategoryOptionDisabled(root) && selectCategory(root)"
              >
                <div class="app-field-picker__option-row">
                  <span class="app-field-picker__option-primary">
                    {{ formatTransactionCategoryLabel(root, $t) }}
                  </span>
                </div>
              </div>
            </div>
            <ul
              v-if="isExpanded(root.id)"
              class="app-field-picker__tree-children"
            >
              <AppFieldPickerOption
                v-for="child in childrenOf(root.id)"
                :key="child.id"
                :class="{ 'app-field-picker__option--selected': isSelected(child) }"
                :primary="formatTransactionCategoryLabel(child, $t)"
                :disabled="isCategoryOptionDisabled(child)"
                @select="selectCategory(child)"
              />
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
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';
import {
    formatTransactionCategoryLabel,
    searchTransactionCategoriesLocal,
} from '@/utils/transactionCategoryUtils';

const SEARCH_MIN_LENGTH = 2;

export default {
    name: 'TransactionCategorySearch',
    components: { AppFieldPicker, AppFieldPickerOption },
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
        selectedCategory() {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return null;
            }
            return this.categories.find((c) => c.id == v) || null;
        },
        selectedCategoryLabel() {
            return formatTransactionCategoryLabel(this.selectedCategory, this.$t);
        },
        rootCategories() {
            return this.categories.filter((c) => !c.parentId);
        },
        isSearchActive() {
            return this.categorySearch.trim().length > 0;
        },
        searchResults() {
            if (!this.isSearchActive) {
                return [];
            }
            return searchTransactionCategoriesLocal(
                this.categories,
                this.categorySearch,
                this.$t,
            );
        },
    },
    methods: {
        formatTransactionCategoryLabel,
        isSelected(cat) {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return false;
            }
            return cat.id == v;
        },
        isCategoryOptionDisabled(cat) {
            return this.disabled || (this.disableCategory && this.disableCategory(cat));
        },
        childrenOf(parentId) {
            return this.categories.filter((c) => c.parentId == parentId);
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
        handleFocus() {
            this.open = true;
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
