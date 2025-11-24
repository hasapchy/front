# Анализ дублирования методов в контроллерах

## ✅ Выполненный рефакторинг

### 1. Расширен BaseController
- ✅ Добавлена поддержка кеширования в `getItems()`
- ✅ Добавлены методы `storeItemWithCache()` и `updateItemWithCache()` для автоматической инвалидации кеша
- ✅ Добавлена поддержка инвалидации кеша в `deleteItem()`

### 2. Созданы утилиты
- ✅ `formDataHelper.js` - утилита для работы с FormData
- ✅ `dateFilterHelper.js` - утилита для построения параметров фильтрации по датам

### 3. Рефакторинг контроллеров
- ✅ Простые контроллеры переведены на BaseController:
  - RolesController
  - CategoryController
  - WarehouseController
  - TransferController
  - OrderStatusController
  - OrderCategoryController
  - OrderStatusCategoryController
  - TransactionCategoryController
  - ProjectStatusController
  - WarehouseReceiptController
  - WarehouseWriteoffController
  - WarehouseMovementController
  - CashRegisterController

- ✅ Контроллеры с кешированием переведены на BaseController:
  - ClientController
  - ProductController
  - InvoiceController
  - TransactionController
  - SaleController
  - OrderController
  - ProjectController

- ✅ Контроллеры с FormData используют утилиту:
  - ProductController
  - UsersController
  - CompaniesController
  - ProjectController

- ✅ Контроллеры с фильтрацией по датам используют утилиту:
  - OrderController
  - InvoiceController
  - SaleController
  - TransactionController

## Выявленные дублирования (до рефакторинга)

### 1. Стандартные CRUD методы
Многие контроллеры дублируют логику для стандартных операций:
- `getItems()` - получение списка с пагинацией
- `getAllItems()` - получение всех элементов
- `getItem(id)` - получение одного элемента
- `storeItem(item)` - создание элемента
- `updateItem(id, item)` - обновление элемента
- `deleteItem(id)` - удаление элемента

**Рекомендация**: Использовать `BaseController` для этих методов, но многие контроллеры не используют его.

### 2. Создание PaginatedResponse
Дублируется логика создания `PaginatedResponse` во многих контроллерах:
- ClientController
- CategoryController
- ProductController
- OrderController
- InvoiceController
- ProjectController
- UsersController
- WarehouseController
- TransactionController
- SaleController
- И другие...

**Рекомендация**: Вынести в `BaseController.getItems()` (уже есть, но не используется везде).

### 3. Работа с кешем
Дублируется логика работы с кешем:
- ClientController
- ProductController
- InvoiceController
- TransactionController
- SaleController
- OrderController (только invalidate)

**Рекомендация**: Создать миксин или расширить `BaseController` методами для работы с кешем.

### 4. Работа с FormData
Дублируется логика создания FormData:
- ProductController (storeItem, updateItem)
- UsersController (_prepareRequestData)
- CompaniesController (_buildFormData)
- ProjectController (uploadFiles)

**Рекомендация**: Создать утилиту для работы с FormData.

### 5. Фильтрация по датам
Дублируется логика фильтрации по датам:
- OrderController
- InvoiceController
- SaleController
- TransactionController

**Рекомендация**: Создать утилиту для построения параметров фильтрации по датам.

### 6. Преобразование DTO
Дублируется логика преобразования данных в DTO:
- Почти все контроллеры используют `DtoClass.fromApiArray([item])` и `items[0] || null`

**Рекомендация**: Вынести в `BaseController.getItem()` (уже есть, но не используется везде).

## ✅ Контроллеры, которые были упрощены

1. ✅ **RolesController** - использует BaseController
2. ✅ **CategoryController** - использует BaseController
3. ✅ **WarehouseController** - использует BaseController
4. ✅ **TransferController** - использует BaseController
5. ✅ **OrderStatusController** - использует BaseController
6. ✅ **OrderCategoryController** - использует BaseController
7. ✅ **OrderStatusCategoryController** - использует BaseController
8. ✅ **TransactionCategoryController** - использует BaseController
9. ✅ **ProjectStatusController** - использует BaseController
10. ✅ **WarehouseReceiptController** - использует BaseController
11. ✅ **WarehouseWriteoffController** - использует BaseController
12. ✅ **WarehouseMovementController** - использует BaseController
13. ✅ **WarehouseStockController** - использует BaseController
14. ✅ **CashRegisterController** - использует BaseController
15. ✅ **ProjectContractController** - частично использует BaseController (getItems, getAllItems, getItem, deleteItem)

## Контроллеры с уникальной логикой (частично используют BaseController)

1. ✅ **ClientController** - использует BaseController для CRUD, имеет searchItems, getBalanceHistory, кеширование
2. ✅ **ProductController** - использует BaseController для getItems, имеет searchItems, работу с изображениями через uploadWithProgress, кеширование
3. ✅ **OrderController** - использует BaseController для CRUD, имеет batchUpdateStatus, getOrderTransactions, linkTransactionToOrder
4. ✅ **InvoiceController** - использует BaseController для CRUD, имеет getOrdersForInvoice, кеширование
5. ✅ **ProjectController** - использует BaseController для CRUD, имеет uploadFiles, deleteFile, getBalanceHistory, getDetailedBalance, batchUpdateStatus
6. ✅ **UsersController** - использует BaseController для getItems/getAllItems, имеет работу с профилем, зарплатами, балансом, FormData через утилиту
7. ✅ **TransactionController** - использует BaseController для CRUD, имеет getTotalPaidByOrderId, createTransactionForOrder, работу со store
8. ✅ **CashRegisterController** - использует BaseController для CRUD, имеет getCashBalance
9. **CommentController** - имеет getTimeline, специфичную логику
10. ✅ **ProjectContractController** - частично использует BaseController, имеет специфичную логику работы с контрактами (toApi())
11. **CurrencyHistoryController** - имеет специфичную логику работы с историей валют
12. **UserCompanyController** - имеет специфичную логику работы с компаниями пользователя

