# Чеклист лучших практик (Frontend)

Состояние на основе анализа кодовой базы. Отмечайте по мере внедрения.

---

## Запросы и сеть

| # | Практика | Статус | Где смотреть / что сделать |
|---|----------|--------|----------------------------|
| 1 | **Отмена запросов (AbortController)** | ✅ Сделано | В ClientSearch, ProductSearch, OrderSearch, UserSearch при новом вводе предыдущий запрос отменяется через `AbortController`; в контроллерах (ClientController.searchItems, ProductController.searchItems, UsersController.searchItems, OrderController.getItems, ClientController.getItems) опциональный параметр `signal` передаётся в axios. |
| 2 | **Повтор при ошибке (retry)** | ✅ Есть | `cache/utils.js` — `retryWithExponentialBackoff`, используется в store и cache/loader. |
| 3 | **Таймаут запросов** | ✅ Сделано | В `api/axiosInstance.js`: `timeout: 30000` в `axios.create`; при `error.code === 'ECONNABORTED'` показывается уведомление с ключом `loadTimeout` из lang. |

---

## Формы и UX

| # | Практика | Статус | Где смотреть / что сделать |
|---|----------|--------|----------------------------|
| 4 | **Фокус в модалках** | ✅ Сделано | В SideModalDialog и AlertDialog подключён `useFocusTrap` из `@vueuse/integrations`: при открытии фокус в ловушке, при закрытии — `returnFocus: true`. |
| 5 | **Горячие клавиши** | ✅ Сделано | `keyboardShortcutsMixin` + `onKeyStroke` (VueUse): Esc закрывает модалку (SideModalDialog, AlertDialog) и вызывает handleCloseRequest в формах (formChangesMixin.handleEscapeKey). Ctrl+S сохраняет форму (crudFormMixin.handleSaveShortcut при отсутствии saveLoading). |
| 6 | **Защита от потери данных** | ⚠️ Частично | `formChangesMixin` + диалог «Несохранённые изменения» используются во многих Create-страницах при закрытии через кнопку. Нет `beforeunload`: при закрытии вкладки/браузера с несохранённой формой предупреждение не показывается. В миксине добавить `window.addEventListener('beforeunload', handler)` при наличии изменений. |

---

## Отображение и загрузка

| # | Практика | Статус | Где смотреть / что сделать |
|---|----------|--------|----------------------------|
| 7 | **Скелетоны вместо спиннеров** | ✅ Сделано | Компонент `TableSkeleton.vue` (список/таблица с `animate-pulse`). На страницах списков и в табах с таблицами загрузка показывается через `<TableSkeleton />` в блоке `min-h-64` вместо SpinnerIcon. SpinnerIcon оставлен для кнопок, сайдбара, дропдаунов и мелких блоков. |
| 8 | **Глобальный обработчик ошибок** | ❌ Нет | В `main.js` не заданы `app.config.errorHandler` и обработчик `window.onunhandledrejection`. Добавить: логирование + показ пользователю сообщения об ошибке (и при желании отправка в систему мониторинга). |

---

## Доступность и стабильность

| # | Практика | Статус | Где смотреть / что сделать |
|---|----------|--------|----------------------------|
| 9 | **A11y (aria, роли)** | ✅ Сделано | SideModalDialog: `role="dialog"`, `aria-modal="true"`, `aria-label` (titleA11y / formPanel), кнопка закрытия с `aria-label`. AlertDialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, `aria-describedby="modal-descr"`. PrimaryButton: пропсы `ariaLabel` и `title`; у всех иконочных кнопок (закрыть, сохранить, удалить, добавить и т.д.) добавлен `:aria-label="$t(...)"`. Ключи в ru/en/tm. |
| 10 | **Очередь уведомлений (toast)** | ✅ Сделано | Используется **vue3-toastify**: несколько тостов одновременно (лимит 5), анимация `bounce`, позиция top-right. Управление через store: `showNotification` вызывает `toast.success`/`toast.error` и звуки; `closeNotification` — `toast.clearAll()`. |

---

## Данные и кэш

| # | Практика | Статус | Где смотреть / что сделать |
|---|----------|--------|----------------------------|
| 11 | **Инвалидация после мутаций** | ⚠️ Проверить | После create/update/delete списки должны обновляться (перезапрос или обновление store). Реализовано через эмиты `saved`/`deleted` и перезагрузку данных на страницах. Стоит выборочно проверить сценарии: создал запись → список обновился без ручного F5. |
| 12 | **Состояние «пусто»** | ⚠️ Частично | Есть использование `$t('noData')` в SimpleStockSearch, SimpleProductSearch, SimpleServicesRow, DraggableTable, KanbanColumn (`emptyText`). Не везде у списков/таблиц явный экран «здесь пока ничего нет» с подсказкой (например «Добавить первый заказ»). Унифицировать пустые состояния на страницах списков. |

---

## Уже в хорошем состоянии

- **Debounce** — поиск и фильтры (ClientSearch, OrderSearch, ContractSearch, ProductSearch, UserSearch и др., LeavesPage, CompanyHolidaysPage, OrdersPage/TasksPage/ProjectsPage для смены статуса).
- **Loading на кнопках** — `saveLoading`/`deleteLoading` через crudFormMixin и PrimaryButton (`:is-loading`), в т.ч. после недавних правок на OrderCreatePage и MessengerPage.
- **Защита от двойной отправки** — через `saveLoading` и `disabled` на кнопках.
- **Retry** — `retryWithExponentialBackoff` в store и cache.
- **Флаг несохранённых изменений** — formChangesMixin и диалог при закрытии формы (без beforeunload).

---

## Рекомендуемый приоритет

1. Таймаут запросов (axios) — быстро, снижает «зависание» при проблемах с сетью.
2. Глобальный errorHandler + unhandledrejection — одна точка обработки ошибок.
3. beforeunload в formChangesMixin — защита при закрытии вкладки.
4. AbortController в поиске — улучшение UX при быстром вводе.
5. Фокус в модалках и клавиши Ctrl+S / Esc — удобство и a11y.
6. A11y для модалок и иконочных кнопок.
7. Скелетоны и единые пустые состояния — по желанию и ресурсам.

---

## VueUse — подключено

| Утилита | Статус | Где |
|--------|--------|-----|
| **useFocusTrap** | ✅ | SideModalDialog, AlertDialog — фокус в модалке, returnFocus при закрытии. |
| **onKeyStroke** | ✅ | keyboardShortcutsMixin (Esc, Ctrl+S); SideModalDialog/AlertDialog (Esc); formChangesMixin.handleEscapeKey; crudFormMixin.handleSaveShortcut. |
| **useWindowSize** | ✅ | SidebarLayout (isMobile), AppSidebarComponent (isDesktop/isMobile), CompanySwitcher, LanguageSwitcher — реактивная ширина, без resize-подписок. |
| **onClickOutside** | ✅ | CompanySwitcher, LanguageSwitcher — закрытие дропдауна по клику снаружи. |
| **useStorage** / **useLocalStorage** | ⚠️ Опционально | PerPageSelector и страницы с таблицами используют localStorage вручную (crudEventMixin, getStoredPerPage). useLocalStorage не внедрять в PerPageSelector — ломает инициализацию таблиц. По желанию: viewMode, locale. CacheComponent.vue — UI кэша. |
