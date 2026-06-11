<template>
  <div class="w-auto shrink-0 min-w-0 md:w-auto">
    <div
      class="hidden max-md:flex items-center justify-center gap-1"
      role="navigation"
      :aria-label="$t('pagination')"
    >
      <button
        type="button"
        class="pagination-btn pagination-btn--icon"
        :disabled="currentPage === 1"
        @click="$emit('changePage', currentPage - 1)"
      >
        <span class="sr-only">{{ $t('paginationPrev') }}</span>
        <i class="fas fa-chevron-left" />
      </button>
      <span class="pagination-page-indicator">
        {{ currentPage }} / {{ safeLastPage }}
      </span>
      <button
        type="button"
        class="pagination-btn pagination-btn--icon"
        :disabled="currentPage === safeLastPage"
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
              class="pagination-btn pagination-btn--nav ms-0"
              :disabled="currentPage === 1"
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
                class="pagination-btn pagination-btn--nav"
                :class="{ 'pagination-btn--active': item.value === currentPage }"
                :disabled="currentPage === item.value"
                @click="$emit('changePage', item.value)"
              >
                {{ item.value }}
              </button>
            </li>
            <li
              v-else-if="item.type === 'ellipsis'"
              :key="'e-' + index"
            >
              <span class="pagination-ellipsis">
                ...
              </span>
            </li>
          </template>
          <li>
            <button
              type="button"
              class="pagination-btn pagination-btn--nav"
              :disabled="currentPage === safeLastPage"
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
