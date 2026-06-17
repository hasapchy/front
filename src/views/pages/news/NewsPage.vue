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
        <div class="bg-white dark:bg-[var(--surface-elevated)] border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div class="flex items-center gap-2">
            <PrimaryButton
              v-if="$store.getters.hasPermission('news_create')"
              :onclick="() => { showModal(null) }"
              icon="fas fa-plus"
              :disabled="!$store.getters.hasPermission('news_create')"
            />
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
          <div
            class="flex-1 min-w-0 order-1 lg:order-1 flex flex-col"
          >
            <div
              v-if="data.items && data.items.length > 0"
              class="w-full space-y-4"
            >
              <NewsCard
                v-for="newsItem in data.items"
                :key="newsItem.id"
                :news="newsItem"
                :search-query="''"
                @edit="showModal"
                @unread-cleared="onNewsUnreadCleared"
                @comments-count-changed="onCommentsCountChanged"
              />
              <div
                ref="newsLoadMoreSentinel"
                class="h-4 w-full"
              />
            </div>
            <div
              v-if="loadingMore"
              class="py-4 text-center text-gray-500 dark:text-[var(--text-secondary)] text-sm"
            >
              {{ $t('loading') }}
            </div>
            <div
              v-if="!data.items?.length && !loading"
              class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-[var(--text-secondary)] bg-white dark:bg-[var(--surface-elevated)] rounded-lg border border-gray-200 dark:border-white/10"
            >
              <i class="fas fa-newspaper text-6xl mb-4 text-gray-300 dark:text-[var(--text-secondary)]/50" />
              <p class="text-lg font-medium mb-4 text-gray-700 dark:text-[var(--text-primary)]">
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

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenNews', 'sideModalNomNews')"
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
  </div>
</template>

<script>
import NewsController from '@/api/NewsController';
import NewsCreatePage from './NewsCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import NewsPageSkeleton from '@/views/components/news/NewsPageSkeleton.vue';
import NewsCard from '@/views/components/news/NewsCard.vue';
import BirthdaysWidget from '@/views/components/news/BirthdaysWidget.vue';
import OnlineUsersWidget from '@/views/components/news/OnlineUsersWidget.vue';
import HolidaysWidget from '@/views/components/home/HolidaysWidget.vue';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';

import listQueryMixin from '@/mixins/listQueryMixin';
export default {
    components: {
        PrimaryButton,
        SideModalDialog,
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
        listQueryMixin,
        timelineUnreadMixin,
    ],
    data() {
        return {
            controller: NewsController,
            cacheInvalidationType: 'news',
            savedSuccessText: this.$t('newsSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingNews'),
            deletedSuccessText: this.$t('newsSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingNews'),
            loadingMore: false,
            newsPerPage: 20
        };
    },
    computed: {
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
        async fetchItems(page = 1, silent = false, append = false) {
            if (append) {
                if (this.loadingMore || !this.hasMoreNews) return;
                this.loadingMore = true;
            } else if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await NewsController.getItems(page, '', this.newsPerPage, null, null, null);
                if (append && this.data && this.data.items) {
                    this.data = { ...this.data, items: [...this.data.items, ...(new_data.items || [])], currentPage: new_data.currentPage, nextPage: new_data.nextPage, lastPage: new_data.lastPage, total: new_data.total };
                } else {
                    this.data = new_data;
                }
                await this.refreshNewsUnreadCounts();
            } catch (error) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            }
            if (append) this.loadingMore = false;
            else if (!silent) this.loading = false;
        },
        observeSentinel() {
            this.disconnectSentinel();
            const el = this.$refs.newsLoadMoreSentinel;
            if (!el || !this.hasMoreNews || this.loadingMore) return;
            this._newsScrollObserver = new IntersectionObserver((entries) => {
                if (!entries[0]?.isIntersecting || this.loadingMore || !this.hasMoreNews) return;
                this.fetchItems(this.data?.nextPage ?? this.data?.currentPage + 1, true, true);
            }, { root: null, rootMargin: '100px', threshold: 0 });
            this._newsScrollObserver.observe(el);
        },
        disconnectSentinel() {
            if (this._newsScrollObserver) {
                this._newsScrollObserver.disconnect();
                this._newsScrollObserver = null;
            }
        },
        async refreshNewsUnreadCounts() {
            const ids = (this.data?.items || []).map((item) => Number(item.id)).filter((id) => id > 0);
            if (!ids.length) return;
            await this.fetchTimelineUnreadCounts('news', ids);
            (this.data?.items || []).forEach((item) => {
                item.unreadCommentsCount = this.getTimelineUnreadCount(item.id);
            });
        },
        onNewsUnreadCleared(newsId) {
            this.markTimelineEntityAsRead('news', newsId);
            const item = (this.data?.items || []).find((row) => Number(row.id) === Number(newsId));
            if (item) {
                item.unreadCommentsCount = 0;
            }
        },
        onCommentsCountChanged({ newsId, count }) {
            const item = (this.data?.items || []).find((row) => Number(row.id) === Number(newsId));
            if (item) {
                item.commentsCount = count;
            }
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
