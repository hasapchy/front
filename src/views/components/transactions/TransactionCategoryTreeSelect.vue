<template>
  <div
    ref="root"
    class="relative w-full"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-md border-2 border-[#9ca3af] bg-white px-3 py-2 text-left text-xs shadow-sm transition-all duration-200 ease-in-out outline-none disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:opacity-60 focus:border-[var(--label-accent)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--label-accent)_22%,transparent)]"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span
        v-if="selectedCategory"
        class="truncate"
      >
        {{ selectedCategory.type ? '✅' : '🔺' }} {{ translateTransactionCategory(selectedCategory.name, $t) }}
      </span>
      <span
        v-else
        class="text-gray-500 truncate"
      >
        {{ $t('category') }}
      </span>
      <i
        class="fas fa-chevron-down text-[10px] opacity-70 shrink-0 transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>
    <input
      v-if="required"
      :value="modelValue == null || modelValue === '' ? '' : String(modelValue)"
      required
      class="absolute opacity-0 pointer-events-none h-0 w-0"
      tabindex="-1"
    >
    <transition name="appear">
      <ul
        v-show="open"
        class="absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 max-h-56 overflow-y-auto"
      >
        <li
          v-if="allowEmpty"
          class="border-b border-gray-100"
        >
          <button
            type="button"
            class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-600"
            :disabled="disabled"
            @click="clearSelection"
          >
            {{ $t('no') }}
          </button>
        </li>
        <li
          v-for="root in rootCategories"
          :key="root.id"
          class="border-b border-gray-200 last:border-b-0"
        >
          <div
            class="flex min-h-[2.25rem] items-stretch transition-colors"
            :class="isSelected(root) ? 'bg-[#3571A4]/12' : ''"
          >
            <button
              v-if="childrenOf(root.id).length"
              type="button"
              class="w-8 shrink-0 flex items-center justify-center text-gray-500 hover:bg-black/[0.04]"
              @click.stop="toggleExpand(root.id)"
            >
              <i
                class="fas fa-chevron-right text-[10px] transition-transform"
                :class="isExpanded(root.id) ? 'rotate-90' : ''"
              />
            </button>
            <span
              v-else
              class="w-8 shrink-0"
            />
            <button
              type="button"
              class="flex-1 px-2 py-2 text-left text-sm transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
              :class="isSelected(root) ? 'font-medium text-[#2d5f8f]' : ''"
              :disabled="disabled || (disableCategory && disableCategory(root))"
              @click="selectCategory(root)"
            >
              {{ root.type ? '✅' : '🔺' }} {{ translateTransactionCategory(root.name, $t) }}
            </button>
          </div>
          <ul
            v-if="isExpanded(root.id)"
            class="ml-12 bg-gray-50/60 pl-3"
          >
            <li
              v-for="child in childrenOf(root.id)"
              :key="child.id"
              class="border-b border-gray-200/80 last:border-b-0"
            >
              <button
                type="button"
                class="w-full py-2 pr-3 text-left text-sm transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                :class="isSelected(child) ? 'bg-[#3571A4]/15 font-medium text-[#2d5f8f]' : ''"
                :disabled="disabled || (disableCategory && disableCategory(child))"
                @click="selectCategory(child)"
              >
                {{ child.type ? '✅' : '🔺' }} {{ translateTransactionCategory(child.name, $t) }}
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';

export default {
    name: 'TransactionCategoryTreeSelect',
    props: {
        modelValue: { type: [String, Number, null], default: null },
        categories: { type: Array, default: () => [] },
        disabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
        allowEmpty: { type: Boolean, default: false },
        disableCategory: { type: Function, default: null },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            open: false,
            expandedRootIds: [],
        };
    },
    computed: {
        selectedCategory() {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return null;
            }
            return this.categories.find((c) => c.id == v);
        },
        rootCategories() {
            return this.categories.filter((c) => !c.parentId);
        },
    },
    mounted() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
    },
    methods: {
        translateTransactionCategory,
        isSelected(cat) {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return false;
            }
            return cat.id == v;
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
        toggleOpen() {
            if (this.disabled) {
                return;
            }
            const next = !this.open;
            this.open = next;
            if (next) {
                this.expandForCurrentValue();
            }
        },
        expandForCurrentValue() {
            const v = this.modelValue;
            if (v === '' || v == null) {
                return;
            }
            const cat = this.categories.find((c) => c.id == v);
            if (cat && cat.parentId && !this.expandedRootIds.includes(cat.parentId)) {
                this.expandedRootIds.push(cat.parentId);
            }
        },
        handleOutsideClick(event) {
            if (this.$refs.root && !this.$refs.root.contains(event.target)) {
                this.open = false;
            }
        },
        selectCategory(cat) {
            this.$emit('update:modelValue', cat.id);
            this.open = false;
        },
        clearSelection() {
            this.$emit('update:modelValue', '');
            this.open = false;
        },
    },
};
</script>
