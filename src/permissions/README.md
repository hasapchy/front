# Модуль прав доступа (permissions)

Используется для проверки прав пользователя во фронтенде и для построения UI редактора ролей.

## Файлы

### `config.js`

**Назначение:** единый конфиг ресурсов и прав.

- **`resources`** — описание каждого ресурса (склады, транзакции, клиенты и т.д.):
  - `has_creator_id`, `check_strategy` — для бэкенд-логики и для понимания, есть ли «own»/«all»
  - `actions`, `scope_actions` — стандартные действия (view, create, update, delete)
  - `custom_permissions` — доп. права по ресурсу (например `products_create_temp`, `transactions_view_sale`)
- **`groups`** — группировка ресурсов для UI редактора ролей (финансы, склады, заказы и т.д.)
- **`group_custom_permissions`** — привязка кастомных прав к группам (проекты, финансы, клиенты)
- **`custom_permissions`** — массив имён кастомных прав (используется как справочник, в коде не читается)

**Где используется:** `checker.js`, `parser.js`, `RolesCreatePage.vue` (редактор ролей).

---

### `parser.js`

**Назначение:** разбор имени права в структуру (ресурс, действие, scope).

- **`PermissionParser.parse(name)`** — возвращает `{ type, resource, action, scope }` или `null`. Типы: `standard` (например `orders_create`), `custom` (например `settings_edit_any_date`).
- **`PermissionParser.generate(resource, action, scope)`** — собирает имя права из частей.
- **`PermissionParser.isStandard(name)`** / **`isCustom(name)`** — проверка типа права.
- **`PermissionParser.getResourceConfig()`** — возвращает `PERMISSIONS_CONFIG.resources`.
- **`PermissionParser.parsePermissions(permissions)`** — группирует массив прав по ресурсам и действиям для UI.

**Где используется:** `checker.js`, `utils.js`, `RolesCreatePage.vue`.

---

### `checker.js`

**Назначение:** проверка прав по текущему пользователю и списку прав.

- **`isAdmin(user)`** — признак администратора (полный доступ).
- **`hasPermission(permissionName, userPermissions, user?)`** — основная функция проверки:
  - админ — всегда `true`;
  - иначе проверка по `userPermissions` с учётом парсинга имени (standard/custom, all/own, кастомные права из config).

**Где используется:** геттер `hasPermission` в Vuex store (`store/index.js`), далее во всём приложении через `$store.getters.hasPermission('...')` (роутер, страницы, кнопки, видимость вкладок).

---

### `utils.js`

**Назначение:** утилиты для отображения прав в UI (иконки и цвета).

- **`permissionIcon(name)`** — класс иконки Font Awesome по имени права (view → eye, create → plus и т.д.; для `settings_*` — отдельная маппинг).
- **`permissionColor(name)`** — класс цвета по действию (view → blue, create → green, delete → red и т.д.).

**Где используется:** только `RolesCreatePage.vue` (чекбоксы и списки прав в редакторе ролей).

---

### `index.js`

**Назначение:** публичный API модуля. Реэкспортирует:

- `PERMISSIONS_CONFIG`, `PermissionParser` — для редактора ролей и парсера.
- `permissionIcon`, `permissionColor` — для UI прав в ролях.
- `hasPermission`, `isAdmin` — для store и компонентов.

Импортировать права нужно так: `import { hasPermission, PERMISSIONS_CONFIG, ... } from '@/permissions'` (или `@/permissions` в зависимости от алиасов).

---

## Использование в приложении

- **Роутер:** `meta.permission` — доступ к маршруту через `store.getters.hasPermission(to.meta.permission)`.
- **Страницы:** кнопки «Создать», «Экспорт», вкладки, действия в таблицах — через `$store.getters.hasPermission('resource_action')` или `_action_all` / `_action_own`.
- **Редактор ролей:** `RolesCreatePage.vue` использует `PERMISSIONS_CONFIG`, `PermissionParser`, `permissionIcon`, `permissionColor` для построения дерева прав и отображения иконок/цветов.
