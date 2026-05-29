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
          <AppFieldPickerOption
            v-for="cat in pickerCategories"
            :key="cat.id"
            :class="{ 'app-field-picker__option--selected': isSelected(cat) }"
            :primary="formatTransactionCategoryLabel(cat, $t)"
            :disabled="isCategoryOptionDisabled(cat)"
            @select="selectCategory(cat)"
          />
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
    leafTransactionCategories,
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
        isSearchActive() {
            return this.categorySearch.trim().length > 0;
        },
        pickerCategories() {
            const currentId =
                this.modelValue != null && this.modelValue !== ''
                    ? Number(this.modelValue)
                    : null;
            const includeIds =
                Number.isFinite(currentId) && currentId > 0 ? [currentId] : [];
            return leafTransactionCategories(this.categories, includeIds);
        },
        searchResults() {
            if (!this.isSearchActive) {
                return [];
            }
            return searchTransactionCategoriesLocal(
                this.pickerCategories,
                this.categorySearch,
                this.$t,
                null,
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
            return this.disabled || Boolean(this.disableCategory && this.disableCategory(cat));
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
