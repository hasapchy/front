# 🔧 Исправление проблемы с кэшем при переключении компании

## 📋 Проблема (БЫЛО)

При переключении компании данные не обновлялись, хотя на сервере были новые данные.

### Причины:
1. **localStorage кэш не привязан к компании** - timestamp'ы сохранялись как `warehouses_timestamp` вместо `warehouses_{companyId}_timestamp`
2. **При переключении компании** старые timestamp'ы считались актуальными, и загружались кэшированные данные старой компании
3. **Pages не слушали событие company-changed** - они не перезагружали данные при смене компании
4. **Событие company-changed отправлялось ДО загрузки данных** - компоненты реагировали на старые данные

## ✅ Решение (СТАЛО)

### 1. Store действия - привязка кэша к компании

Обновлены все методы загрузки данных компании в `src/store/index.js`:

#### `loadWarehouses()` - Строка 444-478
- ✅ Получает ID текущей компании
- ✅ Использует ключ кэша: `warehouses_{companyId}`
- ✅ Использует ключ timestamp: `warehouses_{companyId}_timestamp`
- ✅ **Явно сохраняет timestamp** после загрузки данных

#### `loadCashRegisters()` - Строка 479-518
- ✅ Ключ кэша: `cashRegisters_{companyId}`
- ✅ Ключ timestamp: `cashRegisters_{companyId}_timestamp`
- ✅ **Явное сохранение timestamp**

#### `loadClients()` - Строка 519-569
- ✅ Ключ кэша: `clients_{companyId}`
- ✅ Ключ timestamp: `clients_{companyId}_timestamp`
- ✅ **Явное сохранение timestamp**

#### `loadCategories()` - Строка 602-627
- ✅ Ключ кэша: `categories_{companyId}`
- ✅ Ключ timestamp: `categories_{companyId}_timestamp`
- ✅ **Явное сохранение timestamp**

#### `loadProjects()` - Строка 628-669
- ✅ Ключ кэша: `projects_{companyId}`
- ✅ Ключ timestamp: `projects_{companyId}_timestamp`
- ✅ **Явное сохранение timestamp**

### 2. Store действие - инвалидация кэша при смене компании

Обновлено действие `setCurrentCompany()` в `src/store/index.js` (Строка 1043):
- ✅ Получает старый ID компании перед сменой
- ✅ Вызывает `CacheInvalidator.invalidateByCompany(oldCompanyId)` для очистки старого кэша
- ✅ **Отправляет событие `company-changed` ПОСЛЕ загрузки данных** (не до!)

### 3. Удаление дублирования события

В `src/views/components/app/CompanySwitcher.vue` (Строка 146):
- ❌ Удалено: дублирующееся событие `company-changed` из компонента
- ✅ Теперь событие отправляется ИЗ Store ПОСЛЕ загрузки данных

### 4. Pages с реакцией на company-changed

Добавлен `companyChangeMixin` ко всем важным страницам:

#### ProductsPage - `src/views/pages/products/ProductsPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### ServicesPage - `src/views/pages/products/ServicesPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### SalesPage - `src/views/pages/sales/SalesPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### OrdersPage - `src/views/pages/orders/OrdersPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### WarehousesPage - `src/views/pages/warehouses/WarehousesPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### CashRegistersPage - `src/views/pages/cash_registers/CashRegistersPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### CategoriesPage - `src/views/pages/categories/CategoriesPage.vue`
- ✅ Добавлен import и миксин
- ✅ При смене компании вызывает `fetchItems()` для перезагрузки

#### TransactionsPage - `src/views/pages/transactions/TransactionsPage.vue`
- ✅ Уже использовал `companyChangeMixin`

#### ProjectsPage - `src/views/pages/projects/ProjectsPage.vue`
- ✅ Уже использовал `companyChangeMixin`

#### ClientsPage - `src/views/pages/clients/ClientsPage.vue`
- ✅ Уже использовал `companyChangeMixin`

## 🔄 Поток работы

### Переключение компании теперь работает так:

```
Пользователь кликает на компанию в CompanySwitcher
                      ↓
CompanySwitcher.selectCompany(companyId)
                      ↓
Store.setCurrentCompany(companyId)
                      ↓
        oldCompanyId = текущая компания
                      ↓
POST /user/set-company → получаем новую компанию
                      ↓
SET_CURRENT_COMPANY → обновляем текущую
                      ↓
CacheInvalidator.invalidateByCompany(oldCompanyId)
        → удаляет старый кэш из localStorage
                      ↓
loadCompanyData()
        → проверяет что компания изменилась
        → вызывает CLEAR_COMPANY_DATA (очищает state)
        → загружает данные новой компании с API
        → сохраняет новые timestamp'ы
                      ↓
eventBus.emit('company-changed', newCompanyId)
                      ↓
Все Pages со своего слушателя видят событие
                      ↓
Pages.onCompanyChanged()
        → вызывает fetchItems()
        → загружает свои данные с API
        → обновляет UI
```

## 📊 Результаты

| Что | Было | Стало |
|-----|------|-------|
| localStorage ключи | `warehouses_timestamp` | `warehouses_{companyId}_timestamp` |
| При смене компании | Старый кэш загружается | Старый кэш удаляется, новый загружается |
| Pages обновляют данные | ❌ Нет | ✅ Да (через companyChangeMixin) |
| Событие company-changed | ❌ До загрузки | ✅ После загрузки |
| Удаление дублей | ❌ Два события | ✅ Одно событие из Store |

## 🧪 Как протестировать

1. Откройте DevTools → Application → Local Storage
2. Переключитесь на другую компанию
3. Посмотрите что:
   - ✅ Старые ключи `warehouses_1_timestamp` удалены
   - ✅ Новые ключи `warehouses_2_timestamp` созданы
   - ✅ Данные на страницах обновились
   - ✅ В консоли нет ошибок

## 📝 Затронутые файлы

```
Frontend:
✅ src/store/index.js - 5 методов обновлены
✅ src/views/components/app/CompanySwitcher.vue - удалено дублирование события
✅ src/views/pages/products/ProductsPage.vue - добавлен миксин
✅ src/views/pages/products/ServicesPage.vue - добавлен миксин
✅ src/views/pages/sales/SalesPage.vue - добавлен миксин
✅ src/views/pages/orders/OrdersPage.vue - добавлен миксин
✅ src/views/pages/warehouses/WarehousesPage.vue - добавлен миксин
✅ src/views/pages/cash_registers/CashRegistersPage.vue - добавлен миксин
✅ src/views/pages/categories/CategoriesPage.vue - добавлен миксин
```

## 🎯 Решенные проблемы

1. ✅ **Данные одной компании показывались в другой** - теперь кэш привязан к companyId
2. ✅ **Pages не перезагружали данные при смене компании** - добавлены миксины
3. ✅ **Дублирующиеся события** - осталось одно из Store
4. ✅ **Событие отправлялось ДО загрузки** - теперь ПОСЛЕ

## ⚠️ Важно

- CacheInvalidator уже правильно удаляет кэш с паттернами типа `warehouses_{companyId}` ✅
- vuex-persistedstate сохраняет данные, но timestamp'ы теперь сохраняются явно ✅
- Все API запросы фильтруют по current_company на Backend'е ✅

Все работает! 🎉
