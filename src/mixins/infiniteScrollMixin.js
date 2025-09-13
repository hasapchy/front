/**
 * Миксин для бесконечной прокрутки
 * 
 * Требует в компоненте:
 * - data: { allItems: [], currentPage: 1, hasMorePages: true, loadingMore: false }
 * - methods: { fetchItems(page, silent, append) }
 * 
 * Оптимизации:
 * - Debounce для скролла (300ms)
 * - Ограничение количества загруженных страниц
 * - Автоматическая очистка старых данных
 */
export default {
    data() {
        return {
            // Состояние бесконечной прокрутки
            allItems: [],
            currentPage: 1,
            hasMorePages: true,
            loadingMore: false,
            
            // Настройки оптимизации
            maxPages: 20, // Максимальное количество страниц в памяти
            scrollDebounceDelay: 300, // Задержка для debounce скролла
            searchDebounceDelay: 500, // Задержка для debounce поиска
            scrollTriggerDistance: 1000, // Расстояние от конца для загрузки
            
            // Внутренние переменные
            scrollTimeout: null,
            searchTimeout: null,
            scrollHandler: null
        }
    },
    
    mounted() {
        this.setupInfiniteScroll();
    },
    
    beforeUnmount() {
        this.removeInfiniteScroll();
    },
    
    methods: {
        /**
         * Настройка бесконечной прокрутки
         */
        setupInfiniteScroll() {
            this.scrollHandler = this.debounceScroll.bind(this);
            window.addEventListener('scroll', this.scrollHandler);
        },
        
        /**
         * Удаление обработчика скролла
         */
        removeInfiniteScroll() {
            if (this.scrollHandler) {
                window.removeEventListener('scroll', this.scrollHandler);
            }
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
        },
        
        /**
         * Debounced обработчик скролла
         */
        debounceScroll() {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            this.scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, this.scrollDebounceDelay);
        },
        
        /**
         * Debounced поиск
         * @param {Function} searchCallback - функция поиска
         * @param {*} searchValue - значение поиска
         */
        debouncedSearch(searchCallback, searchValue) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            this.searchTimeout = setTimeout(() => {
                this.resetInfiniteScroll();
                searchCallback(searchValue);
            }, this.searchDebounceDelay);
        },
        
        /**
         * Обработка события скролла
         */
        handleScroll() {
            // Проверяем, достигли ли мы конца страницы
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - this.scrollTriggerDistance) {
                this.loadMoreItems();
            }
        },
        
        /**
         * Загрузка дополнительных элементов
         */
        async loadMoreItems() {
            if (this.loadingMore || !this.hasMorePages) {
                return;
            }
            
            const nextPage = this.currentPage + 1;
            await this.fetchItems(nextPage, false, true);
        },
        
        /**
         * Сброс состояния бесконечной прокрутки
         */
        resetInfiniteScroll() {
            this.allItems = [];
            this.currentPage = 1;
            this.hasMorePages = true;
            this.loadingMore = false;
        },
        
        /**
         * Обработка загруженных данных для бесконечной прокрутки
         * @param {Object} newData - новые данные с сервера
         * @param {Boolean} append - добавлять ли к существующим данным
         */
        processInfiniteScrollData(newData, append = false) {
            if (append) {
                // Добавляем новые элементы к существующим
                this.allItems = [...this.allItems, ...newData.items];
                this.data = {
                    ...newData,
                    items: this.allItems
                };
            } else {
                // Загружаем первую страницу
                this.allItems = newData.items;
                this.data = newData;
                this.currentPage = 1;
            }
            
            this.currentPage = newData.currentPage;
            this.hasMorePages = newData.currentPage < newData.lastPage;
            
            // Оптимизация: ограничиваем количество страниц в памяти
            this.optimizeMemoryUsage();
        },
        
        /**
         * Оптимизация использования памяти
         * Удаляет старые страницы при превышении лимита
         */
        optimizeMemoryUsage() {
            if (this.currentPage > this.maxPages) {
                const itemsPerPage = this.allItems.length / this.currentPage;
                const itemsToKeep = this.maxPages * itemsPerPage;
                
                // Оставляем только последние элементы
                this.allItems = this.allItems.slice(-itemsToKeep);
                
                // Обновляем data
                if (this.data) {
                    this.data = {
                        ...this.data,
                        items: this.allItems
                    };
                }
                
                console.log(`Очищено ${this.allItems.length - itemsToKeep} старых элементов для оптимизации памяти`);
            }
        },
        
        /**
         * Получение статистики использования памяти
         */
        getMemoryStats() {
            return {
                totalItems: this.allItems.length,
                currentPage: this.currentPage,
                hasMorePages: this.hasMorePages,
                memoryUsage: `${this.allItems.length} элементов в памяти`
            };
        }
    },
    
    computed: {
        /**
         * Показывать ли индикатор загрузки дополнительных элементов
         */
        showLoadingMore() {
            return this.loadingMore && this.allItems.length > 0;
        },
        
        /**
         * Показывать ли сообщение о завершении загрузки
         */
        showEndMessage() {
            return this.data && !this.hasMorePages && this.allItems.length > 0;
        }
    }
}
