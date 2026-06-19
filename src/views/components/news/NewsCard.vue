<template>
    <div ref="cardRoot"
        class="news-card bg-gray-50 dark:bg-[var(--surface-elevated)] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 py-4 sm:py-5 px-4 sm:px-6 md:px-8 hover:shadow-md dark:hover:shadow-lg/20 transition-all"
        :class="news.isImportant ? 'news-card_important' : 'news-card_regular'" :data-news-id="news.id">
        <div class="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div class="shrink-0">
                <div
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-[var(--surface-muted)] flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-white/10">
                    <img v-if="news.author?.photo && authorPhotoUrl" :src="authorPhotoUrl"
                        class="w-full h-full object-cover" :alt="authorFullName" @error="applyAvatarImageFallback">
                    <i v-else class="fas fa-user text-gray-500 dark:text-[var(--text-secondary)] text-xs sm:text-sm" />
                </div>
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span
                        class="font-semibold text-gray-900 dark:text-[var(--text-primary)] text-xs sm:text-sm break-words">
                        {{ authorFullName }}
                    </span>
                    <span
                        class="text-gray-400 dark:text-[var(--text-secondary)] text-xs shrink-0 hidden sm:inline">→</span>
                    <span class="text-gray-500 dark:text-[var(--text-secondary)] text-[10px] sm:text-xs break-words">
                        {{ $t('allUsers') }}
                    </span>
                </div>
                <div class="text-gray-500 dark:text-[var(--text-secondary)] text-[10px] sm:text-xs mt-0.5 break-words">
                    {{ formattedDate }}
                </div>
            </div>

            <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button v-if="$store.getters.hasPermission('news_update')"
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    :title="$t('edit')" @click.stop="$emit('edit', news)">
                    <i class="fas fa-edit text-xs sm:text-sm" />
                </button>
            </div>
        </div>

        <div class="sm:ml-[52px]">
            <div
                class="max-w-full rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm relative bitrix-message-bubble">
                <div v-if="news.isImportant"
                    class="mb-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/45 bg-[var(--color-warning)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning)]">
                    <i class="fas fa-exclamation-circle" />
                    <span>{{ $t('newsImportant') }}</span>
                </div>
                <h3 class="text-sm sm:text-base font-bold text-gray-900 dark:text-[var(--text-primary)] mb-2 sm:mb-3 leading-tight break-words relative z-10"
                    v-html="highlightedTitle" />

                <div class="text-gray-900 text-sm sm:text-base leading-relaxed relative z-10">
                    <div class="news-content" :class="{ 'news-content_collapsed': shouldCollapse }"
                        v-html="fullContent" />
                    <button v-if="showExpandButton" type="button"
                        class="mt-2 text-sm font-medium text-[var(--nav-accent)] hover:text-[var(--nav-accent)] dark:text-[var(--label-accent)] dark:hover:text-[var(--label-accent)] hover:underline focus:outline-none"
                        @click="contentExpanded = !contentExpanded">
                        {{ contentExpanded ? $t('collapse') : $t('expand') }}
                    </button>
                </div>
            </div>

            <NewsEngagementSection ref="engagementSection" :news-id="Number(news.id)"
                :comments-count="Number(news.commentsCount || 0)" :reactions-summary="news.reactionsSummary || []"
                :unread-comments-count="Number(news.unreadCommentsCount || 0)"
                @unread-cleared="$emit('unread-cleared', $event)"
                @comments-count-changed="$emit('comments-count-changed', $event)" @viewed-updated="onViewedUpdated"
                @acknowledged-updated="onAcknowledgedUpdated">
                <template #header-right>
                    <button v-if="news.isImportant && !news.acknowledgedByMe" type="button"
                        class="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/45 px-2.5 py-1 font-medium text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/10 disabled:opacity-60"
                        :disabled="acknowledging" @click="acknowledgeNews">
                        <i class="fas" :class="acknowledging ? 'fa-spinner fa-spin' : 'fa-check-circle'" />
                        {{ $t('newsAcknowledge') }}
                    </button>
                    <div v-if="news.isImportant && acknowledgedByCount > 0"
                        class="inline-flex items-center gap-1 rounded-full border border-[var(--color-success)]/40 px-2.5 py-1 font-medium text-[var(--color-success)]">
                        <CommentViewedByTooltip trigger="click" icon="fa-user-check" :viewed-by="news.acknowledgedBy"
                            :visible="acknowledgedByPopoverOpen" :title="$t('newsAcknowledged')"
                            @toggle="toggleAcknowledgedByPopover" @hover-end="acknowledgedByPopoverOpen = false" />
                        {{ acknowledgedByCount }}
                    </div>

                    <div v-if="viewedByCount > 0"
                        class="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 font-medium text-gray-600 dark:border-white/10 dark:text-[var(--text-secondary)]">
                        <CommentViewedByTooltip trigger="click" :viewed-by="news.viewedBy"
                            :visible="viewedByPopoverOpen" @toggle="toggleViewedByPopover"
                            @hover-end="viewedByPopoverOpen = false" />
                        {{ viewedByCount }}
                    </div>
                </template>
            </NewsEngagementSection>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import DOMPurify from 'dompurify';
import { applyAvatarImageFallback } from '@/constants/imageFallback';
import NewsEngagementSection from '@/views/components/news/NewsEngagementSection.vue';
import CommentViewedByTooltip from '@/views/components/app/comments/CommentViewedByTooltip.vue';
import NewsController from '@/api/NewsController';

const COLLAPSE_PLAIN_TEXT_LENGTH = 400;

export default {
    name: 'NewsCard',
    components: {
        NewsEngagementSection,
        CommentViewedByTooltip,
    },
    props: {
        news: {
            type: Object,
            required: true
        },
        compact: {
            type: Boolean,
            default: true
        }
    },
    emits: ['edit', 'unread-cleared', 'comments-count-changed'],
    data() {
        return {
            contentExpanded: false,
            acknowledging: false,
            hasMarkedViewed: false,
            viewedObserver: null,
            viewedByPopoverOpen: false,
            acknowledgedByPopoverOpen: false,
        };
    },
    computed: {
        hasContent() {
            return this.stripHtml(this.news.content).length > 0;
        },
        isLongContent() {
            const plain = this.stripHtml(this.news.content);
            return plain.length > COLLAPSE_PLAIN_TEXT_LENGTH;
        },
        shouldCollapse() {
            if (this.contentExpanded) return false;
            if (this.compact) return this.hasContent;
            return this.isLongContent;
        },
        showExpandButton() {
            if (this.compact) return this.hasContent;
            return this.isLongContent;
        },
        authorPhotoUrl() {
            if (!this.news.author?.photo) return null;
            if (this.news.author.photo.startsWith('http')) {
                return this.news.author.photo;
            }
            const baseUrl = import.meta.env.VITE_APP_BASE_URL;
            return `${baseUrl}/storage/${this.news.author.photo}`;
        },
        authorFullName() {
            if (!this.news.author) {
                return this.$t('unknownAuthor');
            }
            const name = this.news.author.name;
            const surname = this.news.author.surname;
            const fullName = `${name} ${surname}`.trim();
            return fullName || this.$t('unknownAuthor');
        },
        formattedDate() {
            if (!this.news.createdAt) return '';
            const locale = this.$i18n.locale || 'ru';
            const localeMap = {
                'ru': 'ru',
                'en': 'en',
                'tm': 'tk'
            };
            const dayjsLocale = localeMap[locale] || 'ru';

            return dayjs(this.news.createdAt)
                .locale(dayjsLocale)
                .format('DD MMMM YYYY HH:mm');
        },
        viewedByCount() {
            return Array.isArray(this.news.viewedBy) ? this.news.viewedBy.length : 0;
        },
        acknowledgedByCount() {
            return Array.isArray(this.news.acknowledgedBy) ? this.news.acknowledgedBy.length : 0;
        },
        currentUserDisplayName() {
            const name = this.$store.state.user?.name || '';
            const surname = this.$store.state.user?.surname || '';
            return `${name} ${surname}`.trim();
        },
        fullContent() {
            const content = this.news.content;
            if (!content) return '';

            const hasHtmlEntities = /&lt;[a-z]/i.test(content) || /&gt;/.test(content);

            let processedContent = content;

            if (hasHtmlEntities) {
                processedContent = content
                    .replace(/&amp;lt;/g, '<')
                    .replace(/&amp;gt;/g, '>')
                    .replace(/&amp;amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&#x27;/g, "'")
                    .replace(/&#x2F;/g, '/')
                    .replace(/&#47;/g, '/');
            }

            let sanitizedContent = DOMPurify.sanitize(processedContent, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[-+a-z.:]|$))/i
            });

            return sanitizedContent;
        },
        highlightedTitle() {
            const title = this.news.title;
            if (!title) return '';

            return DOMPurify.sanitize(title, {
                ALLOWED_TAGS: ['mark'],
                ALLOWED_ATTR: ['class']
            });
        }
    },
    methods: {
        applyAvatarImageFallback,
        toggleAcknowledgedByPopover() {
            this.viewedByPopoverOpen = false;
            this.acknowledgedByPopoverOpen = !this.acknowledgedByPopoverOpen;
        },
        toggleViewedByPopover() {
            this.acknowledgedByPopoverOpen = false;
            this.viewedByPopoverOpen = !this.viewedByPopoverOpen;
        },
        ensureCurrentUserInViewedBy(viewedAt) {
            const user = this.$store.state.user || {};
            const userId = Number(user.id || 0);
            const name = `${user.name || ''} ${user.surname || ''}`.trim();
            if (userId <= 0 || !name || !viewedAt) return;

            const viewedBy = Array.isArray(this.news.viewedBy) ? [...this.news.viewedBy] : [];
            const index = viewedBy.findIndex((row) => Number(row.user_id || row.userId) === userId);
            const nextRow = { user_id: userId, name, viewed_at: viewedAt, viewedAt };
            if (index >= 0) {
                viewedBy.splice(index, 1, { ...viewedBy[index], ...nextRow });
            } else {
                viewedBy.push(nextRow);
            }
            this.news.viewedBy = viewedBy;
        },
        async acknowledgeNews() {
            if (this.acknowledging || !this.news?.id || !this.news?.isImportant) return;
            this.acknowledging = true;
            try {
                const result = await NewsController.acknowledge(this.news.id);
                const wasAcknowledgedByMe = Boolean(this.news.acknowledgedByMe);
                this.news.acknowledgedByMe = true;
                this.news.acknowledgedAt = result?.acknowledged_at ?? null;
                if (!Array.isArray(this.news.acknowledgedBy)) {
                    this.news.acknowledgedBy = [];
                }
                const currentUserId = Number(this.$store.state.user?.id || 0);
                const exists = this.news.acknowledgedBy.some((row) => Number(row?.user_id || row?.userId || 0) === currentUserId);
                if (!exists && currentUserId > 0 && this.currentUserDisplayName) {
                    this.news.acknowledgedBy.unshift({
                        user_id: currentUserId,
                        name: this.currentUserDisplayName,
                        viewed_at: this.news.acknowledgedAt,
                    });
                }
                if (!wasAcknowledgedByMe) {
                    this.news.acknowledgementsCount = Number(this.news.acknowledgementsCount || 0) + 1;
                }
                this.ensureCurrentUserInViewedBy(this.news.acknowledgedAt);
            } finally {
                this.acknowledging = false;
            }
        },
        async markViewedOnce() {
            if (this.hasMarkedViewed || !this.news?.id) return;
            this.hasMarkedViewed = true;
            try {
                const result = await NewsController.markViewed(this.news.id);
                this.ensureCurrentUserInViewedBy(result?.viewed_at || new Date().toISOString());
            } catch {
                this.hasMarkedViewed = false;
            }
        },
        setupViewedObserver() {
            if (!this.$refs.cardRoot || this.viewedObserver) return;
            this.viewedObserver = new IntersectionObserver((entries) => {
                if (!entries[0]?.isIntersecting) return;
                this.markViewedOnce();
                this.viewedObserver?.disconnect();
                this.viewedObserver = null;
            }, { root: null, threshold: 0.35 });
            this.viewedObserver.observe(this.$refs.cardRoot);
        },
        stripHtml(html) {
            if (!html) return '';
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText;
        },
        scrollIntoView() {
            this.$refs.cardRoot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        async openComments() {
            await this.$refs.engagementSection?.openComments();
        },
        onViewedUpdated(payload) {
            if (Array.isArray(payload?.viewed_by)) {
                this.news.viewedBy = payload.viewed_by;
            }
        },
        onAcknowledgedUpdated(payload) {
            if (Array.isArray(payload?.acknowledged_by)) {
                this.news.acknowledgedBy = payload.acknowledged_by;
                this.news.acknowledgementsCount = payload.acknowledged_by.length;
            }
        },
    },
    mounted() {
        this.setupViewedObserver();
    },
    beforeUnmount() {
        this.viewedObserver?.disconnect();
        this.viewedObserver = null;
    },
}
</script>

<style scoped>
.news-card {
    transition: all 0.2s ease;
}

.news-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #374151;
}

.news-content_collapsed {
    max-height: 8rem;
    overflow: hidden;
    position: relative;
}

.news-content_collapsed::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3rem;
    background: linear-gradient(to top, rgba(248, 250, 252, 1), transparent);
    pointer-events: none;
}

.news-content :deep(p) {
    margin-bottom: 0.75rem;
    line-height: 1.7;
    color: #374151;
    font-size: inherit;
}

@media (min-width: 640px) {
    .news-content :deep(p) {
        margin-bottom: 1rem;
        line-height: 1.75;
    }
}

.news-content :deep(p:last-child) {
    margin-bottom: 0;
}

.news-content :deep(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #111827;
    line-height: 1.2;
}

.news-content :deep(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #111827;
    line-height: 1.3;
}

.news-content :deep(h3) {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #1f2937;
    line-height: 1.4;
}

.news-content :deep(h4) {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #1f2937;
    line-height: 1.4;
}

.news-content :deep(h5) {
    font-size: 0.9375rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #374151;
    line-height: 1.5;
}

.news-content :deep(h6) {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    color: #374151;
    line-height: 1.5;
}

@media (min-width: 640px) {
    .news-content :deep(h1) {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        margin-top: 1rem;
    }

    .news-content :deep(h2) {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
        margin-top: 1rem;
    }

    .news-content :deep(h3) {
        font-size: 1.5rem;
    }

    .news-content :deep(h4) {
        font-size: 1.25rem;
    }

    .news-content :deep(h5) {
        font-size: 1.125rem;
    }

    .news-content :deep(h6) {
        font-size: 1rem;
    }
}

.news-content :deep(ul),
.news-content :deep(ol) {
    margin-left: 1.5rem;
    margin-bottom: 0.75rem;
    margin-top: 0.5rem;
    padding-left: 0.5rem;
    list-style-type: disc;
}

@media (min-width: 640px) {

    .news-content :deep(ul),
    .news-content :deep(ol) {
        margin-left: 1.75rem;
        margin-bottom: 1rem;
    }
}

.news-content :deep(ol) {
    list-style-type: decimal;
}

.news-content :deep(ul) {
    list-style-type: disc;
}

.news-content :deep(li) {
    margin-bottom: 0.5rem;
    line-height: 1.7;
    color: #374151;
    display: list-item;
}

@media (min-width: 640px) {
    .news-content :deep(li) {
        margin-bottom: 0.75rem;
        line-height: 1.75;
    }
}

.news-content :deep(ul li) {
    list-style-type: disc;
}

.news-content :deep(ol li) {
    list-style-type: decimal;
}

.news-content :deep(blockquote) {
    border-left: 4px solid #3b82f6;
    padding: 0.75rem 1rem 0.75rem 1.5rem;
    margin: 0.75rem 0;
    font-style: italic;
    color: #4b5563;
    background-color: #f9fafb;
    border-radius: 0 0.5rem 0.5rem 0;
}

@media (min-width: 640px) {
    .news-content :deep(blockquote) {
        padding: 1rem 1.25rem 1rem 1.75rem;
        margin: 1rem 0;
    }
}

.news-content :deep(code) {
    background-color: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-family: 'Courier New', 'Monaco', monospace;
    font-size: 0.875em;
    color: #dc2626;
    font-weight: 500;
}

.news-content :deep(pre) {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.75rem 0;
    border: 1px solid #374151;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (min-width: 640px) {
    .news-content :deep(pre) {
        padding: 1rem 1.25rem;
        margin: 1rem 0;
    }
}

.news-content :deep(pre code) {
    background-color: transparent;
    padding: 0;
    color: inherit;
}

.news-content :deep(img) {
    max-width: 100%;
    max-height: 350px;
    height: auto;
    border-radius: 0.5rem;
    margin: 0.75rem 0;
    display: block;
    object-fit: contain;
    object-position: left top;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 640px) {
    .news-content :deep(img) {
        max-height: 450px;
        border-radius: 0.75rem;
        margin: 1rem 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
}

@media (min-width: 1024px) {
    .news-content :deep(img) {
        max-height: 550px;
    }
}

.news-content :deep(a) {
    color: #2563eb;
    text-decoration: none;
    border-bottom: 1px solid #93c5fd;
    transition: all 0.2s ease;
    font-weight: 500;
}

.news-content :deep(a:hover) {
    color: #1d4ed8;
    border-bottom-color: #2563eb;
}

.news-content :deep(strong),
.news-content :deep(b) {
    font-weight: 600;
}

.news-content :deep(em),
.news-content :deep(i) {
    font-style: italic;
}

.news-content :deep(u) {
    text-decoration: underline;
}

.news-content :deep(s),
.news-content :deep(strike) {
    text-decoration: line-through;
}

.news-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 640px) {
    .news-content :deep(table) {
        margin: 1rem 0;
    }
}

.news-content :deep(th),
.news-content :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
    text-align: left;
}

@media (min-width: 640px) {

    .news-content :deep(th),
    .news-content :deep(td) {
        padding: 0.75rem 1rem;
    }
}

.news-content :deep(th) {
    background-color: #f9fafb;
    font-weight: 600;
    color: #111827;
}

.news-content :deep(td) {
    background-color: #ffffff;
}

.news-content :deep(table table) {
    margin: 0.5rem 0;
}

.news-content :deep(span[style*="background-color"]),
.news-content :deep(mark[style*="background-color"]) {
    padding: 0.125rem 0.25rem;
    border-radius: 0.125rem;
}

.news-content :deep([style*="text-align: left"]) {
    text-align: left;
}

.news-content :deep([style*="text-align: center"]) {
    text-align: center;
}

.news-content :deep([style*="text-align: right"]) {
    text-align: right;
}

.news-content :deep([style*="text-align: justify"]) {
    text-align: justify;
}

.news-content :deep(.ql-align-left) {
    text-align: left;
}

.news-content :deep(.ql-align-center) {
    text-align: center;
}

.news-content :deep(.ql-align-right) {
    text-align: right;
}

.news-content :deep(.ql-align-justify) {
    text-align: justify;
}

.bitrix-message-bubble {
    background-color: #f8fafc;
    position: relative;
    overflow: hidden;
    border: 1px solid #e5e7eb;
}

.bitrix-message-bubble::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    font-weight: 300;
    color: transparent;
    font-style: italic;
    pointer-events: none;
    z-index: 0;
}

@media (min-width: 640px) {
    .bitrix-message-bubble::before {
        font-size: 120px;
    }
}

.bitrix-message-bubble>* {
    position: relative;
    z-index: 10;
}

:deep(mark) {
    background-color: #fef08a;
    color: #854d0e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
}

html.dark .news-card .bitrix-message-bubble {
    background-color: rgba(15, 23, 42, 0.35);
    border: 1px solid rgba(148, 163, 184, 0.22);
}

html.dark .news-card .bitrix-message-bubble::before {
    color: transparent;
}

html.dark .news-content_collapsed::after {
    background: linear-gradient(to top, rgba(15, 23, 42, 0.92), transparent);
}

.news-card_important .bitrix-message-bubble {
    background-color: #fff8e6;
    border: 1px solid rgba(245, 158, 11, 0.35);
}

.news-card_important .news-content_collapsed::after {
    background: linear-gradient(to top, rgba(255, 248, 230, 1), transparent);
}

.news-card_important .bitrix-message-bubble::before {
    content: '!';
    color: rgba(245, 158, 11, 0.25);
    font-style: normal;
    font-weight: 600;
}

html.dark .news-card_important .bitrix-message-bubble {
    background-color: rgba(120, 53, 15, 0.38);
    border: 1px solid rgba(251, 191, 36, 0.3);
}

html.dark .news-card_important .bitrix-message-bubble::before {
    color: rgba(251, 191, 36, 0.18);
}

html.dark :deep(mark) {
    background-color: rgba(202, 138, 4, 0.45);
    color: #fef9c3;
}
</style>
