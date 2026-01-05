# План рефакторинга страниц транзакций и заказов

## Анализ текущего состояния

### TransactionCreatePage.vue (1146 строк)
**Проблемы:**
- Слишком много логики в одном компоненте
- Много полей формы (10+ полей)
- Сложная логика расчета курса обмена
- Много watchers (10+)
- Сложная логика работы с источниками

**Предложения по разбиению:**

1. **TransactionFormFields.vue** (~200 строк)
   - Базовые поля: клиент, дата, тип, касса, валюта, сумма
   - Категория, проект, примечание
   - Props: v-model для всех полей, конфигурация видимости полей
   - Emits: обновления значений

2. **TransactionExchangeRateSection.vue** (~150 строк)
   - Поле курса обмена
   - Расчет и отображение конвертированной суммы
   - Props: cashId, currencyId, origAmount, exchangeRate
   - Emits: exchange-rate-updated

3. **TransactionBalancePreview.vue** (~100 строк)
   - Превью баланса после операции
   - Props: currentClientBalance, type, origAmount, currencySymbol
   - Computed: balanceAfterAdjustmentValue, balanceAfterAdjustmentClass

4. **TransactionSourceSection.vue** (~80 строк)
   - Отображение источника транзакции
   - Props: selectedSource, sourceType, orderId
   - Методы: displaySourceTypeLabel

5. **TransactionFormActions.vue** (~50 строк)
   - Кнопки: Сохранить, Удалить, Копировать
   - Props: editingItemId, isDeleted, isTransfer, permissions
   - Emits: save, delete, copy

**Ожидаемый результат:** Основной компонент ~400-500 строк

---

### OrderCreatePage.vue (798 строк)
**Проблемы:**
- Табы уже есть, но логика внутри табов слишком большая
- Много логики работы с продуктами
- Много computed свойств для расчетов
- Дублирование логики сохранения (save и saveWithoutClose)

**Предложения по разбиению:**

1. **OrderInfoTab.vue** (~200 строк)
   - Поля: клиент, категория, дата, описание, проект, примечание
   - Props: v-model для всех полей
   - Emits: обновления значений

2. **OrderProductsTab.vue** (~250 строк)
   - ProductSearch компонент
   - Логика работы со складом
   - Props: products, warehouseId, projectId, currencySymbol
   - Emits: products-updated, product-removed

3. **OrderTransactionsTab.vue** (уже существует, но можно улучшить)
   - Уже выделен в отдельный компонент
   - Можно оставить как есть

4. **OrderSummaryBar.vue** (~100 строк)
   - Отображение сумм: к оплате, оплачено, остаток
   - Кнопки действий
   - Props: roundedTotalPrice, paidTotalAmount, remainingAmount, currencySymbol
   - Computed: remainingAmountClass

5. **OrderCalculationsMixin.js** (~150 строк)
   - Вынести computed свойства: subtotal, discountAmount, totalPrice, roundedTotalPrice
   - Методы расчета

**Ожидаемый результат:** Основной компонент ~300-400 строк

---

### OrdersPage.vue (1047 строк)
**Проблемы:**
- Два режима отображения (таблица и канбан)
- Много модальных окон
- Сложная логика работы с канбаном
- Много обработчиков событий

**Предложения по разбиению:**

1. **OrdersTable.vue** (~300 строк)
   - Табличное отображение
   - Фильтры
   - Пагинация
   - Props: orders, filters, columnsConfig
   - Emits: item-click, filters-changed, page-changed

2. **OrdersKanban.vue** (~250 строк)
   - Канбан доска
   - Логика перетаскивания
   - Props: orders, statuses, projects
   - Emits: order-moved, card-click

3. **OrdersFilters.vue** (~150 строк)
   - Все фильтры в одном месте
   - Props: filters (объект со всеми фильтрами)
   - Emits: filters-changed, filters-reset

4. **OrdersModals.vue** (~200 строк)
   - Управление всеми модальными окнами
   - OrderCreatePage, InvoiceCreatePage, TransactionCreatePage
   - Props: editingItem, selectedIds
   - Emits: saved, deleted, closed

5. **OrdersBatchActions.vue** (~100 строк)
   - Пакетные действия
   - Смена статуса, удаление, создание инвойса
   - Props: selectedIds, statuses
   - Emits: batch-action

**Ожидаемый результат:** Основной компонент ~200-300 строк

---

### TransactionsPage.vue (603 строки)
**Проблемы:**
- Средний размер, но можно улучшить
- Фильтры можно вынести

**Предложения по разбиению:**

1. **TransactionsFilters.vue** (~150 строк)
   - Все фильтры
   - Props: filters
   - Emits: filters-changed

2. **TransactionsTable.vue** (~300 строк)
   - Таблица с данными
   - Пагинация
   - Props: transactions, columnsConfig
   - Emits: item-click, page-changed

**Ожидаемый результат:** Основной компонент ~150-200 строк

---

## План реализации

### Этап 1: TransactionCreatePage
1. Создать TransactionFormFields.vue
2. Создать TransactionExchangeRateSection.vue
3. Создать TransactionBalancePreview.vue
4. Создать TransactionSourceSection.vue
5. Создать TransactionFormActions.vue
6. Рефакторить основной компонент

### Этап 2: OrderCreatePage
1. Создать OrderInfoTab.vue
2. Создать OrderProductsTab.vue
3. Создать OrderSummaryBar.vue
4. Создать OrderCalculationsMixin.js
5. Рефакторить основной компонент

### Этап 3: OrdersPage
1. Создать OrdersTable.vue
2. Создать OrdersKanban.vue
3. Создать OrdersFilters.vue
4. Создать OrdersModals.vue
5. Создать OrdersBatchActions.vue
6. Рефакторить основной компонент

### Этап 4: TransactionsPage
1. Создать TransactionsFilters.vue
2. Создать TransactionsTable.vue
3. Рефакторить основной компонент

---

## Преимущества рефакторинга

1. **Читаемость:** Каждый компонент отвечает за одну задачу
2. **Переиспользование:** Компоненты можно использовать в других местах
3. **Тестируемость:** Легче писать unit-тесты для маленьких компонентов
4. **Поддерживаемость:** Изменения в одной части не затрагивают другие
5. **Производительность:** Можно использовать lazy loading для редко используемых компонентов

---

## Рекомендации

1. Начать с TransactionCreatePage - самый большой файл
2. Тестировать после каждого этапа
3. Сохранять обратную совместимость
4. Использовать Composition API для новых компонентов (опционально)
5. Документировать props и emits для каждого компонента

