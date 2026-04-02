<template>
  <transition
    name="timeline-slide"
    appear
  >
    <div class="h-full w-[420px] bg-white z-[10] shadow-xl flex flex-col">
      <div class="sticky top-0 z-20 flex justify-between items-center p-4 bg-white">
        <h2 class="text-lg font-bold">
          {{ $t('timelineHistoryAndComments') }}
        </h2>
        <button
          class="text-gray-500 hover:text-black transition-colors duration-200"
          @click="toggleTimeline"
        >
          <i class="fas fa-times" />
        </button>
      </div>


      <div class="flex-1 p-4 overflow-auto text-sm">
        <!-- Календарь праздников -->
        <div class="mb-6">
          <HolidayCalendar />
        </div>

        <div
          v-if="loading"
          class="min-h-64"
        >
          <TableSkeleton />
        </div>
        <div
          v-else-if="timeline.length === 0"
          class="text-gray-400"
        >
          {{ $t('noData') }}
        </div>
        <div
          v-else
          class="relative"
        >
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />


          <div
            v-for="(dayGroup, dayKey) in groupedTimeline"
            :key="dayKey"
            class="mb-6"
          >
            <div class="flex justify-center mb-4">
              <div class="bg-gray-100 px-4 py-2 rounded-lg">
                <div class="text-sm font-bold text-gray-700">
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
                    class="w-3 h-3 rounded-full border-2 border-white shadow-sm relative z-10 mt-1"
                    :class="item.type === 'comment' ? 'bg-blue-500' : 'bg-green-500'"
                  />
                </div>


                <div class="flex-1 ml-3 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm text-gray-900">
                      {{ item.user?.name || $t('timelineSystemAutoUser') }}
                    </span>
                    <span class="text-xs text-gray-500">{{ formatTime(item.createdAt) }}</span>
                  </div>


                  <div class="text-sm text-gray-700">
                    <template v-if="item.type === 'comment'">
                      <div class="flex items-start">
                        <i class="fas fa-comment text-blue-500 mr-2 mt-0.5 text-xs" />
                        <span class="break-words">{{ item.body }}</span>
                      </div>
                    </template>
                    <template v-else-if="item.type === 'log'">
                      <div class="flex items-start">
                        <i class="fas fa-edit text-green-500 mr-2 mt-0.5 text-xs" />
                        <div class="flex-1">
                          <div class="flex items-center flex-wrap gap-2">
                            <span
                              v-if="item.meta && item.meta.transactionId"
                              class="text-blue-600 underline cursor-pointer hover:text-blue-700"
                              @click="openTransaction(item.meta.transactionId)"
                            >
                              {{ formatLogDescription(item.description) }}
                            </span>
                            <span v-else>
                              {{ formatLogDescription(item.description) }}
                            </span>
                            <span
                              v-if="item.meta && item.meta.productPrice != null"
                              class="text-xs text-gray-600"
                            >
                              {{ $t('price') }}:
                              {{ formatCurrency(item.meta.productPrice,
                                                item.meta.productCurrencySymbol || defaultCurrencySymbol)
                              }}
                            </span>
                          </div>


                          <div
                            v-if="item.changes?.attributes && shouldShowChanges(item)"
                            class="mt-2 space-y-1"
                          >
                            <div
                              v-for="(val, key) in filteredChanges(item.changes.attributes, item.changes.old)"
                              :key="key"
                              class="text-xs bg-gray-50 px-2 py-1 rounded"
                            >
                              <span class="font-medium">{{ smartTranslateField(key, type)
                              }}:</span>
                              <div class="flex items-center space-x-1 mt-1">
                                <span
                                  class="text-red-600 line-through px-1 bg-red-50 rounded"
                                >
                                  {{ formatFieldValue(key, item.changes.old?.[key],
                                                      item.meta) ?? '0' }}
                                </span>
                                <span class="text-gray-400">→</span>
                                <span class="text-green-600 px-1 bg-green-50 rounded">
                                  {{ formatFieldValue(key, val, item.meta) ?? '0' }}
                                </span>
                              </div>
                            </div>
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


      <div class="p-4 bg-[#edf4fb]">
        <div class="flex space-x-2">
          <textarea
            v-model="newComment"
            class="flex-1 h-8 max-h-[120px] border rounded px-3 py-2 resize-y text-sm"
            :placeholder="$t('timelineCommentPlaceholder')"
          />
          <button
            :disabled="!newComment.trim() || loading || sending"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
import HolidayCalendar from '@/views/components/app/HolidayCalendar.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import {
    ORDER_TIMELINE_PRODUCT_ADDED_PREFIX,
    ORDER_TIMELINE_PRODUCT_REMOVED_PREFIX,
} from '@/constants/orderTimelineApiDescriptions';

export default {
    components: {
        HolidayCalendar,
        TableSkeleton,
    },
    props: {
        type: { type: String, required: true },
        id: { type: [String, Number], required: true },
        isCollapsed: { type: Boolean, default: true },
    },
    emits: ['toggle-timeline'],
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
        formatLogDescription(description) {
            return description;
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
            if (item.description === ORDER_TIMELINE_PRODUCT_ADDED_PREFIX ||
                item.description === ORDER_TIMELINE_PRODUCT_REMOVED_PREFIX) {
                return false;
            }
            return true;
        },
        formatCurrency(value, symbol) {
            return formatCurrencyUtil(value, symbol);
        },
        formatFieldValue(key, value, meta = null) {
            if (value === null || value === undefined || value === '') {
                return '0';
            }

            // Специальная обработка для статусов
            if (key === 'status_id' && (this.type === 'order' || this.type === 'task')) {
                return this.getStatusName(value);
            }

            // Обычная обработка ID полей
            if (key.endsWith('_id')) {
                return value;
            }

            // Форматирование специальных полей
            switch (key) {
                case 'total_price':
                case 'price':
                case 'amount':
                    const currencySymbol = (meta && meta.productCurrencySymbol) || this.defaultCurrencySymbol || '₽';
                    return formatCurrencyUtil(value, currencySymbol);
                case 'quantity':
                    const numValue = Number(value);
                    const decimals = Number(this.quantityDecimals);
                    const formattedQuantity = !isNaN(numValue) ? formatNumberUtil(numValue, decimals) : value;
                    if (meta && meta.productUnit) {
                        return `${formattedQuantity} ${meta.productUnit}`.trim();
                    }
                    return formattedQuantity;
                case 'created_at':
                case 'updated_at':
                    return dayjs(value).format('DD.MM.YYYY HH:mm');
                default:
                    return value;
            }
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
