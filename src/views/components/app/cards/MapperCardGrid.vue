<template>
  <div>
    <CardViewEmptyState
      v-if="!bare && !normalizedItems.length"
      :title="emptyTitle"
      :hint="emptyHint"
    />
    <div
      v-else-if="normalizedItems.length"
      :class="bare ? undefined : gridClass"
    >
      <Card
        v-for="item in normalizedItems"
        :key="item.id"
        :shell-item="item"
        :is-selected="selectedIds.includes(item.id)"
        :show-checkbox="showCheckbox"
        :card-style="entityCardStyle(item)"
        :class="entityCardItemClass(item)"
        :compact-shell="isEntityLayout"
        @dblclick="$emit('dblclick', $event)"
        @select-toggle="$emit('select-toggle', $event)"
      >
        <template
          v-if="cornerField && cornerFieldValue(item)"
          #shellCornerBelow
        >
          <span v-html="cornerFieldValue(item)" />
        </template>
        <template
          v-if="isEntityLayout"
          #header
        >
          <div class="entity-card__hero">
            <div class="entity-card__hero-head">
              <div class="entity-card__title-row">
                <span
                  class="entity-card__title"
                  v-html="titleTextHtml(item)"
                />
                <span
                  v-if="titleSubtitleText(item)"
                  class="entity-card__subtitle"
                >{{ titleSubtitleText(item) }}</span>
              </div>
              <div
                v-for="field in titleMetaFields(item)"
                :key="field.name"
                class="entity-card__title-meta"
                :class="{ 'entity-card__title-meta--reserved': field.reserveEmpty && !hasFieldValue(item, field) }"
              >
                <span
                  v-if="fieldValue(item, field)"
                  v-html="fieldValue(item, field)"
                />
              </div>
            </div>
            <div
              v-if="hasHeaderTrailing(item)"
              class="entity-card__header-trailing"
            >
              <EntityCardCreatorAvatar
                v-if="headerCreatorUser(item)"
                :user="headerCreatorUser(item)"
              />
              <span
                v-if="$slots['entity-header-actions']"
                class="entity-card__header-actions"
                @click.stop
              >
                <slot
                  name="entity-header-actions"
                  :item="item"
                />
              </span>
              <span
                v-if="headerSuffixPlain(item)"
                class="entity-card__subtitle"
              >{{ headerSuffixPlain(item) }}</span>
              <span
                v-for="field in headerBadgeFields(item)"
                :key="field.name"
                class="entity-card__header-badge"
                v-html="fieldValue(item, field)"
              />
              <TaskDeadlineBlock
                v-for="field in headerDeadlineFields(item)"
                :key="field.name"
                compact
                :item="item"
                :deadline-field="field.name"
              />
              <span
                v-if="headerSuffixMarkup(item)"
                class="inline-flex items-center gap-1"
                v-html="headerSuffixMarkup(item)"
              />
            </div>
          </div>
          <div
            v-if="metaFields(item).length"
            class="entity-card__meta"
          >
            <div
              v-for="field in metaFields(item)"
              :key="field.name"
              class="entity-card__meta-line"
              v-html="fieldValue(item, field)"
            />
          </div>
        </template>
        <template
          v-else
          #header
        >
          <span
            v-if="titlePrefixHtml(item)"
            class="flex-shrink-0 inline-flex"
            v-html="titlePrefixHtml(item)"
          />
          <div class="entity-card__title-row w-full">
            <span class="entity-card__title">
              {{ titleText(item) }}
            </span>
            <span
              v-if="titleSubtitleText(item)"
              class="entity-card__subtitle"
            >{{ titleSubtitleText(item) }}</span>
          </div>
        </template>
        <template
          v-if="!isEntityLayout"
          #headerTrailing
        >
          <div
            v-if="hasHeaderTrailing(item)"
            class="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5"
          >
            <span
              v-if="headerSuffixPlain(item)"
              class="whitespace-nowrap text-xs text-gray-500 dark:text-white/90"
            >{{ headerSuffixPlain(item) }}</span>
            <span
              v-if="headerSuffixMarkup(item)"
              class="inline-flex items-center gap-1"
              v-html="headerSuffixMarkup(item)"
            />
          </div>
        </template>
        <template v-if="isEntityLayout">
          <div class="flex min-h-0 flex-1 flex-col">
            <div
              v-if="hasHeroExtraContent(item)"
              class="entity-card__hero-extra"
            >
              <div
                v-for="field in heroFields(item)"
                :key="field.name"
                class="entity-card__hero-line"
                :class="[
                  heroLineClass(field),
                  field.heroSpan === 'full' ? 'entity-card__hero-line--full' : '',
                  field.reserveEmpty && !hasFieldValue(item, field) ? 'entity-card__hero-line--reserved' : '',
                  hasHeroInlineActions(field) ? 'entity-card__hero-line--row' : '',
                ]"
              >
                <span
                  v-if="fieldValue(item, field)"
                  class="entity-card__hero-line-start"
                  v-html="fieldValue(item, field)"
                />
                <span
                  v-if="hasHeroInlineActions(field)"
                  class="entity-card__hero-line-end"
                  @click.stop
                >
                  <slot
                    name="hero-inline-actions"
                    :item="item"
                    :field="field"
                  />
                </span>
              </div>
              <div
                v-if="heroActionFields(item).length"
                class="entity-card__hero-line entity-card__hero-line--actions"
                @click.stop
              >
                <slot
                  name="hero-actions"
                  :item="item"
                />
              </div>
            </div>
            <div
              v-if="hasEntityFooter(item)"
              class="entity-card__footer mt-auto"
            >
              <div class="entity-card__footer-start">
                <CardDateBlock
                  v-for="field in footerDateFields(item)"
                  :key="field.name"
                  :date="footerDateValue(item)"
                  :title="fieldValue(item, field)"
                />
                <CardStatusPill
                  v-for="field in footerStatusFields(item)"
                  :key="field.name"
                  :label="footerStatusLabel(item, field)"
                  :color="footerStatusColor(item, field)"
                  :icon-class="footerStatusIconClass(item, field)"
                  :show-chevron="footerStatusShowChevron(item, field)"
                  :status-value="footerStatusValue(item, field)"
                  :statuses="footerStatusStatuses(item, field)"
                  :plain-names="Boolean(field.plainNames)"
                  :disabled="footerStatusDisabled(item, field)"
                  :on-change="footerStatusOnChange(item, field)"
                />
                <TaskAssigneesFlow
                  v-if="bare && heroAssigneesFields(item).length"
                  :item="item"
                />
              </div>
              <div
                v-if="footerCaptionFields(item).length || $slots['entity-footer-actions']"
                class="entity-card__footer-center"
              >
                <span
                  v-for="field in footerCaptionFields(item)"
                  :key="field.name"
                  class="entity-card__footer-caption"
                  :class="field.captionClass"
                  :style="footerCaptionStyle(item, field)"
                  v-html="fieldValue(item, field)"
                />
                <span
                  v-if="$slots['entity-footer-actions']"
                  class="entity-card__footer-actions"
                  @click.stop
                >
                  <slot
                    name="entity-footer-actions"
                    :item="item"
                  />
                </span>
              </div>
              <div class="entity-card__footer-end">
                <div
                  v-if="hasFooterCorner(item)"
                  class="entity-card__footer-corner"
                >
                  <TaskAssigneesFlow
                    v-if="!bare && heroAssigneesFields(item).length"
                    :item="item"
                  />
                  <span
                    v-for="field in footerCornerFields(item)"
                    :key="field.name"
                    class="entity-card__footer-corner-badge"
                    v-html="fieldValue(item, field)"
                  />
                </div>
                <CardAmountBlock
                  v-for="field in footerAmountFields(item)"
                  :key="field.name"
                  :amount="footerAmountPlain(item, field)"
                  :amount-html="footerAmountHtml(item, field)"
                  :sub-label="footerAmountSubPlain(item)"
                  :sub-label-html="footerAmountSubHtml(item)"
                  :sub-color="footerAmountSubColor(item)"
                />
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex flex-col flex-1 min-h-0"
        >
          <div
            v-if="bodyFieldsWithValues(item).length"
            class="flex-1 space-y-1 text-sm text-gray-600 dark:text-white/90"
          >
              <div
                v-for="field in bodyFieldsWithValues(item)"
                :key="field.name"
                class="flex gap-1.5 items-center min-w-0"
              >
                <span
                  v-if="field.icon"
                  class="filter-modal-icon-badge shrink-0"
                ><i :class="field.icon" /></span>
                <span
                  v-if="field.html"
                  class="inline-flex min-w-0 items-center truncate dark:text-white"
                  v-html="fieldValue(item, field)"
                />
                <span
                  v-else
                  class="min-w-0 truncate dark:text-white"
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
                  class="block w-full min-w-0 font-medium"
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
import CardDateBlock from './CardDateBlock.vue';
import CardStatusPill from './CardStatusPill.vue';
import CardAmountBlock from './CardAmountBlock.vue';
import EntityCardCreatorAvatar from './EntityCardCreatorAvatar.vue';
import TaskDeadlineBlock from '@/views/components/tasks/TaskDeadlineBlock.vue';
import TaskAssigneesFlow from '@/views/components/tasks/TaskAssigneesFlow.vue';
import { entityItemDate, entityStatusAccent, mapPaymentStatusColor } from '@/utils/entityCardUtils';
import { DRAFT_ENTITY_CARD_CLASS, isDraftTableRow } from '@/utils/draftTableRowClass';

export default {
    name: 'MapperCardGrid',
    components: {
        Card,
        CardViewEmptyState,
        CardDateBlock,
        CardStatusPill,
        CardAmountBlock,
        EntityCardCreatorAvatar,
        TaskDeadlineBlock,
        TaskAssigneesFlow,
    },
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
        cornerField: {
            type: String,
            default: '',
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
        },
        cardLayout: {
            type: String,
            default: 'list',
        },
        highlightDraftCards: {
            type: Boolean,
            default: false,
        },
        draftStatusValues: {
            type: Array,
            default: () => ['draft', 'in_progress'],
        },
        entity: {
            type: Object,
            default: null,
        },
        bare: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        normalizedItems() {
            return Array.isArray(this.items) ? this.items : [];
        },
        isEntityLayout() {
            return this.cardLayout === 'entity';
        },
        gridClass() {
            if (this.isEntityLayout) {
                return 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
            }
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        },
    },
    methods: {
        titleText(item) {
            return this.cardMapper(item, this.titleField) || '—';
        },
        titleTextHtml(item) {
            const value = this.titleText(item);
            return value === '—' ? value : String(value);
        },
        titleSubtitleText(item) {
            if (!this.titleSubtitleField) return '';
            const v = this.cardMapper(item, this.titleSubtitleField);
            return v !== null && v !== undefined && v !== '' ? String(v) : '';
        },
        titlePrefixHtml(item) {
            return this.titlePrefix ? this.titlePrefix(item) : null;
        },
        cornerFieldValue(item) {
            if (!this.cornerField) {
                return '';
            }
            const value = this.cardMapper(item, this.cornerField);
            if (value == null || value === '' || value === '—') {
                return '';
            }
            return String(value);
        },
        hasHeaderTrailing(item) {
            if (this.isEntityLayout) {
                return Boolean(
                    this.$slots['entity-header-actions']
                    || this.headerCreatorUser(item)
                    || this.headerSuffixPlain(item)
                    || this.headerSuffixMarkup(item)
                    || this.headerBadgeFields(item).length
                    || this.headerDeadlineFields(item).length
                );
            }
            return Boolean(this.headerSuffixPlain(item) || this.headerSuffixMarkup(item));
        },
        headerCreatorUser(item) {
            return this.entity?.headerCreator?.(item) ?? null;
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
            if (this.isEntityLayout && this.entity?.headerSuffix) {
                return this.entity.headerSuffix(item);
            }
            return this.headerSuffix ? this.headerSuffix(item) : null;
        },
        isFieldVisible(item, field) {
            if (field.visible === false) {
                return false;
            }
            if (field.visible == null || field.visible === true) {
                return true;
            }
            return field.visible(item);
        },
        resolvedFields(item) {
            return (this.cardConfig || []).filter((field) => {
                if (field.name === this.titleField) {
                    return false;
                }
                if (this.titleSubtitleField && field.name === this.titleSubtitleField) {
                    return false;
                }
                if (this.headerSuffixField && field.name === this.headerSuffixField) {
                    return false;
                }
                if (!this.isFieldVisible(item, field)) {
                    return false;
                }
                return this.hasFieldValue(item, field);
            });
        },
        fieldsBySlot(item, slot) {
            return this.resolvedFields(item).filter((field) => (field.slot || 'meta') === slot);
        },
        heroActionFields(item) {
            return this.resolvedFields(item).filter((field) => {
                if (field.slot !== 'hero-actions') {
                    return false;
                }
                return this.isFieldVisible(item, field);
            });
        },
        hasHeroExtraContent(item) {
            return this.heroFields(item).length > 0 || this.heroActionFields(item).length > 0;
        },
        heroFields(item) {
            return (this.cardConfig || []).filter((field) => {
                if ((field.slot || 'meta') !== 'hero') {
                    return false;
                }
                if (field.name === this.titleField) {
                    return false;
                }
                if (this.titleSubtitleField && field.name === this.titleSubtitleField) {
                    return false;
                }
                if (this.headerSuffixField && field.name === this.headerSuffixField) {
                    return false;
                }
                if (!this.isFieldVisible(item, field)) {
                    return false;
                }
                if (field.reserveEmpty) {
                    return true;
                }
                return this.hasFieldValue(item, field);
            });
        },
        titleMetaFields(item) {
            return (this.cardConfig || []).filter((field) => {
                if ((field.slot || 'meta') !== 'title-meta') {
                    return false;
                }
                if (field.name === this.titleField) {
                    return false;
                }
                if (this.titleSubtitleField && field.name === this.titleSubtitleField) {
                    return false;
                }
                if (!this.isFieldVisible(item, field)) {
                    return false;
                }
                if (field.reserveEmpty) {
                    return true;
                }
                return this.hasFieldValue(item, field);
            });
        },
        metaFields(item) {
            return this.fieldsBySlot(item, 'meta');
        },
        headerBadgeFields(item) {
            return this.fieldsBySlot(item, 'header-badge');
        },
        headerDeadlineFields(item) {
            return this.fieldsBySlot(item, 'header-deadline');
        },
        footerCornerFields(item) {
            return this.fieldsBySlot(item, 'footer-corner');
        },
        heroAssigneesFields(item) {
            return this.fieldsBySlot(item, 'hero-assignees');
        },
        heroDeadlineFields(item) {
            return this.fieldsBySlot(item, 'hero-deadline');
        },
        footerDateFields(item) {
            return this.fieldsBySlot(item, 'footer-date');
        },
        footerCaptionFields(item) {
            return this.fieldsBySlot(item, 'footer-caption');
        },
        footerStatusFields(item) {
            return this.fieldsBySlot(item, 'footer-status');
        },
        footerAmountFields(item) {
            return this.fieldsBySlot(item, 'footer-amount');
        },
        footerAmountSubFields(item) {
            return this.fieldsBySlot(item, 'footer-amount-sub');
        },
        hasEntityFooter(item) {
            return this.footerDateFields(item).length
                || this.footerCaptionFields(item).length
                || this.footerStatusFields(item).length
                || this.footerAmountFields(item).length
                || (this.bare && this.heroAssigneesFields(item).length > 0)
                || this.hasFooterCorner(item);
        },
        hasFooterCorner(item) {
            const hasAssignees = this.heroAssigneesFields(item).length > 0 && !this.bare;
            return hasAssignees || this.footerCornerFields(item).length > 0;
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
            if (field.slot === 'footer-date') {
                return Boolean(this.itemDate(item));
            }
            if (field.slot === 'hero-deadline') {
                return Boolean(item?.[field.name]);
            }
            if (field.slot === 'header-deadline') {
                return Boolean(item?.[field.name]);
            }
            if (field.slot === 'footer-corner') {
                const v = this.cardMapper(item, field.name);
                return v != null && v !== '' && v !== '—';
            }
            if (field.slot === 'hero-assignees') {
                return Boolean(item?.supervisor || item?.executor);
            }
            const v = this.cardMapper(item, field.name);
            return v != null && v !== '' && v !== '—';
        },
        itemDate(item) {
            const resolve = this.entity?.dateOf ?? entityItemDate;
            return resolve(item);
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
            return 'text-gray-800 dark:text-white';
        },
        entityCardItemClass(item) {
            if (!this.isEntityLayout) {
                return '';
            }
            const classes = ['entity-card'];
            if (this.entity?.showAccent !== false) {
                classes.push('entity-card--accent');
            }
            if (this.highlightDraftCards && isDraftTableRow(item, this.draftStatusValues)) {
                classes.push(DRAFT_ENTITY_CARD_CLASS);
            }
            if (this.entity?.isInactiveCard?.(item)) {
                classes.push(DRAFT_ENTITY_CARD_CLASS);
            }
            return classes.join(' ');
        },
        itemAccentColor(item) {
            const resolve = this.entity?.accentColor ?? entityStatusAccent;
            return resolve(item);
        },
        entityCardStyle(item) {
            if (!this.isEntityLayout || this.entity?.showAccent === false) {
                return null;
            }
            const color = this.itemAccentColor(item);
            if (!color) {
                return null;
            }
            return { '--entity-accent': color };
        },
        footerStatusShowChevron(item, field) {
            if (!this.footerStatusOnChange(item, field)) {
                return false;
            }
            return this.footerStatusValue(item, field) != null;
        },
        hasHeroInlineActions(field) {
            return Boolean(field?.inlineActions && this.$slots['hero-inline-actions']);
        },
        heroLineClass(field) {
            if (!field.lineClamp) {
                return '';
            }
            const lines = field.lineClamp === true ? 2 : Number(field.lineClamp) || 2;
            return [
                'entity-card__hero-line--clamp',
                `entity-card__hero-line--clamp-${lines}`,
            ];
        },
        resolveStatusPill() {
            return this.entity?.statusPill ?? null;
        },
        footerDateValue(item) {
            return this.itemDate(item);
        },
        footerStatusLabel(item, field) {
            const pill = this.resolveStatusPill();
            if (pill?.getLabel) {
                return pill.getLabel(item, field.name) || this.fieldValue(item, field);
            }
            return this.fieldValue(item, field);
        },
        footerStatusColor(item, field) {
            const pill = this.resolveStatusPill();
            if (pill?.getColor) {
                return pill.getColor(item, field.name) || '';
            }
            if (field.statusColor) {
                return typeof field.statusColor === 'function'
                    ? field.statusColor(item)
                    : field.statusColor;
            }
            return '';
        },
        footerStatusIconClass(item, field) {
            if (!field.statusIconClass) {
                return '';
            }
            return typeof field.statusIconClass === 'function'
                ? field.statusIconClass(item)
                : field.statusIconClass;
        },
        footerStatusValue(item, field) {
            const pill = this.resolveStatusPill();
            if (pill?.getValue) {
                return pill.getValue(item, field.name);
            }
            if (field.statusValue) {
                return typeof field.statusValue === 'function'
                    ? field.statusValue(item)
                    : field.statusValue;
            }
            return null;
        },
        footerStatusStatuses(item, field) {
            const pill = this.resolveStatusPill();
            if (pill?.getStatuses) {
                return pill.getStatuses() || [];
            }
            if (field.statuses) {
                return typeof field.statuses === 'function'
                    ? field.statuses(item) || []
                    : field.statuses || [];
            }
            return [];
        },
        footerStatusDisabled(item, field) {
            if (!field.disabled) {
                return false;
            }
            return typeof field.disabled === 'function' ? field.disabled(item) : field.disabled;
        },
        footerStatusOnChange(item, field) {
            if (this.resolveStatusPill()?.onChange || field.onChange) {
                return (value) => this.handleFooterStatusChange(item, field, value);
            }
            return null;
        },
        handleFooterStatusChange(item, field, value) {
            const pill = this.resolveStatusPill();
            if (pill?.onChange) {
                pill.onChange(item, value, field.name);
                return;
            }
            if (field.onChange) {
                field.onChange(item, value);
            }
        },
        footerAmountPlain(item, field) {
            if (field.html) {
                return '';
            }
            return this.fieldValue(item, field);
        },
        footerAmountHtml(item, field) {
            if (!field.html) {
                return '';
            }
            return this.fieldValue(item, field);
        },
        footerAmountSubPlain(item) {
            const fields = this.footerAmountSubFields(item);
            if (!fields.length || fields[0].html) {
                return '';
            }
            return this.fieldValue(item, fields[0]);
        },
        footerAmountSubHtml(item) {
            const fields = this.footerAmountSubFields(item);
            if (!fields.length || !fields[0].html) {
                return '';
            }
            return this.fieldValue(item, fields[0]);
        },
        footerAmountSubColor(item) {
            const fields = this.footerAmountSubFields(item);
            if (!fields.length || fields[0].html) {
                return '';
            }
            const resolve = this.entity?.paymentSubColor ?? mapPaymentStatusColor;
            return resolve(item) || '';
        },
        footerCaptionStyle(item, field) {
            const resolve = field.captionColor ?? this.entity?.captionColor;
            if (!resolve) {
                return undefined;
            }
            const color = resolve(item, field);
            return color ? { color } : undefined;
        },
    },
};
</script>
