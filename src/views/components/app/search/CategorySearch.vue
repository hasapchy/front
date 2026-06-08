<template>
  <div
    ref="root"
    class="relative w-full"
  >
    <AppFieldPicker
      :multiple="multiple"
      :has-selection="!multiple && selectedCategoryComputed != null"
      :show-label="showLabel"
      :label="$t('category')"
      :required="required"
      :disabled="disabled"
      :allow-deselect="allowDeselect"
      :dropdown-open="open"
      :search-value="categorySearch"
      :placeholder="placeholder || $t('searchCategoryByName')"
      @update:search-value="categorySearch = $event"
      @focus="handleFocus"
      @blur="handleBlur"
      @deselect="deselectCategory"
    >
      <template
        v-if="multiple"
        #multiple
      >
        <div class="relative">
          <div
            class="category-search__field flex w-full min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border-2 border-[var(--input-border)] bg-[var(--input-bg)] p-2 transition-all duration-200 ease-in-out focus-within:border-[var(--label-accent)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--label-accent)_22%,transparent)]"
            :class="{ 'category-search__field--single-line': singleLinePreview }"
            @click="focusInput"
          >
            <div
              v-for="cat in displayPills"
              :key="cat.id"
              :title="getCategoryLabelWithParent(cat, categories)"
              class="category-multi-search__pill inline-flex max-w-full flex-shrink-0 items-center gap-1"
            >
              <span class="truncate">{{ getCategoryLabelWithParent(cat, categories) }}</span>
              <button
                v-if="allowDeselect"
                type="button"
                class="flex-shrink-0 text-sm leading-none text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] dark:text-[var(--color-danger)] dark:hover:text-[var(--color-danger)]"
                :disabled="disabled"
                @mousedown.prevent.stop="removeCategory(cat)"
              >
                ×
              </button>
            </div>
            <span
              v-if="hasMoreInPreview"
              class="category-multi-search__ellipsis flex-shrink-0"
              :title="selectionTitle"
            >…</span>
            <input
              ref="searchInput"
              v-model="categorySearch"
              type="text"
              :placeholder="selectedCategories.length === 0 ? (placeholder || $t('searchCategoryByName')) : ''"
              class="m-0 min-w-0 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-0 focus:ring-0 !shadow-none focus:!shadow-none"
              :class="selectedCategories.length === 0 ? 'min-w-[120px] flex-1' : ''"
              :style="inputInlineStyle"
              :disabled="disabled"
              @focus="handleFocus"
              @blur="handleBlur"
              @input="handleInput"
            >
          </div>
          <transition name="appear">
            <ul
              ref="categoryDropdown"
              v-show="open"
              class="app-field-picker__dropdown"
              @mousedown.prevent
            >
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
                <template v-else>
                  <li
                    v-for="cat in searchResults"
                    :key="cat.id"
                    class="app-field-picker__option"
                    :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(cat) }"
                    @mousedown.prevent="!multiple && onCategoryDropdownPick(cat)"
                  >
                    <label
                      v-if="multiple"
                      class="app-field-picker__tree-check"
                      @mousedown.prevent="onCategoryDropdownPick(cat)"
                    >
                      <input
                        type="checkbox"
                        tabindex="-1"
                        :checked="isCategoryDropdownItemSelected(cat)"
                        :disabled="disabled"
                        @click.prevent
                      >
                      <span class="app-field-picker__option-primary">
                        {{ categoryOptionLabel(cat) }}
                      </span>
                    </label>
                    <span
                      v-else
                      class="app-field-picker__option-primary"
                    >
                      {{ categoryOptionLabel(cat) }}
                    </span>
                  </li>
                </template>
              </template>
              <template v-else>
                <li
                  v-for="root in rootCategories"
                  :key="root.id"
                  class="app-field-picker__tree-group"
                >
                  <div
                    class="app-field-picker__tree-row"
                    :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(root) }"
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
                    <label
                      v-if="multiple"
                      class="app-field-picker__tree-check min-w-0 flex-1"
                      @mousedown.prevent="onCategoryDropdownPick(root)"
                    >
                      <input
                        type="checkbox"
                        tabindex="-1"
                        :checked="isCategoryDropdownItemSelected(root)"
                        :disabled="disabled"
                        @click.prevent
                      >
                      <span class="app-field-picker__option-primary">
                        {{ formatCategoryLabel(root) }}
                      </span>
                    </label>
                    <div
                      v-else
                      class="app-field-picker__option min-w-0 flex-1"
                      @mousedown.prevent="onCategoryDropdownPick(root)"
                    >
                      <div class="app-field-picker__option-row">
                        <span class="app-field-picker__option-primary">
                          {{ formatCategoryLabel(root) }}
                        </span>
                      </div>
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
                      :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(child) }"
                      @mousedown.prevent="!multiple && onCategoryDropdownPick(child)"
                    >
                      <label
                        v-if="multiple"
                        class="app-field-picker__tree-check"
                        @mousedown.prevent="onCategoryDropdownPick(child)"
                      >
                        <input
                          type="checkbox"
                          tabindex="-1"
                          :checked="isCategoryDropdownItemSelected(child)"
                          :disabled="disabled"
                          @click.prevent
                        >
                        <span class="app-field-picker__option-primary">
                          {{ formatCategoryLabel(child) }}
                        </span>
                      </label>
                      <span
                        v-else
                        class="app-field-picker__option-primary"
                      >
                        {{ formatCategoryLabel(child) }}
                      </span>
                    </li>
                  </ul>
                </li>
              </template>
            </ul>
          </transition>
        </div>
      </template>

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
          <template v-else>
            <li
              v-for="cat in searchResults"
              :key="cat.id"
              class="app-field-picker__option"
              :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(cat) }"
              @mousedown.prevent="!multiple && onCategoryDropdownPick(cat)"
            >
              <label
                v-if="multiple"
                class="app-field-picker__tree-check"
              >
                <input
                  type="checkbox"
                  :checked="isCategoryDropdownItemSelected(cat)"
                  :disabled="disabled"
                  @change="onCategoryDropdownPick(cat)"
                  @mousedown.stop
                  @click.stop
                >
                <span class="app-field-picker__option-primary">
                  {{ categoryOptionLabel(cat) }}
                </span>
              </label>
              <span
                v-else
                class="app-field-picker__option-primary"
              >
                {{ categoryOptionLabel(cat) }}
              </span>
            </li>
          </template>
        </template>
        <template v-else>
          <li
            v-for="root in rootCategories"
            :key="root.id"
            class="app-field-picker__tree-group"
          >
            <div
              class="app-field-picker__tree-row"
              :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(root) }"
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
              <label
                v-if="multiple"
                class="app-field-picker__tree-check min-w-0 flex-1"
              >
                <input
                  type="checkbox"
                  :checked="isCategoryDropdownItemSelected(root)"
                  :disabled="disabled"
                  @change="onCategoryDropdownPick(root)"
                  @mousedown.stop
                  @click.stop
                >
                <span class="app-field-picker__option-primary">
                  {{ formatCategoryLabel(root) }}
                </span>
              </label>
              <div
                v-else
                class="app-field-picker__option min-w-0 flex-1"
                @mousedown.prevent="onCategoryDropdownPick(root)"
              >
                <div class="app-field-picker__option-row">
                  <span class="app-field-picker__option-primary">
                    {{ formatCategoryLabel(root) }}
                  </span>
                </div>
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
                :class="{ 'app-field-picker__option--selected': isCategoryDropdownItemSelected(child) }"
                @mousedown.prevent="!multiple && onCategoryDropdownPick(child)"
              >
                <label
                  v-if="multiple"
                  class="app-field-picker__tree-check"
                >
                  <input
                    type="checkbox"
                    :checked="isCategoryDropdownItemSelected(child)"
                    :disabled="disabled"
                    @change="onCategoryDropdownPick(child)"
                    @mousedown.stop
                    @click.stop
                  >
                  <span class="app-field-picker__option-primary">
                    {{ formatCategoryLabel(child) }}
                  </span>
                </label>
                <span
                  v-else
                  class="app-field-picker__option-primary"
                >
                  {{ formatCategoryLabel(child) }}
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
      :value="requiredInputValue"
      required
      class="pointer-events-none absolute h-0 w-0 opacity-0"
      tabindex="-1"
    >
  </div>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import {
    filterCategoriesForSelect,
    formatCategoryLabel,
    getCategoryLabelWithParent,
    getCategorySelectionWithDescendants,
    getCategorySelectionWithoutDescendants,
    isRootCategory,
    searchCategoriesLocal,
} from '@/utils/categorySearchUtils';

const SEARCH_MIN_LENGTH = 2;

export default {
    name: 'CategorySearch',
    components: { AppFieldPicker },
    props: {
        multiple: {
            type: Boolean,
            default: false,
        },
        selectedCategory: {
            type: [Object, Number, null],
            default: null,
        },
        modelValue: {
            type: Array,
            default: () => [],
        },
        categories: {
            type: Array,
            default: () => [],
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
        allowDeselect: {
            type: Boolean,
            default: true,
        },
        placeholder: {
            type: String,
            default: '',
        },
        singleLinePreview: {
            type: Boolean,
            default: false,
        },
        maxVisibleCount: {
            type: Number,
            default: 5,
        },
    },
    emits: ['update:selectedCategory', 'update:modelValue', 'change'],
    data() {
        return {
            open: false,
            categorySearch: '',
            expandedRootIds: [],
            searchMinLength: SEARCH_MIN_LENGTH,
        };
    },
    computed: {
        normalizedSelectedCategoryId() {
            if (this.multiple || this.selectedCategory == null) {
                return null;
            }
            return Number(this.selectedCategory?.id ?? this.selectedCategory) || null;
        },
        resolvedSelectedCategory() {
            const selectedId = this.normalizedSelectedCategoryId;
            if (!selectedId) {
                return null;
            }
            return this.categories.find((c) => Number(c.id) === selectedId) || null;
        },
        selectedCategoryComputed() {
            if (this.multiple) {
                return null;
            }
            return this.resolvedSelectedCategory
                || (this.selectedCategory?.name ? this.selectedCategory : null);
        },
        selectedCategoryLabel() {
            return formatCategoryLabel(this.selectedCategoryComputed);
        },
        selectedIds() {
            if (!this.multiple || !Array.isArray(this.modelValue)) {
                return [];
            }
            return this.modelValue.map((id) => String(id));
        },
        filteredCategories() {
            return filterCategoriesForSelect(this.categories);
        },
        rootCategories() {
            return this.filteredCategories.filter((c) => !c.parentId);
        },
        selectedCategories() {
            return this.selectedIds
                .map((id) => this.categories.find((c) => String(c.id) === id))
                .filter(Boolean);
        },
        displayPills() {
            if (this.singleLinePreview) {
                return this.selectedCategories.slice(0, this.maxVisibleCount);
            }
            return this.selectedCategories;
        },
        hasMoreInPreview() {
            return this.singleLinePreview
                && this.selectedCategories.length > this.maxVisibleCount;
        },
        selectionTitle() {
            return this.selectedCategories
                .map((c) => getCategoryLabelWithParent(c, this.categories))
                .join(', ');
        },
        isSearchActive() {
            return this.categorySearch.trim().length > 0;
        },
        searchResults() {
            if (!this.isSearchActive) {
                return [];
            }
            return searchCategoriesLocal(this.categories, this.categorySearch);
        },
        inputInlineStyle() {
            if (this.selectedCategories.length === 0) {
                return { border: 'none' };
            }
            if (this.categorySearch) {
                return { minWidth: '120px', flex: '1 1 auto', border: 'none' };
            }
            return { width: '2px', minWidth: '2px', padding: 0, opacity: 0, border: 'none' };
        },
        requiredInputValue() {
            if (this.multiple) {
                return this.selectedIds.length ? '1' : '';
            }
            return this.normalizedSelectedCategoryId ? String(this.normalizedSelectedCategoryId) : '';
        },
    },
    mounted() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
    },
    watch: {
        resolvedSelectedCategory: {
            handler(newVal) {
                if (this.multiple) {
                    return;
                }
                if (newVal && this.selectedCategory && this.selectedCategory?.id == null) {
                    this.$emit('update:selectedCategory', newVal);
                }
            },
        },
    },
    methods: {
        formatCategoryLabel,
        getCategoryLabelWithParent,
        childrenOf(parentId) {
            return this.filteredCategories.filter((c) => c.parentId == parentId);
        },
        categoryOptionLabel(cat) {
            return this.multiple
                ? getCategoryLabelWithParent(cat, this.categories)
                : formatCategoryLabel(cat);
        },
        isCategoryDropdownItemSelected(cat) {
            return this.multiple ? this.isChecked(cat) : this.isSelected(cat);
        },
        onCategoryDropdownPick(cat) {
            if (this.multiple) {
                this.toggleCategory(cat);
                return;
            }
            this.selectCategory(cat);
        },
        isSelected(cat) {
            const id = this.normalizedSelectedCategoryId;
            if (!id) {
                return false;
            }
            return Number(cat.id) === Number(id);
        },
        isChecked(cat) {
            return this.selectedIds.includes(String(cat.id));
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
        focusInput() {
            this.$refs.searchInput?.focus();
        },
        handleInput() {
            this.$refs.searchInput?.focus();
        },
        handleFocus() {
            this.open = true;
            if (!this.multiple) {
                this.expandForCurrentValue();
            }
        },
        handleBlur(event) {
            requestAnimationFrame(() => {
                if (this.multiple) {
                    const dropdown = this.$refs.categoryDropdown;
                    const related = event?.relatedTarget;
                    if (dropdown && related && dropdown.contains(related)) {
                        return;
                    }
                }
                this.closeDropdown();
            });
        },
        handleOutsideClick(event) {
            if (!this.open) {
                return;
            }
            const root = this.$refs.root;
            if (root && !root.contains(event.target)) {
                this.closeDropdown();
            }
        },
        closeDropdown() {
            this.open = false;
            if (this.multiple) {
                this.categorySearch = '';
            }
        },
        expandForCurrentValue() {
            const cat = this.selectedCategoryComputed;
            if (cat?.parentId && !this.expandedRootIds.includes(cat.parentId)) {
                this.expandedRootIds.push(cat.parentId);
            }
        },
        selectCategory(cat) {
            this.$emit('update:selectedCategory', cat);
            this.closeDropdown();
        },
        deselectCategory() {
            if (this.multiple) {
                this.emitMultipleSelection([]);
                return;
            }
            this.$emit('update:selectedCategory', null);
            this.closeDropdown();
        },
        emitMultipleSelection(next) {
            this.$emit('update:modelValue', next);
            this.$emit('change', next);
        },
        toggleCategory(cat) {
            if (this.disabled || !cat) {
                return;
            }
            const id = String(cat.id);
            const isSelected = this.selectedIds.includes(id);
            if (isSelected) {
                const next = isRootCategory(cat)
                    ? getCategorySelectionWithoutDescendants(cat.id, this.categories, this.selectedIds)
                    : this.selectedIds.filter((item) => item !== id);
                this.emitMultipleSelection(next);
                return;
            }
            const next = isRootCategory(cat)
                ? getCategorySelectionWithDescendants(cat.id, this.categories, this.selectedIds)
                : [...this.selectedIds, id];
            this.emitMultipleSelection(next);
        },
        removeCategory(cat) {
            if (this.disabled || !cat) {
                return;
            }
            const next = isRootCategory(cat)
                ? getCategorySelectionWithoutDescendants(cat.id, this.categories, this.selectedIds)
                : this.selectedIds.filter((item) => item !== String(cat.id));
            this.emitMultipleSelection(next);
        },
    },
};
</script>

<style scoped>
.category-search__field--single-line {
    flex-wrap: nowrap;
    overflow: hidden;
}

.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>
