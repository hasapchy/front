<template>
  <transition
    name="timeline-slide"
    appear
  >
    <div class="z-[10] flex h-full w-[420px] flex-col bg-white shadow-xl dark:bg-[var(--surface-elevated)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.45)]">
      <div class="sticky top-0 z-20 flex items-center justify-between border-b border-transparent bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
        <h2 class="text-lg font-bold text-gray-900 dark:text-[var(--text-primary)]">
          {{ $t('timelineHistoryAndComments') }}
        </h2>
        <button
          type="button"
          class="text-gray-500 transition-colors duration-200 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
          @click="toggleTimeline"
        >
          <i class="fas fa-times" />
        </button>
      </div>


      <div class="flex-1 overflow-auto p-4 text-sm text-gray-700 dark:text-[var(--text-primary)]">
        <div
          v-if="loading"
          class="min-h-64"
        >
          <TableSkeleton />
        </div>
        <div
          v-else-if="timeline.length === 0"
          class="text-gray-400 dark:text-[var(--text-secondary)]"
        >
          {{ $t('noData') }}
        </div>
        <div
          v-else
          class="relative"
        >
          <div class="pointer-events-none absolute bottom-0 left-4 top-0 w-0.5 bg-gray-300 dark:bg-[var(--border-subtle)]" />


          <div
            v-for="(dayGroup, dayKey) in groupedTimeline"
            :key="dayKey"
            class="mb-6"
          >
            <div class="mb-4 flex justify-center">
              <div class="rounded-lg bg-gray-100 px-4 py-2 dark:bg-[var(--surface-muted)]">
                <div class="text-sm font-bold text-gray-700 dark:text-[var(--text-primary)]">
                  {{ formatDayHeader(dayKey) }}
                </div>
              </div>
            </div>


            <div
              v-for="item in dayGroup"
              :key="item.type + '_' + item.id"
              class="relative mb-4"
            >
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 flex justify-center relative">
                  <div
                    class="relative z-10 mt-1 h-3 w-3 rounded-full border-2 border-white shadow-sm dark:border-[var(--surface-elevated)]"
                    :class="item.type === 'comment' ? 'bg-blue-500' : 'bg-green-500'"
                  />
                </div>


                <div class="flex-1 ml-3 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <div class="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span class="shrink-0 text-sm font-medium text-gray-900 dark:text-[var(--text-primary)]">
                        {{ item.user?.name || $t('timelineSystemAutoUser') }}
                      </span>
                      <template v-if="item.type === 'log'">
                        <span
                          v-if="timelineLogEventTitle(item)"
                          class="shrink-0 text-xs font-medium text-gray-500 dark:text-[var(--text-secondary)]"
                        >
                          {{ timelineLogEventTitle(item) }}
                        </span>
                        <span class="inline-flex min-w-0 items-center gap-1.5 text-sm text-gray-700 dark:text-[var(--text-primary)]">
                          <i class="fas fa-edit mt-0.5 shrink-0 text-xs text-green-500 dark:text-green-400" />
                          <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                            <span
                              v-if="item.meta && item.meta.transactionId"
                              class="cursor-pointer break-words text-blue-600 underline hover:text-blue-700 dark:text-[var(--label-accent)] dark:hover:text-[var(--label-accent)] dark:hover:opacity-90"
                              @click="openTransaction(item.meta.transactionId)"
                            >
                              {{ formatLogDescription(item) }}
                            </span>
                            <span
                              v-else
                              class="break-words"
                            >
                              {{ formatLogDescription(item) }}
                            </span>
                            <span
                              v-if="item.meta && item.meta.productPrice != null"
                              class="text-xs text-gray-600 dark:text-[var(--text-secondary)]"
                            >
                              {{ $t('price') }}:
                              {{ formatCurrency(item.meta.productPrice,
                                                item.meta.productCurrencySymbol || defaultCurrencySymbol)
                              }}
                            </span>
                          </span>
                        </span>
                      </template>
                    </div>
                    <span class="shrink-0 tabular-nums text-xs text-gray-500 dark:text-[var(--text-secondary)]">{{ formatTime(item.createdAt) }}</span>
                  </div>


                  <div class="text-sm text-gray-700 dark:text-[var(--text-primary)]">
                    <template v-if="item.type === 'comment'">
                      <div class="flex items-start">
                        <i class="fas fa-comment mr-2 mt-0.5 text-xs text-blue-500 dark:text-blue-400" />
                        <span class="break-words">{{ item.body }}</span>
                      </div>
                    </template>
                    <template v-else-if="item.type === 'log'">
                      <div
                        v-if="item.changes?.attributes && shouldShowChanges(item)"
                        class="space-y-1"
                      >
                        <div
                          v-for="(val, key) in filteredChanges(item.changes.attributes, item.changes.old)"
                          :key="key"
                          class="rounded bg-gray-50 px-2 py-1 text-xs dark:bg-[var(--surface-muted)]"
                        >
                          <span class="font-medium">{{ smartTranslateField(key, type)
                          }}:</span>
                          <div class="flex items-center space-x-1 mt-1">
                            <template v-if="isTimelineActivityCreatedEvent(item)">
                              <span class="rounded bg-green-50 px-1 text-green-600 dark:bg-green-950/45 dark:text-green-400">
                                {{ formatTimelineChangeValue(key, val, item.meta) }}
                              </span>
                            </template>
                            <template v-else>
                              <span
                                class="rounded bg-red-50 px-1 text-red-600 line-through dark:bg-red-950/40 dark:text-red-400"
                              >
                                {{ formatTimelineChangeValue(key, item.changes.old?.[key], item.meta) }}
                              </span>
                              <span class="text-gray-400 dark:text-[var(--text-secondary)]">→</span>
                              <span class="rounded bg-green-50 px-1 text-green-600 dark:bg-green-950/45 dark:text-green-400">
                                {{ formatTimelineChangeValue(key, val, item.meta) }}
                              </span>
                            </template>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div class="border-t border-gray-200 bg-[#edf4fb] p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
        <div class="flex space-x-2">
          <textarea
            v-model="newComment"
            class="h-8 max-h-[120px] flex-1 resize-y rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--label-accent)] focus:outline-none focus:ring-1 focus:ring-[color-mix(in_srgb,var(--label-accent)_35%,transparent)] dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
            :placeholder="$t('timelineCommentPlaceholder')"
          />
          <button
            type="button"
            :disabled="!newComment.trim() || loading || sending"
            class="rounded bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--nav-accent)] dark:hover:brightness-110"
            @click="sendComment"
          >
            <i class="fas fa-paper-plane text-xs" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { dayjsDateTime, getCurrentServerDateObject } from '@/utils/dateUtils';
import CommentController from '@/api/CommentController';
import { translateField } from '@/utils/fieldTranslations';
import { formatNumber as formatNumberUtil, formatCurrency as formatCurrencyUtil } from '@/utils/numberUtils';
import dayjs from 'dayjs';
import { translateOrderStatus, translateTaskStatus } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import {
    ORDER_TIMELINE_PRODUCT_ADDED_PREFIX,
    ORDER_TIMELINE_PRODUCT_REMOVED_PREFIX,
} from '@/constants/orderTimelineApiDescriptions';

export default {
    components: {
        TableSkeleton,
    },
    props: {
        type: { type: String, required: true },
        id: { type: [String, Number], required: true },
        isCollapsed: { type: Boolean, default: true },
    },
    emits: ['toggle-timeline', 'open-transaction'],
    data() {
        return {
            timeline: [],
            loading: false,
            sending: false,
            newComment: '',
        };
    },
    computed: {
        sortedTimeline() {
            return [...this.timeline].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        },
        groupedTimeline() {
            const groups = {};
            this.sortedTimeline.forEach(item => {
                const dayKey = dayjs(item.createdAt).format('YYYY-MM-DD');
                if (!groups[dayKey]) {
                    groups[dayKey] = [];
                }
                groups[dayKey].push(item);
            });
            return groups;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.getters.currencies || [];
            const def = currencies.find(c => c.isDefault);
            return def ? def.symbol : '';
        },
        quantityDecimals() {
            const value = Number(this.$store.getters.roundingQuantityDecimals);
            if (!Number.isNaN(value) && value >= 0 && value <= 5) {
                return value;
            }
            return 2;
        }
    },
    watch: {
        type: 'fetchTimeline',
        id: 'fetchTimeline',
    },
    mounted() {
        this.loadInitialData();
    },
    methods: {
        async loadInitialData() {
            await Promise.all([
                this.fetchTimeline(),
                this.loadStatuses(),
                this.loadCurrencies()
            ]);
        },
        toggleTimeline() {
            this.$emit('toggle-timeline');
        },
        openTransaction(id) {
            this.$emit('open-transaction', id);
        },
        async fetchTimeline() {
            this.loading = true;
            try {
                const timeline = await CommentController.getTimeline(this.type, this.id);
                this.timeline = timeline || [];
            } catch (e) {
                console.error('Timeline load failed:', e);
            }
            this.loading = false;
        },
        formatDate(date) {
            return dayjsDateTime(date);
        },
        formatTime(date) {
            return dayjs(date).format('HH:mm');
        },
        formatDayHeader(dateStr) {
            const date = dayjs(dateStr);
            const today = dayjs();
            const yesterday = dayjs().subtract(1, 'day');
            if (date.isSame(today, 'day')) {
                return this.$t('today');
            }
            if (date.isSame(yesterday, 'day')) {
                return this.$t('yesterday');
            }
            const locale = this.$i18n.locale;
            const intlLocale = locale === 'en' ? 'en-US' : locale === 'tm' ? 'ru-RU' : 'ru-RU';
            return new Intl.DateTimeFormat(intlLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date.toDate());
        },
        timelineLogEventTitle(item) {
            const key = item.descriptionKey || '';
            const ev = item.event || '';
            if (ev === 'created' || key.endsWith('.created')) {
                return this.$t('timelineLogEventCreated');
            }
            if (ev === 'updated' || key.endsWith('.updated')) {
                return this.$t('timelineLogEventUpdated');
            }
            if (ev === 'deleted' || key.endsWith('.deleted')) {
                return this.$t('timelineLogEventDeleted');
            }
            return '';
        },
        formatLogDescription(item) {
            const key = item.descriptionKey;
            const params = { ...(item.descriptionParams || {}) };
            if (key && this.$te(key)) {
                if (key.includes('.order_product.') || key.includes('.invoice_product.')) {
                    if (!params.name) {
                        params.name = this.$t('activity_log.defaults.order_product');
                    }
                } else if (key.includes('.order_temp_product.') && !params.name) {
                    params.name = this.$t('activity_log.defaults.temp_product');
                }
                let text = this.$t(key, params);
                if (
                    item.type === 'log' &&
                    item.descriptionKey &&
                    item.meta?.transactionId != null &&
                    item.logName === 'transaction'
                ) {
                    const amt = this.formatCurrency(
                        item.meta.amount,
                        item.meta.currencySymbol || ''
                    );
                    const amountLabel = this.$t('activity_log.timeline.amount', { value: amt });
                    text = `${text} (#${item.meta.transactionId}, ${amountLabel})`;
                }
                return text;
            }
            const fallback =
                item.descriptionFallback != null ? item.descriptionFallback : item.description;
            if (
                item.type === 'log' &&
                item.meta?.transactionId != null &&
                item.logName === 'transaction' &&
                !key
            ) {
                const amt = this.formatCurrency(
                    item.meta.amount,
                    item.meta.currencySymbol || ''
                );
                const amountLabel = this.$t('activity_log.timeline.amount', { value: amt });
                return `${fallback || ''} (#${item.meta.transactionId}, ${amountLabel})`;
            }
            return fallback || '';
        },
        async sendComment() {
            const body = this.newComment.trim();
            if (!body || this.sending) return;

            this.sending = true;
            try {
                const { comment } = await CommentController.create(this.type, this.id, body);
                this.newComment = '';

                const newComment = {
                    type: 'comment',
                    id: comment.id,
                    body: comment.body,
                    user: comment.user,
                    createdAt: comment.createdAt || getCurrentServerDateObject().toISOString(),
                };

                this.timeline.push(newComment);
                this.timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            } catch (e) {
                console.error('Comment send failed:', e);
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
                    subtitle: this.$t('timelineCommentSendFailed'),
                    isDanger: true,
                });
            }
            this.sending = false;
        },
        filteredChanges(newAttrs, oldAttrs) {
            return Object.fromEntries(
                Object.entries(newAttrs).filter(([key, newVal]) => {
                    const oldVal = oldAttrs?.[key] ?? null;
                    return String(oldVal) !== String(newVal) &&
                        !(newVal === null && oldVal === null) &&
                        !(newVal === '' && oldVal === '');
                })
            );
        },
        shouldShowChanges(item) {
            const k = item.descriptionKey || '';
            if (
                k === 'activity_log.order_product.created' ||
                k === 'activity_log.order_product.deleted' ||
                k === 'activity_log.order_temp_product.created' ||
                k === 'activity_log.order_temp_product.deleted'
            ) {
                return false;
            }
            const d = item.description || '';
            if (
                d === ORDER_TIMELINE_PRODUCT_ADDED_PREFIX ||
                d === ORDER_TIMELINE_PRODUCT_REMOVED_PREFIX ||
                d.startsWith(ORDER_TIMELINE_PRODUCT_ADDED_PREFIX) ||
                d.startsWith(ORDER_TIMELINE_PRODUCT_REMOVED_PREFIX)
            ) {
                return false;
            }
            return true;
        },
        isTimelineActivityCreatedEvent(item) {
            return item.event === 'created'
                || (item.descriptionKey || '').endsWith('.created');
        },
        formatCurrency(value, symbol) {
            return formatCurrencyUtil(value, symbol);
        },
        formatTimelineChangeValue(key, value, meta = null) {
            const formatted = this.formatFieldValue(key, value, meta);
            if (formatted === null || formatted === undefined || formatted === '') {
                return this.$t('symbolEmDash');
            }
            return formatted;
        },
        formatFieldValue(key, value, meta = null) {
            if (value === null || value === undefined || value === '') {
                return null;
            }

            if (key === 'type' && this.type === 'transaction') {
                const n = Number(value);
                if (Number.isNaN(n)) {
                    return value;
                }
                return n === 1
                    ? this.$t('display.transactionCategoryIncome')
                    : this.$t('display.transactionCategoryExpense');
            }

            if (key === 'category_id' && this.type === 'transaction') {
                const code = String(value).trim();
                return this.$t(`transactionCategory.${code}`, value);
            }

            if (key === 'currency_id' && this.type === 'transaction') {
                const fromStore = this.resolveCurrencySymbolForTimeline(value);
                if (fromStore) {
                    return fromStore;
                }
            }

            if (key === 'status_id' && (this.type === 'order' || this.type === 'task')) {
                return this.getStatusName(value);
            }

            if (key.endsWith('_id')) {
                return value;
            }

            switch (key) {
                case 'total_price':
                case 'price':
                case 'amount':
                case 'orig_amount': {
                    const currencySymbol = (meta && meta.productCurrencySymbol)
                        || (meta && meta.currencySymbol)
                        || this.defaultCurrencySymbol
                        || '';
                    return formatCurrencyUtil(value, currencySymbol);
                }
                case 'quantity': {
                    const numValue = Number(value);
                    const decimals = Number(this.quantityDecimals);
                    const formattedQuantity = !isNaN(numValue) ? formatNumberUtil(numValue, decimals) : value;
                    if (meta && meta.productUnit) {
                        return `${formattedQuantity} ${meta.productUnit}`.trim();
                    }
                    return formattedQuantity;
                }
                case 'date':
                case 'created_at':
                case 'updated_at':
                    return dayjs(value).format('DD.MM.YYYY HH:mm');
                default:
                    return value;
            }
        },
        resolveCurrencySymbolForTimeline(value) {
            const list = this.$store.getters.currencies || [];
            if (value === null || value === undefined || value === '') {
                return null;
            }
            if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()))) {
                const id = parseInt(String(value).trim(), 10);
                const row = list.find(c => c.id === id);
                return row?.symbol || null;
            }
            const s = String(value).trim();
            const row = list.find(c => c.name === s || c.symbol === s);
            return row?.symbol || null;
        },
        smartTranslateField(key, type) {
            const path = `timelineFieldByType.${type}.${key}`;
            if (this.$te(path)) {
                return this.$t(path);
            }
            return translateField(key);
        },
        refreshTimeline() {
            this.fetchTimeline();
        },
        async loadStatuses() {
            if (this.type === 'order') {
                await this.$store.dispatch('loadOrderStatuses');
            } else if (this.type === 'task') {
                await this.$store.dispatch('loadTaskStatuses');
            }
        },
        async loadCurrencies() {
            await this.$store.dispatch('loadCurrencies');
        },
        getStatusName(statusId) {
            let statuses;
            if (this.type === 'order') {
                statuses = this.$store.getters.orderStatuses;
            } else if (this.type === 'task') {
                statuses = this.$store.getters.taskStatuses;
            } else {
                return statusId;
            }
            const status = statuses?.find(s => s.id === statusId);
            if (!status) return statusId;
            if (this.type === 'order') {
                return translateOrderStatus(status.name, this.$t);
            } else if (this.type === 'task') {
                return translateTaskStatus(status.name, this.$t);
            }
            return status.name;
        }
    }
};
</script>
