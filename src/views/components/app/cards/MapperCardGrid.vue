<template>
  <div>
    <CardViewEmptyState
      v-if="!normalizedItems.length"
      :title="emptyTitle"
      :hint="emptyHint"
    />
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <Card
        v-for="item in normalizedItems"
        :key="item.id"
        :shell-item="item"
        :is-selected="selectedIds.includes(item.id)"
        :show-checkbox="showCheckbox"
        @dblclick="$emit('dblclick', $event)"
        @select-toggle="$emit('select-toggle', $event)"
      >
        <template #header>
          <span
            v-if="titlePrefixHtml(item)"
            class="flex-shrink-0 inline-flex"
            v-html="titlePrefixHtml(item)"
          />
          <div class="flex w-full min-w-0 items-center justify-between gap-2">
            <span class="block truncate text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)] min-w-0">
              {{ titleText(item) }}
            </span>
            <span
              v-if="titleSubtitleText(item)"
              class="text-xs text-gray-500 dark:text-[var(--text-secondary)] whitespace-nowrap"
            >{{ titleSubtitleText(item) }}</span>
          </div>
        </template>
        <template #headerTrailing>
          <div
            v-if="hasHeaderTrailing(item)"
            class="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5"
          >
            <span
              v-if="headerSuffixPlain(item)"
              class="text-xs text-gray-500 dark:text-[var(--text-secondary)] whitespace-nowrap"
            >{{ headerSuffixPlain(item) }}</span>
            <span
              v-if="headerSuffixMarkup(item)"
              class="inline-flex items-center gap-1"
              v-html="headerSuffixMarkup(item)"
            />
          </div>
        </template>
        <div class="flex flex-col flex-1 min-h-0">
          <div
            v-if="bodyFieldsWithValues(item).length"
            class="space-y-1 text-sm text-gray-600 dark:text-[var(--text-secondary)] flex-1"
          >
            <div
              v-for="field in bodyFieldsWithValues(item)"
              :key="field.name"
              class="flex gap-1.5 items-center min-w-0"
            >
              <span
                v-if="field.icon"
                class="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 dark:bg-white dark:text-[var(--surface-page)]"
              ><i :class="field.icon" /></span>
              <span
                v-if="field.html"
                class="inline-flex min-w-0 items-center truncate dark:text-[var(--text-primary)]"
                v-html="fieldValue(item, field)"
              />
              <span
                v-else
                class="truncate min-w-0"
              >{{ fieldValue(item, field) }}</span>
            </div>
          </div>
          <div
            v-if="footerFieldsWithValues(item).length"
            class="mt-auto pt-2 border-t border-gray-100 dark:border-[var(--border-subtle)] space-y-1"
          >
            <div
              v-for="field in footerFieldsWithValues(item)"
              :key="field.name"
              class="flex w-full items-center gap-2 text-sm"
              :class="field.html ? 'justify-between' : 'justify-end'"
            >
              <span
                v-if="field.html"
                class="font-medium inline-flex items-center"
                :class="footerValueClass(item, field)"
                v-html="fieldValue(item, field)"
              />
              <span
                v-else
                class="font-medium"
                :class="footerValueClass(item, field)"
              >{{ fieldValue(item, field) }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script>
import Card from './Card.vue';
import CardViewEmptyState from './CardViewEmptyState.vue';

export default {
    name: 'MapperCardGrid',
    components: { Card, CardViewEmptyState },
    props: {
        items: {
            type: Array,
            default: () => []
        },
        cardConfig: {
            type: Array,
            default: () => []
        },
        cardMapper: {
            type: Function,
            required: true
        },
        titleField: {
            type: String,
            default: 'title'
        },
        selectedIds: {
            type: Array,
            default: () => []
        },
        showCheckbox: {
            type: Boolean,
            default: true
        },
        footerColorClass: {
            type: Function,
            default: null
        },
        titlePrefix: {
            type: Function,
            default: null
        },
        headerSuffix: {
            type: Function,
            default: null
        },
        titleSubtitleField: {
            type: String,
            default: ''
        },
        headerSuffixField: {
            type: String,
            default: ''
        },
        emptyTitle: {
            type: String,
            default: ''
        },
        emptyHint: {
            type: String,
            default: ''
        }
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        normalizedItems() {
            return Array.isArray(this.items) ? this.items : [];
        },
    },
    methods: {
        titleText(item) {
            return this.cardMapper(item, this.titleField) || '—';
        },
        titleSubtitleText(item) {
            if (!this.titleSubtitleField) return '';
            const v = this.cardMapper(item, this.titleSubtitleField);
            return v !== null && v !== undefined && v !== '' ? String(v) : '';
        },
        titlePrefixHtml(item) {
            return this.titlePrefix ? this.titlePrefix(item) : null;
        },
        hasHeaderTrailing(item) {
            return !!(this.headerSuffixPlain(item) || this.headerSuffixMarkup(item));
        },
        headerSuffixPlain(item) {
            if (!this.headerSuffixField) {
                return '';
            }
            const v = this.cardMapper(item, this.headerSuffixField);
            if (v == null || v === '' || v === '—') {
                return '';
            }
            const s = String(v);
            return s.replace(/<[^>]*>/g, '').trim() || '';
        },
        headerSuffixMarkup(item) {
            return this.headerSuffix ? this.headerSuffix(item) : null;
        },
        bodyFields(item) {
            return (this.cardConfig || []).filter(f => {
                if ((f.slot || 'body') === 'footer') return false;
                if (f.name === this.titleField) return false;
                if (this.titleSubtitleField && f.name === this.titleSubtitleField) {
                    return false;
                }
                if (this.headerSuffixField && f.name === this.headerSuffixField) {
                    return false;
                }
                if (f.visible === false) return false;
                if (f.visible == null || f.visible === true) return true;
                return f.visible(item);
            });
        },
        footerFields(item) {
            return (this.cardConfig || []).filter(f => {
                if ((f.slot || 'body') !== 'footer') return false;
                if (f.visible === false) return false;
                if (f.visible == null || f.visible === true) return true;
                return f.visible(item);
            });
        },
        bodyFieldsWithValues(item) {
            return this.bodyFields(item).filter(f => this.hasFieldValue(item, f));
        },
        footerFieldsWithValues(item) {
            return this.footerFields(item).filter(f => this.hasFieldValue(item, f));
        },
        hasFieldValue(item, field) {
            const v = this.cardMapper(item, field.name);
            return v != null && v !== '' && v !== '—';
        },
        fieldValue(item, field) {
            const v = this.cardMapper(item, field.name);
            if (v == null || v === '' || v === '—') return '';
            return String(v);
        },
        footerValueClass(item, field) {
            if (this.footerColorClass) {
                const cls = this.footerColorClass(item, field.name);
                if (cls) return cls;
            }
            return 'text-gray-800 dark:text-[var(--text-primary)]';
        },
    },
};
</script>
