<template>
    <div
        class="mapper-card bg-white rounded-lg border border-gray-200 shadow p-3 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all flex flex-col min-h-[80px]"
        :class="{ 'ring-2 ring-blue-400': isSelected }"
        @dblclick="handleDoubleClick"
    >
        <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
                <input
                    v-if="showCheckbox"
                    type="checkbox"
                    :checked="isSelected"
                    @click.stop="handleSelectToggle"
                    class="cursor-pointer flex-shrink-0 rounded border-gray-300"
                />
                <span v-if="titlePrefixHtml" class="flex-shrink-0 inline-flex" v-html="titlePrefixHtml"></span>
                <div class="min-w-0">
                    <span class="text-sm font-semibold text-gray-800 truncate block">
                        {{ titleText }}
                    </span>
                    <span v-if="titleSubtitleText" class="text-xs text-gray-500 block truncate">{{ titleSubtitleText }}</span>
                </div>
            </div>
            <span v-if="headerSuffixHtml" class="flex-shrink-0 inline-flex items-center gap-1" v-html="headerSuffixHtml"></span>
        </div>

        <div v-if="bodyFieldsWithValues.length" class="space-y-1 text-sm text-gray-600 flex-1">
            <div v-for="field in bodyFieldsWithValues" :key="field.name" class="flex gap-1.5 items-center min-w-0">
                <span v-if="field.icon" class="shrink-0 text-gray-500 w-4"><i :class="field.icon"></i></span>
                <span v-if="field.html" class="truncate inline-flex items-center min-w-0" v-html="fieldValue(field)"></span>
                <span v-else class="truncate min-w-0">{{ fieldValue(field) }}</span>
            </div>
        </div>

        <div v-if="footerFieldsWithValues.length" class="mt-auto pt-2 border-t border-gray-100 space-y-1">
            <div v-for="field in footerFieldsWithValues" :key="field.name" class="flex justify-end items-center text-sm">
                <span v-if="field.html" class="font-medium inline-flex items-center" :class="footerValueClass(field)" v-html="fieldValue(field)"></span>
                <span v-else class="font-medium" :class="footerValueClass(field)">{{ fieldValue(field) }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MapperCard',
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
                if (typeof f.visible === 'function') return f.visible(this.item);
                return true;
            });
        },
        footerFields() {
            return (this.cardConfig || []).filter(f => {
                if ((f.slot || 'body') !== 'footer') return false;
                if (f.visible === false) return false;
                if (typeof f.visible === 'function') return f.visible(this.item);
                return true;
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
        },
        handleDoubleClick() {
            this.$emit('dblclick', this.item);
        },
        handleSelectToggle() {
            this.$emit('select-toggle', this.item?.id);
        }
    }
};
</script>
