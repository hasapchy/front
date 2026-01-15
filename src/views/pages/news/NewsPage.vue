<template>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`feed-${$i18n.locale}`" class="h-full flex flex-col">
            <!-- Панель управления с фильтрами -->
            <div class="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                    <!-- Левая часть: кнопка создания и фильтры -->
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <PrimaryButton 
                            v-if="$store.getters.hasPermission('news_create')"
                            :onclick="() => { showModal(null) }" 
                            icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('news_create')">
                        </PrimaryButton>
                        <FiltersContainer
                            :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()"
                            @reset="resetFilters"
                            @apply="applyFilters">
                            <!-- Поиск -->
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('search') || 'Поиск' }}</label>
                                <div class="relative">
                                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                    <input 
                                        type="text" 
                                        v-model="searchQuery" 
                                        :placeholder="$t('searchPlaceholder') || 'Поиск по новостям...'"
                                        class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        @keyup.enter="applyFilters"
                                    />
                                </div>
                            </div>

                            <!-- Фильтр по дате -->
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                                <select v-model="dateFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="all_time">{{ $t('allTime') || 'Все время' }}</option>
                                    <option value="today">{{ $t('today') || 'Сегодня' }}</option>
                                    <option value="yesterday">{{ $t('yesterday') || 'Вчера' }}</option>
                                    <option value="this_week">{{ $t('thisWeek') || 'Эта неделя' }}</option>
                                    <option value="this_month">{{ $t('thisMonth') || 'Этот месяц' }}</option>
                                    <option value="last_week">{{ $t('lastWeek') || 'Прошлая неделя' }}</option>
                                    <option value="last_month">{{ $t('lastMonth') || 'Прошлый месяц' }}</option>
                                    <option value="custom">{{ $t('selectDates') || 'Выбрать даты' }}</option>
                                </select>
                            </div>

                            <!-- Кастомные даты -->
                            <div v-if="dateFilter === 'custom'" class="space-y-2">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                                    <input 
                                        type="date" 
                                        v-model="startDate" 
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                    <input 
                                        type="date" 
                                        v-model="endDate" 
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <!-- Фильтр по автору -->
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('author') || 'Автор' }}</label>
                                <select 
                                    v-model="authorFilter" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">{{ $t('allAuthors') || 'Все авторы' }}</option>
                                    <option v-for="author in authors" :key="author.id" :value="author.id">
                                        {{ author.name }}
                                    </option>
                                </select>
                            </div>
                        </FiltersContainer>
                    </div>

                </div>
            </div>

            <!-- Двухколоночный layout -->
            <div class="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-6 bg-gray-50">
                <!-- Левая колонка: Лента новостей -->
                <div class="flex-1 min-w-0 order-1 lg:order-1">
                    <div v-if="data.items && data.items.length > 0" class="w-full space-y-4">
                        <NewsCard
                            v-for="newsItem in data.items"
                            :key="newsItem.id"
                            :news="newsItem"
                            :search-query="searchQuery"
                            @edit="showModal"
                        />
                    </div>
                    
                    <!-- Пустое состояние -->
                    <div v-else class="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200">
                        <i class="fas fa-newspaper text-6xl mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium">{{ $t('noNews') || 'Новостей пока нет' }}</p>
                    </div>
                </div>

                <!-- Правая колонка: Виджеты -->
                <aside class="w-full lg:w-80 xl:w-96 shrink-0 space-y-4 order-2 lg:order-2">
                    <!-- Виджет онлайн пользователей -->
                    <OnlineUsersWidget />
                    
                    <!-- Виджет быстрых ссылок -->
                    <QuickLinksWidget />
                    
                    <!-- Виджет задач -->
                    <TasksWidget v-if="$store.getters.hasPermission('tasks_view')" />
                    
                    <!-- Виджет дней рождения -->
                    <BirthdaysWidget />
                </aside>
            </div>
        </div>

        <!-- Загрузка -->
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <!-- Модальное окно для создания/редактирования -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <NewsCreatePage 
            v-if="modalDialog" 
            ref="newsForm" 
            @saved="handleSaved"
            @saved-error="handleSavedError"
            @deleted="handleDeleted"
            @deleted-error="handleDeletedError"
            @close-request="closeModal" 
            :editingItem="editingItem" 
        />
    </SideModalDialog>

    <!-- Диалог подтверждения удаления -->
    <AlertDialog 
        :dialog="deleteDialog" 
        @confirm="confirmDelete" 
        @leave="closeDeleteDialog"
        :descr="$t('confirmDeleteNews') || 'Вы уверены, что хотите удалить эту новость?'" 
        :confirm-text="$t('delete') || 'Удалить'" 
        :leave-text="$t('cancel') || 'Отмена'" 
    />

    <!-- Уведомления -->
    <NotificationToast 
        :title="notificationTitle" 
        :subtitle="notificationSubtitle" 
        :show="notification"
        :is-danger="notificationIsDanger" 
        @close="closeNotification" 
    />
</template>

<script>
import NewsController from '@/api/NewsController';
import UsersController from '@/api/UsersController';
import NewsCreatePage from './NewsCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import searchMixin from '@/mixins/searchMixin';
import filtersMixin from '@/mixins/filtersMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import NewsCard from '@/views/components/news/NewsCard.vue';
import TasksWidget from '@/views/components/news/TasksWidget.vue';
import BirthdaysWidget from '@/views/components/news/BirthdaysWidget.vue';
import QuickLinksWidget from '@/views/components/news/QuickLinksWidget.vue';
import OnlineUsersWidget from '@/views/components/news/OnlineUsersWidget.vue';

export default {
    mixins: [
        modalMixin, 
        notificationMixin, 
        crudEventMixin, 
        getApiErrorMessageMixin, 
        companyChangeMixin, 
        searchMixin,
        filtersMixin
    ],
    components: { 
        PrimaryButton,
        FiltersContainer,
        SideModalDialog,
        AlertDialog,
        NotificationToast,
        SpinnerIcon,
        NewsCreatePage,
        NewsCard,
        TasksWidget,
        BirthdaysWidget,
        QuickLinksWidget,
        OnlineUsersWidget
    },
    data() {
        return {
            controller: NewsController,
            cacheInvalidationType: 'news',
            savedSuccessText: this.$t('newsSuccessfullyAdded') || 'Новость успешно добавлена',
            savedErrorText: this.$t('errorSavingNews') || 'Ошибка сохранения новости',
            deletedSuccessText: this.$t('newsSuccessfullyDeleted') || 'Новость успешно удалена',
            deletedErrorText: this.$t('errorDeletingNews') || 'Ошибка удаления новости',
            dateFilter: 'all_time',
            startDate: '',
            endDate: '',
            authorFilter: '',
            authors: [],
            deleteDialog: false,
            newsToDelete: null
        }
    },
    computed: {
        hasActiveFilters() {
            return !!this.searchQuery || this.dateFilter !== 'all_time' || !!this.authorFilter;
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    async mounted() {
        await this.fetchAuthors();
        await this.fetchItems();
    },
    methods: {
        async showModal(item = null) {
            this.savedScrollPosition = window.pageYOffset ?? document.documentElement.scrollTop;
            this.shouldRestoreScrollOnClose = true;
            this.modalDialog = true;
            
            if (item && item.id) {
                try {
                    const fullNews = await NewsController.getItem(item.id);
                    if (fullNews) {
                        this.editingItem = fullNews;
                    } else {
                        this.editingItem = item;
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке новости:', error);
                    this.editingItem = item;
                }
            } else {
                this.editingItem = null;
            }
        },
        handleDeleteClick(news) {
            this.newsToDelete = news;
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
            this.newsToDelete = null;
        },
        async confirmDelete() {
            if (!this.newsToDelete) return;
            
            const newsId = this.newsToDelete.id;
            this.closeDeleteDialog();
            
            try {
                await NewsController.deleteItem(newsId);
                // Используем стандартизированный метод из crudEventMixin
                this.handleDeleted();
            } catch (error) {
                // Используем стандартизированный метод из crudEventMixin
                this.handleDeletedError(error);
            }
        },
        async fetchAuthors() {
            try {
                // Загружаем всех пользователей для фильтра авторов
                const users = await UsersController.getListItems();
                this.authors = users || [];
            } catch (error) {
                console.error('Ошибка загрузки авторов:', error);
                this.authors = [];
            }
        },
        getDateRange() {
            if (this.dateFilter === 'custom') {
                return {
                    dateFrom: this.startDate || null,
                    dateTo: this.endDate || null
                };
            }
            
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            switch (this.dateFilter) {
                case 'today':
                    return {
                        dateFrom: startOfDay.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'yesterday':
                    const yesterday = new Date(startOfDay);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return {
                        dateFrom: yesterday.toISOString().split('T')[0],
                        dateTo: yesterday.toISOString().split('T')[0]
                    };
                case 'this_week':
                    const weekStart = new Date(startOfDay);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    return {
                        dateFrom: weekStart.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'this_month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return {
                        dateFrom: monthStart.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'last_week':
                    const lastWeekStart = new Date(startOfDay);
                    lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
                    const lastWeekEnd = new Date(lastWeekStart);
                    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
                    return {
                        dateFrom: lastWeekStart.toISOString().split('T')[0],
                        dateTo: lastWeekEnd.toISOString().split('T')[0]
                    };
                case 'last_month':
                    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                    return {
                        dateFrom: lastMonthStart.toISOString().split('T')[0],
                        dateTo: lastMonthEnd.toISOString().split('T')[0]
                    };
                default:
                    return { dateFrom: null, dateTo: null };
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const { dateFrom, dateTo } = this.getDateRange();
                const authorId = this.authorFilter ? this.authorFilter : null;
                // Загружаем все новости без пагинации
                const new_data = await NewsController.getItems(1, this.searchQuery, 10000, dateFrom, dateTo, authorId);
                this.data = new_data;
            } catch (error) {
                console.error('Ошибка загрузки новостей:', error);
                this.showNotification(
                    this.$t('error') || 'Ошибка', 
                    this.getApiErrorMessage(error), 
                    true
                );
            }
            if (!silent) {
                this.loading = false;
            }
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.searchQuery) count++;
            if (this.dateFilter !== 'all_time') count++;
            if (this.authorFilter) count++;
            return count;
        },
        resetFilters() {
            this.searchQuery = '';
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            this.authorFilter = '';
            this.fetchItems(1);
        },
        applyFilters() {
            this.fetchItems(1);
        }
    },
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
