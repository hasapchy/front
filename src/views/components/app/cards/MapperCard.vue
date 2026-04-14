<template>
  <Card
    :item="null"
    :shell-item="item"
    :is-selected="isSelected"
    :show-checkbox="showCheckbox"
    @dblclick="$emit('dblclick', $event)"
    @select-toggle="$emit('select-toggle', $event)"
  >
    <template #header>
      <span
        v-if="titlePrefixHtml"
        class="flex-shrink-0 inline-flex"
        v-html="titlePrefixHtml"
      />
      <div class="min-w-0">
        <span class="block truncate text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)]">
          {{ titleText }}
        </span>
        <span
          v-if="titleSubtitleText"
          class="text-xs text-gray-500 block truncate"
        >{{ titleSubtitleText }}</span>
      </div>
    </template>
    <template #headerTrailing>
      <span
        v-if="headerSuffixHtml"
        class="flex-shrink-0 inline-flex items-center gap-1"
        v-html="headerSuffixHtml"
      />
    </template>
    <div class="flex flex-col flex-1 min-h-0">
      <div
        v-if="bodyFieldsWithValues.length"
        class="space-y-1 text-sm text-gray-600 flex-1"
      >
        <div
          v-for="field in bodyFieldsWithValues"
          :key="field.name"
          class="flex gap-1.5 items-center min-w-0"
        >
          <span
            v-if="field.icon"
            class="shrink-0 text-gray-500 w-4"
          ><i :class="field.icon" /></span>
          <span
            v-if="field.html"
            class="inline-flex min-w-0 items-center truncate dark:text-[var(--text-primary)]"
            v-html="fieldValue(field)"
          />
          <span
            v-else
            class="truncate min-w-0"
          >{{ fieldValue(field) }}</span>
        </div>
      </div>
      <div
        v-if="footerFieldsWithValues.length"
        class="mt-auto pt-2 border-t border-gray-100 space-y-1"
      >
        <div
          v-for="field in footerFieldsWithValues"
          :key="field.name"
          class="flex justify-end items-center text-sm"
        >
          <span
            v-if="field.html"
            class="font-medium inline-flex items-center"
            :class="footerValueClass(field)"
            v-html="fieldValue(field)"
          />
          <span
            v-else
            class="font-medium"
            :class="footerValueClass(field)"
          >{{ fieldValue(field) }}</span>
        </div>
      </div>
    </div>
  </Card>
</template>

<script>
import Card from './Card.vue';

export default {
    name: 'MapperCard',
    components: { Card },
    props: {
        item: {
            type: Object,
            required: true
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
        isSelected: {
            type: Boolean,
            default: false
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
        }
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        titleText() {
            return this.cardMapper(this.item, this.titleField) || '—';
        },
        titleSubtitleText() {
            if (!this.titleSubtitleField) return '';
            const v = this.cardMapper(this.item, this.titleSubtitleField);
            return v !== null && v !== undefined && v !== '' ? String(v) : '';
        },
        titlePrefixHtml() {
            return this.titlePrefix ? this.titlePrefix(this.item) : null;
        },
        headerSuffixHtml() {
            return this.headerSuffix ? this.headerSuffix(this.item) : null;
        },
        bodyFields() {
            return (this.cardConfig || []).filter(f => {
                if ((f.slot || 'body') === 'footer') return false;
                if (f.name === this.titleField) return false;
                if (f.visible === false) return false;
                if (f.visible == null || f.visible === true) return true;
                return f.visible(this.item);
            });
        },
        footerFields() {
            return (this.cardConfig || []).filter(f => {
                if ((f.slot || 'body') !== 'footer') return false;
                if (f.visible === false) return false;
                if (f.visible == null || f.visible === true) return true;
                return f.visible(this.item);
            });
        },
        bodyFieldsWithValues() {
            return this.bodyFields.filter(f => this.hasFieldValue(f));
        },
        footerFieldsWithValues() {
            return this.footerFields.filter(f => this.hasFieldValue(f));
        }
    },
    methods: {
        hasFieldValue(field) {
            const v = this.cardMapper(this.item, field.name);
            return v != null && v !== '' && v !== '—';
        },
        fieldValue(field) {
            const v = this.cardMapper(this.item, field.name);
            if (v == null || v === '' || v === '—') return '';
            return String(v);
        },
        footerValueClass(field) {
            if (this.footerColorClass) {
                const cls = this.footerColorClass(this.item, field.name);
                if (cls) return cls;
            }
            return 'text-gray-800';
        }
    }
};
</script>
