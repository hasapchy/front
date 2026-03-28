<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="data && !loading"
        :key="`feed-${$i18n.locale}`"
        class="h-full flex flex-col"
      >
        <!-- Панель управления с фильтрами -->
        <div class="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <!-- Левая часть: кнопка создания и фильтры -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <PrimaryButton 
                v-if="$store.getters.hasPermission('news_create')"
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('news_create')"
              />
              <FiltersContainer
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                @reset="resetFilters"
                @apply="applyFilters"
              >
                <!-- Поиск -->
                <div>
                  <label class="block mb-2 text-xs font-semibold">{{ $t('search') }}</label>
                  <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input 
                      v-model="searchQuery" 
                      type="text" 
                      :placeholder="$t('searchPlaceholder')"
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @keyup.enter="applyFilters"
                    >
                  </div>
                </div>

                <!-- Фильтр по дате -->
                <div>
                  <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
                  <select
                    v-model="dateFilter"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all_time">
                      {{ $t('allTime') }}
                    </option>
                    <option value="today">
                      {{ $t('today') }}
                    </option>
                    <option value="yesterday">
                      {{ $t('yesterday') }}
                    </option>
                    <option value="this_week">
                      {{ $t('thisWeek') }}
                    </option>
                    <option value="this_month">
                      {{ $t('thisMonth') }}
                    </option>
                    <option value="last_week">
                      {{ $t('lastWeek') }}
                    </option>
                    <option value="last_month">
                      {{ $t('lastMonth') }}
                    </option>
                    <option value="custom">
                      {{ $t('selectDates') }}
                    </option>
                  </select>
                </div>

                <!-- Кастомные даты -->
                <div
                  v-if="dateFilter === 'custom'"
                  class="space-y-2"
                >
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                    <input 
                      v-model="startDate" 
                      type="date" 
                      class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                    <input 
                      v-model="endDate" 
                      type="date" 
                      class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                  </div>
                </div>

                <!-- Фильтр по автору -->
                <div>
                  <label class="block mb-2 text-xs font-semibold">{{ $t('author') }}</label>
                  <select 
                    v-model="authorFilter" 
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">
                      {{ $t('allAuthors') }}
                    </option>
                    <option
                      v-for="author in authors"
                      :key="author.id"
                      :value="author.id"
                    >
                      {{ author.name }}
                    </option>
                  </select>
                </div>
              </FiltersContainer>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-4 sm:py-6 bg-gray-50">
          <div
            ref="newsFeedColumn"
            class="flex-1 min-w-0 order-1 lg:order-1 flex flex-col min-h-0"
          >
            <h1 class="text-xl font-semibold text-gray-800 mb-4 shrink-0">
              {{ $t('news') }}
            </h1>
            <div
              ref="newsFeedScroll"
              class="flex-1 min-h-0 overflow-y-auto"
            >
              <div
                v-if="data.items && data.items.length > 0"
                class="w-full space-y-4"
              >
                <NewsCard
                  v-for="newsItem in data.items"
                  :key="newsItem.id"
                  :news="newsItem"
                  :search-query="searchQuery"
                  @edit="showModal"
                />
                <div
                  ref="newsLoadMoreSentinel"
                  class="h-4 w-full"
                />
              </div>
              <div
                v-if="loadingMore"
                class="py-4 text-center text-gray-500 text-sm"
              >
                {{ $t('loading') }}
              </div>
            </div>
            <div
              v-if="!data.items?.length && !loading"
              class="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200"
            >
              <i class="fas fa-newspaper text-6xl mb-4 text-gray-300" />
              <p class="text-lg font-medium mb-4">
                {{ $t('noNews') }}
              </p>
              <PrimaryButton
                v-if="$store.getters.hasPermission('news_create')"
                :onclick="() => showModal(null)"
                icon="fas fa-plus"
              >
                {{ $t('newsCreateFirst') }}
              </PrimaryButton>
            </div>
          </div>

          <!-- Правая колонка: Виджеты -->
          <aside class="w-full lg:w-80 xl:w-96 shrink-0 space-y-4 order-2 lg:order-2">
            <OnlineUsersWidget />
            <BirthdaysWidget />
            <HolidaysWidget />
          </aside>
        </div>
      </div>

      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <NewsPageSkeleton />
      </div>
    </transition>

    <!-- Модальное окно для создания/редактирования -->
    <SideModalDialog
      :show-form="modalDialog"
      :onclose="closeModal"
    >
      <NewsCreatePage 
        v-if="modalDialog" 
        ref="newsForm" 
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError" 
        @close-request="closeModal" 
      />
    </SideModalDialog>

    <AlertDialog 
      :dialog="deleteDialog" 
      :descr="$t('confirmDeleteNews')" 
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')" 
      @confirm="confirmDelete" 
      @leave="closeDeleteDialog" 
    />
  </div>
</template>

<script>
import NewsController from '@/api/NewsController';
import UsersController from '@/api/UsersController';
import { getCurrentServerDate, getCurrentServerStartOfDay, formatServerDateFromObject } from '@/utils/dateUtils';
import NewsCreatePage from './NewsCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import NewsPageSkeleton from '@/views/components/news/NewsPageSkeleton.vue';
import NewsCard from '@/views/components/news/NewsCard.vue';
import BirthdaysWidget from '@/views/components/news/BirthdaysWidget.vue';
import OnlineUsersWidget from '@/views/components/news/OnlineUsersWidget.vue';
import HolidaysWidget from '@/views/components/home/HolidaysWidget.vue';

import listQueryMixin from '@/mixins/listQueryMixin';
export default {
    components: { 
        PrimaryButton,
        FiltersContainer,
        SideModalDialog,
        AlertDialog,
        NewsPageSkeleton,
        NewsCreatePage,
        NewsCard,
        BirthdaysWidget,
        OnlineUsersWidget,
        HolidaysWidget
    },
    mixins: [
        modalMixin, 
        notificationMixin, 
        crudEventMixin, 
        getApiErrorMessageMixin, 
        companyChangeMixin, 
        listQueryMixin
    ],
    data() {
        const saved = this.$store.state.newsFilters;
        const def = {
            searchQuery: '',
            dateFilter: 'all_time',
            startDate: '',
            endDate: '',
            authorFilter: ''
        };
        const initial = saved
            ? { ...def, ...saved }
            : { ...def };
        return {
            controller: NewsController,
            cacheInvalidationType: 'news',
            savedSuccessText: this.$t('newsSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingNews'),
            deletedSuccessText: this.$t('newsSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingNews'),
            searchQuery: initial.searchQuery ?? '',
            dateFilter: initial.dateFilter ?? 'all_time',
            startDate: initial.startDate ?? '',
            endDate: initial.endDate ?? '',
            authorFilter: initial.authorFilter ?? '',
            authors: [],
            deleteDialog: false,
            newsToDelete: null,
            loadingMore: false,
            newsPerPage: 20
        };
    },
    computed: {
        hasActiveFilters() {
            return !!this.searchQuery || this.dateFilter !== 'all_time' || !!this.authorFilter;
        },
        hasMoreNews() {
            if (!this.data || !this.data.items) return false;
            return this.data.nextPage != null && this.data.currentPage < this.data.lastPage;
        }
    },
    watch: {
        hasMoreNews: {
            handler(val) {
                if (val) this.observeSentinel();
                else this.disconnectSentinel();
            }
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    async mounted() {
        await this.fetchAuthors();
        await this.fetchItems(1);
        this.$nextTick(() => this.observeSentinel());
    },
    beforeUnmount() {
        this.disconnectSentinel();
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
            
            const todayStr = getCurrentServerDate();
            const startOfDay = getCurrentServerStartOfDay();

            switch (this.dateFilter) {
                case 'today':
                    return { dateFrom: todayStr, dateTo: todayStr };
                case 'yesterday': {
                    const yesterday = new Date(startOfDay);
                    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
                    const ys = formatServerDateFromObject(yesterday);
                    return { dateFrom: ys, dateTo: ys };
                }
                case 'this_week': {
                    const weekStart = new Date(startOfDay);
                    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
                    return {
                        dateFrom: formatServerDateFromObject(weekStart),
                        dateTo: todayStr
                    };
                }
                case 'this_month': {
                    const monthStart = new Date(startOfDay);
                    monthStart.setUTCDate(1);
                    return {
                        dateFrom: formatServerDateFromObject(monthStart),
                        dateTo: todayStr
                    };
                }
                case 'last_week': {
                    const lastWeekStart = new Date(startOfDay);
                    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - lastWeekStart.getUTCDay() - 7);
                    const lastWeekEnd = new Date(lastWeekStart);
                    lastWeekEnd.setUTCDate(lastWeekEnd.getUTCDate() + 6);
                    return {
                        dateFrom: formatServerDateFromObject(lastWeekStart),
                        dateTo: formatServerDateFromObject(lastWeekEnd)
                    };
                }
                case 'last_month': {
                    const lastMonthStart = new Date(startOfDay);
                    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1, 1);
                    const lastMonthEnd = new Date(startOfDay);
                    lastMonthEnd.setUTCDate(0);
                    return {
                        dateFrom: formatServerDateFromObject(lastMonthStart),
                        dateTo: formatServerDateFromObject(lastMonthEnd)
                    };
                }
                default:
                    return { dateFrom: null, dateTo: null };
            }
        },
        async fetchItems(page = 1, silent = false, append = false) {
            if (append) {
                if (this.loadingMore || !this.hasMoreNews) return;
                this.loadingMore = true;
            } else if (!silent) {
                this.loading = true;
            }
            try {
                const { dateFrom, dateTo } = this.getDateRange();
                const authorId = this.authorFilter || null;
                const new_data = await NewsController.getItems(page, this.searchQuery, this.newsPerPage, dateFrom, dateTo, authorId);
                if (append && this.data && this.data.items) {
                    this.data = { ...this.data, items: [...this.data.items, ...(new_data.items || [])], currentPage: new_data.currentPage, nextPage: new_data.nextPage, lastPage: new_data.lastPage, total: new_data.total };
                } else {
                    this.data = new_data;
                }
            } catch (error) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            }
            if (append) this.loadingMore = false;
            else if (!silent) this.loading = false;
        },
        observeSentinel() {
            this.disconnectSentinel();
            const el = this.$refs.newsLoadMoreSentinel;
            const scrollEl = this.$refs.newsFeedScroll;
            if (!el || !scrollEl || !this.hasMoreNews || this.loadingMore) return;
            this._newsScrollObserver = new IntersectionObserver((entries) => {
                if (!entries[0]?.isIntersecting || this.loadingMore || !this.hasMoreNews) return;
                this.fetchItems(this.data?.nextPage ?? this.data?.currentPage + 1, true, true);
            }, { root: scrollEl, rootMargin: '100px', threshold: 0 });
            this._newsScrollObserver.observe(el);
        },
        disconnectSentinel() {
            if (this._newsScrollObserver) {
                this._newsScrollObserver.disconnect();
                this._newsScrollObserver = null;
            }
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.searchQuery, defaultValue: '' },
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.authorFilter, defaultValue: '' }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig(
                {
                    searchQuery: '',
                    dateFilter: 'all_time',
                    startDate: '',
                    endDate: '',
                    authorFilter: ''
                },
                () => {
                    this.$store.commit('SET_NEWS_FILTERS', null);
                    this.fetchItems(1);
                }
            );
        },
        applyFilters() {
            this.$store.commit('SET_NEWS_FILTERS', {
                searchQuery: this.searchQuery,
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                authorFilter: this.authorFilter
            });
            this.fetchItems(1);
        },
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
