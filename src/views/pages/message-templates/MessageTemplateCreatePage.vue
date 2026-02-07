<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItem ? ($t('editTemplate') || 'Редактировать шаблон') : ($t('createTemplate') || 'Создать шаблон') }}
        </h2>
        
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t); }" :key="`tabs-${$i18n.locale}`" />

        <div v-show="currentTab === 'edit'">
            <div>
                <label class="required">{{ $t('type') || 'Тип' }}</label>
            <select 
                v-model="type" 
                required 
                :disabled="!!editingItem || loadingTypes"
                :title="editingItem ? 'Тип нельзя изменить при редактировании' : ''">
                <option value="" v-if="loadingTypes">{{ $t('loading') || 'Загрузка...' }}</option>
                <option value="" v-else>{{ $t('selectType') || 'Выберите тип' }}</option>
                <option 
                    v-for="templateType in availableTemplateTypes" 
                    :key="templateType.value" 
                    :value="templateType.value">
                    {{ templateType.label }}
                </option>
            </select>
        </div>

        <div class="mt-4">
            <label class="required">{{ $t('name') || 'Название' }}</label>
            <input type="text" v-model="name" required />
        </div>

        <div class="mt-4">
            <label class="required">{{ $t('content') || 'Содержание' }}</label>
            <div class="quill-editor-container">
                <QuillEditor
                    v-model:content="content"
                    :options="editorOptions"
                    contentType="html"
                    :disabled="saveLoading"
                />
            </div>
            <div class="mt-2 text-sm text-gray-600">
                <p class="mb-1">{{ $t('availableVariables') || 'Доступные переменные:' }}</p>
                <div v-if="selectedTypeVariables && selectedTypeVariables.length > 0" class="flex flex-wrap gap-2">
                    <code 
                        v-for="variable in selectedTypeVariables" 
                        :key="variable"
                        class="px-2 py-1 bg-gray-100 rounded" 
                        v-text="`{{${variable}}}`">
                    </code>
                </div>
                <div v-else class="text-gray-400">
                    {{ $t('selectTypeToSeeVariables') || 'Выберите тип, чтобы увидеть доступные переменные' }}
                </div>
            </div>
        </div>
        </div>

        <!-- Вкладка предпросмотра -->
        <div v-show="currentTab === 'preview'" class="mt-4">
            <div class="bg-gray-50 rounded-lg shadow-sm border border-gray-200 py-4 sm:py-5 px-4 sm:px-6 md:px-8">
                <!-- Заголовок с автором и датой -->
                <div class="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <!-- Аватар автора -->
                    <div class="shrink-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            <i class="fas fa-user text-gray-500 text-xs sm:text-sm"></i>
                        </div>
                    </div>
                    
                    <!-- Информация об авторе и дате -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span class="font-semibold text-gray-900 text-xs sm:text-sm break-words">
                                {{ previewAuthorName }}
                            </span>
                            <span class="text-gray-400 text-xs shrink-0 hidden sm:inline">→</span>
                            <span class="text-gray-500 text-[10px] sm:text-xs break-words">
                                {{ $t('allUsers') || 'Всем пользователям' }}
                            </span>
                        </div>
                        <div class="text-gray-500 text-[10px] sm:text-xs mt-0.5 break-words">
                            {{ previewDate }}
                        </div>
                    </div>
                </div>
                
                <!-- Сообщение в пузыре (стиль Bitrix) -->
                <div class="ml-[41px] sm:ml-[52px]">
                    <div class="max-w-full rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm relative bitrix-message-bubble">
                        <!-- Заголовок новости -->
                        <h3 
                            class="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3 leading-tight break-words relative z-10"
                            v-html="previewTitle"
                        ></h3>
                        
                        <!-- Содержание новости -->
                        <div class="text-gray-900 text-sm sm:text-base leading-relaxed relative z-10">
                            <div 
                                class="news-content"
                                v-html="previewContent"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton 
            v-if="editingItem != null" 
            :onclick="showDeleteDialog" 
            :is-danger="true"
            :is-loading="deleteLoading" 
            icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('templates_delete')">
        </PrimaryButton>
        <PrimaryButton 
            icon="fas fa-save" 
            :onclick="save" 
            :is-loading="saveLoading"
            :disabled="!type || !name || 
            (editingItemId != null && !$store.getters.hasPermission('templates_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('templates_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog 
        :dialog="deleteDialog" 
        @confirm="deleteItem" 
        @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" 
        :confirm-text="$t('delete')" 
        :leave-text="$t('cancel')" />
    <AlertDialog 
        :dialog="closeConfirmDialog" 
        @confirm="confirmClose" 
        @leave="cancelClose"
        :descr="$t('unsavedChanges')" 
        :confirm-text="$t('closeWithoutSaving')" 
        :leave-text="$t('stay')" />
</template>

<script>
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import MessageTemplateController from '@/api/MessageTemplateController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import DOMPurify from 'dompurify';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { 
        QuillEditor,
        PrimaryButton,
        AlertDialog,
        TabBar,
    },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.type : '',
            name: this.editingItem ? this.editingItem.name : '',
            content: this.editingItem ? this.editingItem.content : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            closeConfirmDialog: false,
            templateTypes: [],
            loadingTypes: false,
            currentTab: 'edit',
            tabs: [
                { name: 'edit', label: 'edit' },
                { name: 'preview', label: 'preview' }
            ]
        }
    },
    computed: {
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label) || tab.label
            }));
        },
        previewTitle() {
            if (!this.name) {
                return this.$t('previewTitlePlaceholder') || 'Название шаблона';
            }
            return DOMPurify.sanitize(this.name, {
                ALLOWED_TAGS: ['mark'],
                ALLOWED_ATTR: ['class']
            });
        },
        previewContent() {
            if (!this.content) {
                return '<p class="text-gray-400">' + (this.$t('previewContentPlaceholder') || 'Содержание шаблона будет отображаться здесь') + '</p>';
            }
            
            // Оставляем переменные как есть, без подстановки примерных значений
            let processedContent = this.content;
            
            // Проверяем, содержит ли контент HTML сущности
            const hasHtmlEntities = /&lt;[a-z]/i.test(processedContent) || /&gt;/.test(processedContent);
            
            if (hasHtmlEntities) {
                processedContent = processedContent
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
            
            // Санитизируем HTML
            return DOMPurify.sanitize(processedContent, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
            });
        },
        previewDate() {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const months = {
                ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
                en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                tm: ['Ýanwar', 'Fewral', 'Mart', 'Aprel', 'Maý', 'Iýun', 'Iýul', 'Awgust', 'Sentýabr', 'Oktýabr', 'Noýabr', 'Dekabr']
            };
            const locale = this.$i18n.locale || 'ru';
            const monthNames = months[locale] || months.ru;
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            if (locale === 'ru') {
                return `${day} ${month} ${year} ${hours}:${minutes}`;
            } else if (locale === 'en') {
                return `${month} ${day}, ${year} ${hours}:${minutes}`;
            } else {
                return `${day} ${month} ${year} ${hours}:${minutes}`;
            }
        },
        previewAuthorName() {
            // Если редактируем существующий шаблон, берем автора из editingItem
            if (this.editingItem && this.editingItem.user) {
                const name = this.editingItem.user.name || '';
                const surname = this.editingItem.user.surname || '';
                const fullName = `${name} ${surname}`.trim();
                return fullName || this.$t('unknownAuthor') || 'Неизвестный автор';
            }
            // Если создаем новый шаблон, показываем "Вы" или имя текущего пользователя
            return this.$t('you') || 'Вы';
        },
        editorOptions() {
            return {
                theme: 'snow',
                placeholder: this.$t('templateContentPlaceholder') || 'Введите текст шаблона...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            };
        },
        selectedTypeVariables() {
            if (!this.type) {
                return [];
            }
            const selectedType = this.templateTypes.find(t => t.value === this.type);
            return selectedType ? selectedType.variables : [];
        },
        availableTemplateTypes() {
            // При редактировании показываем все типы (включая текущий, даже если он занят)
            if (this.editingItem) {
                return this.templateTypes;
            }
            // При создании скрываем уже занятые типы
            return this.templateTypes.filter(t => !t.is_used);
        }
    },
    async mounted() {
        await this.loadTemplateTypes();
        this.$nextTick(() => {
            if (!this.editingItem) {
                this.clearForm();
            }
            this.saveInitialState();
        });
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.type = newEditingItem.type || '';
                    this.name = newEditingItem.name || '';
                    this.content = newEditingItem.content || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
        '$i18n.locale'() {
            // При изменении языка обновляем placeholder редактора
        }
    },
    methods: {
        async loadTemplateTypes() {
            this.loadingTypes = true;
            try {
                this.templateTypes = await MessageTemplateController.getTypes();
            } catch (error) {
                console.error('Ошибка загрузки типов шаблонов:', error);
                this.templateTypes = [];
                this.showNotification(
                    this.$t('error') || 'Ошибка', 
                    'Не удалось загрузить типы шаблонов', 
                    true
                );
            } finally {
                this.loadingTypes = false;
            }
        },
        getFormState() {
            return {
                type: this.type,
                name: this.name,
                content: this.content,
            };
        },
        clearForm() {
            this.type = '';
            this.name = '';
            this.content = '';
            this.editingItemId = null;
            this.resetFormChanges();
        },
        async save() {
            if (!this.type || this.type.trim() === '') {
                this.$emit('saved-error', this.$t('typeRequired') || 'Тип обязателен');
                return;
            }

            if (!this.name || this.name.trim() === '') {
                this.$emit('saved-error', this.$t('nameRequired') || 'Название обязательно');
                return;
            }

            if (!this.content || this.content.trim() === '') {
                this.$emit('saved-error', this.$t('contentRequired') || 'Содержание обязательно');
                return;
            }

            this.saveLoading = true;
            try {
                const data = {
                    type: this.type.trim(),
                    name: this.name.trim(),
                    content: this.content,
                };
                
                // При создании добавляем is_active = true по умолчанию
                if (!this.editingItemId) {
                    data.is_active = true;
                }

                let response;
                if (this.editingItemId) {
                    response = await MessageTemplateController.updateItem(this.editingItemId, data);
                } else {
                    response = await MessageTemplateController.createItem(data);
                }

                this.$emit('saved', response);
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            } finally {
                this.saveLoading = false;
            }
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await MessageTemplateController.deleteItem(this.editingItemId);
                this.$emit('deleted');
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            } finally {
                this.deleteLoading = false;
            }
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        changeTab(tabName) {
            this.currentTab = tabName;
        }
    },
}
</script>

<style scoped>
.quill-editor-container {
    min-height: 300px;
}

.quill-editor-container :deep(.ql-container) {
    min-height: 300px;
    font-size: 14px;
}

/* Стили для предпросмотра новости (как в NewsCard) */
.news-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #374151;
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

.news-content :deep(ul),
.news-content :deep(ol) {
    margin-left: 1.5rem;
    margin-bottom: 0.75rem;
    margin-top: 0.5rem;
    padding-left: 0.5rem;
    list-style-type: disc;
}

.news-content :deep(ol) {
    list-style-type: decimal;
}

.news-content :deep(li) {
    margin-bottom: 0.5rem;
    line-height: 1.7;
    color: #374151;
    display: list-item;
}

.news-content :deep(strong),
.news-content :deep(b) {
    font-weight: 600;
}

.news-content :deep(em),
.news-content :deep(i) {
    font-style: italic;
}

.news-content :deep(img) {
    max-width: 100%;
    max-height: 350px;
    height: auto;
    border-radius: 0.5rem;
    margin: 0.75rem 0;
    display: block;
    object-fit: contain;
}

/* Стили для пузыря сообщения в стиле Bitrix */
.bitrix-message-bubble {
    background-color: #d9f6c9;
    position: relative;
    overflow: hidden;
}

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

.bitrix-message-bubble > * {
    position: relative;
    z-index: 10;
}
</style>

