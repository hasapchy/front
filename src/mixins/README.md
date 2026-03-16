## Миксины фронта

В этой папке собраны переиспользуемые миксины Vue, которые инкапсулируют типовую бизнес‑логику и работу с UI. Ниже кратко описано назначение каждого файла и ожидаемый контракт с компонентом.

- **kanbanByStatusMixin.js**  
  Управление канбан‑доской с разбиением по статусам: хранение состояний по статусу, первичная загрузка, подгрузка следующих страниц, синхронизация плоского списка `kanbanOrdersStable` и обработка ошибок загрузки.

- **crudEventMixin.js**  
  Унифицированная обработка успешного/ошибочного сохранения и удаления сущностей: показ уведомлений, инвалидация кеша через `CacheInvalidator`, повторная загрузка списка с сохранением страницы и закрытие модалки.

- **exportTableMixin.js**  
  Логика экспорта данных таблицы: управление флагом загрузки, вызов `controller.export` с параметрами и выбранными строками, показ уведомлений об успехе/ошибке.

- **cardFieldsVisibilityMixin.js**  
  Управление видимостью полей карточек в канбане/таблицах: загрузка и сохранение настроек в `localStorage`, переключение видимости отдельных полей и сброс конфигурации к базовой.

- **companyChangeMixin.js**  
  Реакция на смену текущей компании: подписка на событие `company-changed`, слежение за `currentCompanyId`, последовательная обработка смены через `handleCompanyChanged` или `fetchItems`/`refreshData`.

- **notificationMixin.js**  
  Унифицированный доступ к глобальным уведомлениям: показ и закрытие нотификаций с поддержкой простого флага `isDanger` и расширенных опций (`isInfo`, кастомная длительность).

- **crudFormMixin.js**  
  Базовый миксин для форм CRUD: состояние загрузки/удаления, диалог подтверждения удаления, стандартный поток `save`/`deleteItem`, интеграция с шорткатами сохранения и хуки (`prepareSave`, `performSave`, `performDelete`, `onSaveSuccess` и т.д.).

- **keyboardShortcutsMixin.js**  
  Подключение горячих клавиш через `@vueuse/core`: Escape делегируется в `handleEscapeKey`, `Ctrl+S`/`Cmd+S` — в `handleSaveShortcut`, с очисткой подписок при размонтировании. Подключается только через **crudFormMixin**, в страницы не импортируется напрямую.

- **storeDataLoaderMixin.js**  
  Унифицированная загрузка справочников и других данных из Vuex‑store: ленивое использование уже загруженных данных, принудительный перезапрос, трансформация и параллельная загрузка нескольких наборов.

- **transactionFormConfigMixin.js**  
  Формирование конфигурации полей формы транзакции: расчет видимости, обязательности и режима только чтения на основе `formConfig`.

- **printInvoiceMixin.js**  
  Генерация и печать PDF‑счетов по выбранным заказам: агрегация позиций, формирование структуры счета, использование `InvoicePdfGenerator` и `pdfmake` для открытия и печати документа, обработка ошибок.

- **dateFormMixin.js**  
  Утилиты для работы с датами в формах: форматирование дат под `datetime-local`, адаптация дат из БД, ограничения по минимальной дате и проверка прав на редактирование дат.

- **filtersMixin.js**  
  Базовая логика фильтров для списков и канбана: применение и сброс фильтров через `fetchItems`, расчет количества активных фильтров и утилиты для работы с конфигурацией фильтров.

- **formChangesMixin.js**  
  Отслеживание изменений формы и подтверждение закрытия: снимок первоначального состояния, сравнение через `JSON.stringify`, диалог подтверждения закрытия и обработка Escape.

- **modalMixin.js**  
  Базовая модалка для детальных форм: открытие/закрытие с сохранением и восстановлением скролла, управление `editingItem`, реакция на смену `route` и загрузку элемента по id.

- **batchActionsMixin.js**  
  Массовые операции в списках: выбор и удаление нескольких элементов с подтверждением, показ агрегированных ошибок и формирование списка доступных batch‑действий с учетом прав.

- **errorMessageMixin.js**  
  Единый разбор ошибок API: поддержка специальных кодов ошибок заказов, ошибок валидации, общих сообщений и бэкапа по `error.message`.

- **searchMixin.js**  
  Обработка поиска по спискам: разбор строки поиска через `resolveSearchQuery`, сохранение запроса в store и запуск действий поиска/фильтрации/перезагрузки.

- **userPhotoMixin.js**  
  Метод `getUserPhotoSrc(user)` для отображения аватара пользователя; логика вынесена в **@/utils/userUtils** (`getUserPhotoSrc`, `getStoragePhotoUrl`). В компонентах без миксина можно импортировать утилиту напрямую.

---

## Анализ на дубли

**Используются везде:** `notificationMixin`, `errorMessageMixin`, `crudEventMixin`, `modalMixin`, `batchActionsMixin` — часто идут набором на страницах списков/CRUD. `filtersMixin`, `searchMixin`, `companyChangeMixin`, `storeDataLoaderMixin` — на страницах с фильтрами и сменой компании. `crudFormMixin` подключает **keyboardShortcutsMixin** внутри себя, в компоненты его не импортируют отдельно.

**Удалены как неиспользуемые:**  
- **keepAliveRefetchMixin.js** — ни один компонент не подключал; логика «при `activated` вызвать `fetchItems`» нигде не использовалась.  
- **formValidationMixin.js** — ни один компонент не импортировал; валидация делается локально (например, в `RolesCreatePage.vue` свой `validateForm`).

**URL фото пользователя:** общая логика вынесена в **@/utils/userUtils**: `getUserPhotoSrc(user)` и `getStoragePhotoUrl(path)`. **userPhotoMixin** и компоненты (UserSearch, UserProfileDropdown, OnlineUsersWidget, OrgNode, BirthdaysWidget, MessengerPage, ProfileModal) используют эту утилиту.

**Валидация форм во Vue:** во Vue 3 нет встроенной валидации форм. Обычно используют библиотеки **VeeValidate** (4.x для Vue 3) или **Vuelidate Next**. Удалённый **formValidationMixin** был самописным набором валидаторов; его ни один компонент не подключал — валидация делается локально в формах. При необходимости единого подхода к валидации можно внедрить VeeValidate/Vuelidate.

**Проверка использования миксинов:** каждый из оставшихся миксинов реально используется — вызовы методов подтверждены по кодовой базе: `handleExport`/`printInvoiceFromOrders` (exportTable, printInvoice), `cardFields`/`toggleCardFieldVisible` (cardFieldsVisibility — TransactionsPage, ClientsPage), `loadStoreData`/`loadMultipleStoreData` (storeDataLoader), `fieldConfig`/`isFieldVisible` (transactionFormConfig — TransactionCreatePage, TransactionSourceSection, TransactionFormFields), `getFormattedDate`/`canEditDate`/`getMinDate` (dateForm — несколько Create-страниц), `saveInitialState`/`handleCloseRequest`/`checkForChanges` (formChanges — множество форм), `fetchKanbanInitial`/`allKanbanItems`/`loadMoreKanbanItems` (kanbanByStatus — OrdersPage, ProjectsPage, TasksPage), `handleSearch` (searchMixin — страницы с глобальным поиском), `handleSaved`/`handleDeleted` и т.д. (crudEvent, notification, modal, batchActions, companyChange, getApiErrorMessage — массово). Рудиментов среди текущих миксинов нет.

---

## Рекомендации

- **Один набор миксинов на список:** реализовано. Введён **listPageMixin** (`@/mixins/listPageMixin`), объединяющий notification, errorMessage, crudEvent, modal, batchActions, companyChange, filters. Страницы списков переведены на него; при необходимости подключают дополнительно searchMixin, storeDataLoaderMixin, kanbanByStatusMixin и др.

- **Права в конфиге:** реализовано. Ресурсы `task_statuses` и `rec_schedules` добавлены в `PERMISSIONS_CONFIG.resources` и в группы `tasks` и `finance` в `front/src/permissions/config.js`.

- **Валидация:** в проекте уже подключены `@vuelidate/core` и `@vuelidate/validators`. При росте числа форм с проверками полей целесообразно использовать Vuelidate вместо локальных `validateForm` в компонентах.

- **Имена миксинов:** унификация по факту есть: везде используется миксин из `@/mixins/errorMessageMixin` (импорт часто как `getApiErrorMessage` или `errorMessageMixin`). Отдельного файла getApiErrorMessageMixin нет; при желании можно привести имена импортов к единому виду (например, везде `errorMessageMixin`).
