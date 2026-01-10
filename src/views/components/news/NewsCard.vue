<template>
    <div class="news-card bg-white border-b border-gray-200 py-3 sm:py-4 px-3 sm:px-4 md:px-6">
        <!-- Заголовок с автором и датой (как в Bitrix) -->
        <div class="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
            <!-- Аватар автора -->
            <div class="shrink-0">
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 border border-gray-200">
                    <img 
                        v-if="news.author?.photo && authorPhotoUrl" 
                        :src="authorPhotoUrl" 
                        class="w-full h-full object-cover"
                        :alt="authorFullName"
                    />
                    <i v-else class="fas fa-user text-gray-500 text-xs sm:text-sm"></i>
                </div>
            </div>
            
            <!-- Информация об авторе и дате -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span class="font-semibold text-gray-900 text-xs sm:text-sm break-words">
                        {{ authorFullName }}
                    </span>
                    <span class="text-gray-400 text-xs shrink-0 hidden sm:inline">→</span>
                    <span class="text-gray-500 text-[10px] sm:text-xs break-words">
                        {{ $t('allUsers') || 'Всем пользователям' }}
                    </span>
                </div>
                <div class="text-gray-500 text-[10px] sm:text-xs mt-0.5 break-words">
                    {{ formattedDate }}
                </div>
            </div>
            
            <!-- Кнопка редактирования -->
            <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                    v-if="$store.getters.hasPermission('news_update')"
                    @click.stop="$emit('edit', news)"
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all"
                    :title="$t('edit') || 'Редактировать'"
                >
                    <i class="fas fa-edit text-xs sm:text-sm"></i>
                </button>
            </div>
        </div>
        
        <!-- Сообщение в пузыре (стиль Bitrix) -->
        <div class="ml-[41px] sm:ml-[52px]">
            <div class="max-w-full rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm relative bitrix-message-bubble">
                <!-- Заголовок новости -->
                <h3 
                    class="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3 leading-tight break-words relative z-10"
                    v-html="highlightedTitle"
                ></h3>
                
                <!-- Содержание новости -->
                <div class="text-gray-900 text-sm sm:text-base leading-relaxed relative z-10">
                    <div 
                        class="news-content"
                        v-html="fullContent"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import DOMPurify from 'dompurify';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    name: 'NewsCard',
    props: {
        news: {
            type: Object,
            required: true
        },
        searchQuery: {
            type: String,
            default: ''
        }
    },
    emits: ['edit'],
    computed: {
        authorPhotoUrl() {
            if (!this.news.author?.photo) return null;
            // Используем тот же формат, что и в MessengerPage
            if (this.news.author.photo.startsWith('http')) {
                return this.news.author.photo;
            }
            const baseUrl = import.meta.env.VITE_APP_BASE_URL || '';
            return `${baseUrl}/storage/${this.news.author.photo}`;
        },
        authorFullName() {
            if (!this.news.author) {
                return this.$t('unknownAuthor') || 'Неизвестный автор';
            }
            // Форматируем имя как в MessengerPage: имя + фамилия
            const name = this.news.author.name || '';
            const surname = this.news.author.surname || '';
            const fullName = `${name} ${surname}`.trim();
            return fullName || this.$t('unknownAuthor') || 'Неизвестный автор';
        },
        formattedDate() {
            if (!this.news.createdAt) return '';
            // Используем dayjs с текущей локалью из i18n (формат как в Bitrix)
            const locale = this.$i18n.locale || 'ru';
            const localeMap = {
                'ru': 'ru',
                'en': 'en',
                'tm': 'tk' // Туркменский использует 'tk' в dayjs
            };
            const dayjsLocale = localeMap[locale] || 'ru';
            
            // Формат как в Bitrix: "DD MMMM YYYY HH:mm"
            return dayjs(this.news.createdAt)
                .locale(dayjsLocale)
                .format('DD MMMM YYYY HH:mm');
        },
        fullContent() {
            const content = this.news.content || '';
            if (!content) return '';
            
            // Проверяем, содержит ли контент HTML сущности (экранированный HTML)
            const hasHtmlEntities = /&lt;[a-z]/i.test(content) || /&gt;/.test(content);
            
            let processedContent = content;
            
            // Если контент содержит HTML сущности, разэкранируем их перед санитизацией
            // Это нужно, когда HTML был экранирован при сохранении (например, &lt;p&gt; вместо <p>)
            if (hasHtmlEntities) {
                // Используем замену для разэкранирования HTML сущностей
                // Важно: заменяем в правильном порядке, сначала двойное экранирование
                processedContent = content
                    .replace(/&amp;lt;/g, '<')  // Двойное экранирование: &amp;lt; -> <
                    .replace(/&amp;gt;/g, '>')  // Двойное экранирование: &amp;gt; -> >
                    .replace(/&amp;amp;/g, '&') // Двойное экранирование: &amp;amp; -> &
                    .replace(/&lt;/g, '<')      // Обычное экранирование: &lt; -> <
                    .replace(/&gt;/g, '>')      // Обычное экранирование: &gt; -> >
                    .replace(/&amp;/g, '&')     // Обычное экранирование: &amp; -> &
                    .replace(/&quot;/g, '"')    // Кавычки: &quot; -> "
                    .replace(/&#39;/g, "'")     // Апостроф: &#39; -> '
                    .replace(/&#x27;/g, "'")    // Апостроф (hex): &#x27; -> '
                    .replace(/&#x2F;/g, '/')    // Слэш (hex): &#x2F; -> /
                    .replace(/&#47;/g, '/');    // Слэш (dec): &#47; -> /
            }
            
            // Санитизируем HTML для защиты от XSS
            // DOMPurify автоматически обрабатывает HTML
            let sanitizedContent = DOMPurify.sanitize(processedContent, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
            });
            
            // Если есть поисковый запрос, применяем подсветку
            if (this.searchQuery) {
                return this.highlightHtml(sanitizedContent);
            }
            
            return sanitizedContent;
        },
        highlightedTitle() {
            const title = this.news.title || '';
            if (!title) return '';
            
            // Санитизируем заголовок
            let sanitizedTitle = DOMPurify.sanitize(title, {
                ALLOWED_TAGS: ['mark'],
                ALLOWED_ATTR: ['class']
            });
            
            // Если есть поисковый запрос, применяем подсветку
            if (this.searchQuery) {
                return highlightMatches(sanitizedTitle, this.searchQuery);
            }
            
            return sanitizedTitle;
        }
    },
    methods: {
        stripHtml(html) {
            if (!html) return '';
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },
        highlightHtml(html) {
            if (!this.searchQuery || !html) return html;
            
            // Создаем временный элемент для работы с HTML
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html;
            
            // Получаем текст для поиска
            const text = tmp.textContent || tmp.innerText || '';
            const searchLower = this.searchQuery.toLowerCase();
            const textLower = text.toLowerCase();
            
            if (!textLower.includes(searchLower)) {
                return html;
            }
            
            // Находим позицию в тексте
            const index = textLower.indexOf(searchLower);
            if (index === -1) return html;
            
            // Создаем обертку для подсветки
            const before = text.substring(0, index);
            const match = text.substring(index, index + this.searchQuery.length);
            const after = text.substring(index + this.searchQuery.length);
            
            // Заменяем в HTML (простой подход - заменяем первое вхождение)
            const highlighted = html.replace(
                new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                `<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">${match}</mark>`
            );
            
            return highlighted;
        }
    }
}
</script>

<style scoped>
/* Основные стили карточки */
.news-card {
    transition: all 0.2s ease;
}

.news-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #374151;
}

/* Стили для HTML контента из Quill редактора */
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

/* Стили для изображений - компактное отображение, гармоничное выравнивание */
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

/* Стили для вложенных таблиц */
.news-content :deep(table table) {
    margin: 0.5rem 0;
}

/* Стили для цветов текста и фона из редактора Quill */
.news-content :deep(span[style*="color"]) {
    /* Цвет текста из редактора - применяется автоматически через inline стили */
}

.news-content :deep(span[style*="background-color"]),
.news-content :deep(mark[style*="background-color"]) {
    /* Цвет фона из редактора - применяется автоматически через inline стили */
    padding: 0.125rem 0.25rem;
    border-radius: 0.125rem;
}

/* Стили для выравнивания текста */
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

/* Стили для классов выравнивания Quill */
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

/* Улучшенный вид карточки */
.news-card {
    transition: all 0.2s ease;
}

/* Стили для пузыря сообщения в стиле Bitrix */
.bitrix-message-bubble {
    background-color: #d9f6c9;
    position: relative;
    overflow: hidden;
}

/* Большая полупрозрачная иконка "i" на фоне - адаптивная */
.bitrix-message-bubble::before {
    content: 'i';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    font-weight: 300;
    color: rgba(168, 230, 160, 0.3);
    font-style: italic;
    pointer-events: none;
    z-index: 0;
}

@media (min-width: 640px) {
    .bitrix-message-bubble::before {
        font-size: 120px;
    }
}

/* Контент поверх фоновой иконки */
.bitrix-message-bubble > * {
    position: relative;
    z-index: 10;
}

/* Подсветка поиска */
:deep(mark) {
    background-color: #fef08a;
    color: #854d0e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
}
</style>

