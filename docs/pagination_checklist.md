Проверка пагинации (per_page, page), дефолт 20

Готово:
- UsersController
- TransactionCategoryController
- WarehouseWriteoffController
- WarehouseMovementController
- TransfersController
- CashRegistersController
- WarehouseReceiptController
- OrderStatusController
- ProjectStatusController
- CategoriesController
- WarehouseController
- RolesController
- ProductController (products, services)
- OrderController
- TransactionsController
- SaleController
- ProjectContractsController

Фронт:
- crudEventMixin + PerPageSelector: дефолт 20, чтение из localStorage perPage. Если у пользователя сохранено старое значение, оно применяется.

