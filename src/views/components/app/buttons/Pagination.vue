<template>
  <div class="w-auto shrink-0 min-w-0 md:w-auto">
    <div
      class="hidden max-md:flex items-center justify-center gap-1"
      role="navigation"
      :aria-label="$t('pagination')"
    >
      <button
        type="button"
        :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1, 'cursor-pointer': currentPage !== 1 }"
        :disabled="currentPage === 1"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-800 transition duration-300 hover:bg-gray-100 focus:outline-none focus:shadow-outline"
        @click="$emit('changePage', currentPage - 1)"
      >
        <span class="sr-only">{{ $t('paginationPrev') }}</span>
        <i class="fas fa-chevron-left" />
      </button>
      <span class="min-w-0 px-2 text-center text-xs font-medium tabular-nums text-gray-700">
        {{ currentPage }} / {{ safeLastPage }}
      </span>
      <button
        type="button"
        :class="{ 'opacity-50 cursor-not-allowed': currentPage === safeLastPage, 'cursor-pointer': currentPage !== safeLastPage }"
        :disabled="currentPage === safeLastPage"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-800 transition duration-300 hover:bg-gray-100 focus:outline-none focus:shadow-outline"
        @click="$emit('changePage', currentPage + 1)"
      >
        <span class="sr-only">{{ $t('paginationNext') }}</span>
        <i class="fas fa-chevron-right" />
      </button>
    </div>

    <div class="flex max-md:hidden flex-nowrap items-center justify-between gap-3">
      <div
        v-if="showPerPageSelector"
        class="shrink-0"
      >
        <PerPageSelector
          :per-page="perPage"
          :per-page-options="perPageOptions"
          :storage-key="storageKey"
          @per-page-change="$emit('perPageChange', $event)"
        />
      </div>

      <nav
        class="shrink-0"
        :class="showPerPageSelector ? 'ml-4' : ''"
      >
        <ul class="flex h-9 items-center -space-x-px text-sm">
          <li>
            <button
              type="button"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1, 'cursor-pointer': currentPage !== 1 }"
              :disabled="currentPage === 1"
              class="ms-0 flex h-9 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-black transition duration-300 hover:bg-gray-100 focus:outline-none focus:shadow-outline"
              @click="$emit('changePage', currentPage - 1)"
            >
              <span class="sr-only">{{ $t('paginationPrev') }}</span>
              <i class="fas fa-chevron-left rtl:rotate-180" />
            </button>
          </li>

          <template v-for="(item, index) in paginationItems">
            <li
              v-if="item.type === 'page'"
              :key="'p-' + item.value"
            >
              <button
                type="button"
                :disabled="currentPage === item.value"
                :class="[
                  'flex h-9 items-center justify-center border px-3 leading-tight transition duration-300',
                  item.value === currentPage
                    ? 'cursor-not-allowed border-[var(--pagination-active-border)] bg-[var(--pagination-active-bg)] text-white'
                    : 'cursor-pointer border-gray-300 bg-white text-black hover:bg-gray-100 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'
                ]"
                @click="$emit('changePage', item.value)"
              >
                {{ item.value }}
              </button>
            </li>
            <li
              v-else-if="item.type === 'ellipsis'"
              :key="'e-' + index"
            >
              <span class="flex h-9 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-black">
                ...
              </span>
            </li>
          </template>
          <li>
            <button
              type="button"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === safeLastPage, 'cursor-pointer': currentPage !== safeLastPage }"
              :disabled="currentPage === safeLastPage"
              class="flex h-9 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-black transition duration-300 hover:bg-gray-100 focus:outline-none focus:shadow-outline"
              @click="$emit('changePage', currentPage + 1)"
            >
              <span class="sr-only">{{ $t('paginationNext') }}</span>
              <i class="fas fa-chevron-right rtl:rotate-180" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
import PerPageSelector from '@/views/components/app/forms/PerPageSelector.vue';

export default {
    components: {
        PerPageSelector
    },
    props: {
        currentPage: Number,
        lastPage: Number,
        perPage: {
            type: Number,
            default: 20
        },
        perPageOptions: {
            type: Array,
            default: () => [20, 50]
        },
        showPerPageSelector: {
            type: Boolean,
            default: true
        },
        storageKey: {
            type: String,
            default: 'perPage'
        }
    },
    emits: ['changePage', 'perPageChange'],
    computed: {
        safeLastPage() {
            const n = Number(this.lastPage);
            return Number.isFinite(n) && n >= 1 ? n : 1;
        },
        paginationItems() {
            const items = [];
            const delta = 2;
            const lp = this.safeLastPage;
            let start = Math.max(1, this.currentPage - delta);
            let end = Math.min(lp, this.currentPage + delta);

            const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

            if (start > 1) {
                items.push({ type: 'page', value: 1 });
                if (start > 2) {
                    items.push({ type: 'ellipsis' });
                }
            }

            pages.forEach(page => {
                items.push({ type: 'page', value: page });
            });

            if (end < lp) {
                if (end < lp - 1) {
                    items.push({ type: 'ellipsis' });
                }
                items.push({ type: 'page', value: lp });
            }

            return items;
        }
    }
};
</script>
