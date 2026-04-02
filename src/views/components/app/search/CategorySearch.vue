<template>
  <div>
    <div
      v-if="selectedCategory == null"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >
        {{ $t('category') }}
      </label>

      <input
        v-model="categorySearch"
        type="text"
        class="w-full p-2 border rounded"
        :placeholder="$t('selectCategory')"
        :disabled="disabled"
        @focus="handleFocus"
        @blur="handleBlur"
      >

      <transition name="appear">
        <ul
          v-show="showDropdown"
          class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10"
        >
          <li
            v-if="categorySearchLoading"
            class="p-2 text-gray-500"
          >
            {{ $t('loading') }}
          </li>

          <template v-else-if="categorySearch.length === 0">
            <li
              v-for="cat in lastCategories"
              :key="cat.id"
              class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100"
              @mousedown.prevent="selectCategory(cat)"
            >
              <div class="font-medium">
                {{ formatCategoryName(cat.name) }}
              </div>
            </li>
          </template>

          <li
            v-else-if="categorySearch.length < 3"
            class="p-2 text-gray-500"
          >
            {{ $t('minimum3Characters') }}
          </li>

          <li
            v-else-if="categoryResults.length === 0"
            class="p-2 text-gray-500"
          >
            {{ $t('notFound') }}
          </li>

          <li
            v-for="cat in categoryResults"
            :key="cat.id"
            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100"
            @mousedown.prevent="() => selectCategory(cat)"
          >
            <div class="font-medium">
              {{ formatCategoryName(cat.name) }}
            </div>
          </li>
        </ul>
      </transition>
    </div>

    <!-- Компактный вид: выбранная категория в том же поле, без префикса-номера в названии -->
    <div
      v-else-if="inlineSelected"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >
        {{ $t('category') }}
      </label>
      <div class="flex items-center gap-2">
        <input
          type="text"
          readonly
          class="w-full min-w-0 flex-1 p-2 border rounded bg-white"
          :value="categoryLabelForInput"
        >
        <button
          v-if="allowDeselect"
          type="button"
          class="text-red-500 text-2xl cursor-pointer shrink-0 leading-none"
          :disabled="disabled"
          @click="deselectCategory"
        >
          ×
        </button>
      </div>
    </div>

    <div
      v-else
      class="mt-2"
    >
      <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
        <div class="flex justify-between items-center gap-2">
          <div class="min-w-0">
            <label :class="{ required }">{{ $t('category') }}</label>
            <div class="font-semibold text-sm truncate">
              {{ categoryLabelForInput }}
            </div>
          </div>

          <button
            v-if="allowDeselect"
            class="text-red-500 text-2xl cursor-pointer"
            :disabled="disabled"
            @click="deselectCategory"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import debounce from 'lodash.debounce';

/**
 * Поиск категории по имени с dropdown как в `ClientSearch`.
 * Выбор всегда один: компонент эмитит `update:selectedCategory` со значением или `null`.
 */
export default {
  name: 'CategorySearch',
  props: {
    selectedCategory: {
      type: [Object, Number, null],
      default: null,
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
    /** В одну строку с input: как у соседних select в фильтрах */
    inlineSelected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:selectedCategory'],
  data() {
    return {
      categorySearch: '',
      categorySearchLoading: false,
      categoryResults: [],
      lastCategories: [],
      showDropdown: false,
    };
  },
  computed: {
    normalizedSelectedCategoryId() {
      if (this.selectedCategory == null) return null;
      return Number(this.selectedCategory?.id ?? this.selectedCategory) || null;
    },
    resolvedSelectedCategory() {
      const selectedId = this.normalizedSelectedCategoryId;
      if (!selectedId) return null;
      return this.categories.find((c) => Number(c.id) === selectedId) || null;
    },
    /**
     * Готовое значение для отображения в шаблоне:
     *  - если selectedCategory передан объектом - вернем его
     *  - если только id - попробуем резолвнуть по `categories`
     */
    selectedCategoryComputed() {
      return this.resolvedSelectedCategory || (this.selectedCategory?.name ? this.selectedCategory : null);
    },
    /** Текст в поле: имя без ведущего числового кода (напр. «01 — …») */
    categoryLabelForInput() {
      const raw = this.selectedCategoryComputed?.name;
      return this.formatCategoryName(raw) || raw || '-';
    },
  },
  watch: {
    categories: {
      handler() {
        this.updateLastCategories();
      },
      immediate: true,
      deep: true,
    },
    resolvedSelectedCategory: {
      handler(newVal) {
        // Чтобы UI корректно показывал выбранное название, если selectedCategory передан только id.
        if (newVal && this.selectedCategory && this.selectedCategory?.id == null) {
          this.$emit('update:selectedCategory', newVal);
        }
      },
      immediate: false,
    },
    categorySearch: {
      handler() {
        this.searchCategories();
      },
      immediate: false,
    },
  },
  mounted() {
    document.addEventListener('click', this.handleDropdownClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDropdownClickOutside);
  },
  methods: {
    /**
     * Убирает ведущий числовой префикс в названии категории для отображения.
     */
    formatCategoryName(name) {
      if (name == null || name === '') return '';
      const s = String(name).trim();
      const stripped = s.replace(/^\d+[-\s.–—:]*\s*/u, '').trim();
      return stripped || s;
    },
    updateLastCategories() {
      const cats = Array.isArray(this.categories) ? this.categories : [];
      this.lastCategories = cats
        .filter((c) => c && c.status !== false)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);
    },
    selectCategory(cat) {
      this.showDropdown = false;
      this.categorySearch = '';
      this.categoryResults = [];
      this.$emit('update:selectedCategory', cat);
    },
    deselectCategory() {
      this.$emit('update:selectedCategory', null);
    },
    handleFocus() {
      this.showDropdown = true;
      if (!this.lastCategories.length) {
        this.updateLastCategories();
      }
    },
    handleBlur() {
      requestAnimationFrame(() => {
        this.showDropdown = false;
      });
    },
    handleDropdownClickOutside(event) {
      if (!event.target.closest('.relative')) {
        this.showDropdown = false;
      }
    },
    searchCategories: debounce(async function () {
      const q = this.categorySearch?.trim() || '';

      if (q.length < 3) {
        this.categoryResults = [];
        return;
      }

      this.categorySearchLoading = true;
      try {
        const qLower = q.toLowerCase();
        const cats = Array.isArray(this.categories) ? this.categories : [];

        this.categoryResults = cats
          .filter((c) => c && c.name)
          .filter((c) => String(c.name).toLowerCase().includes(qLower))
          .slice(0, 20);
      } finally {
        this.categorySearchLoading = false;
      }
    }, 250),
  },
};
</script>

<style scoped>
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

