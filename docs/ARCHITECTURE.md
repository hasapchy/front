# Архитектура системы - Памятка

## 🏗️ Структура проектов
- **Backend:** `D:\OSPanel\domains\rem-online` (Laravel API)
- **Frontend:** `D:\OSPanel\domains\hasapchy` (Vue.js SPA)

## 🔐 Система компаний
- **Мультитенантность:** Каждый пользователь может работать с несколькими компаниями
- **Фильтрация:** Все данные фильтруются по `company_id` из контекста компании (Sanctum-токен или сессия SPA, middleware `ResolveCompanyContext`)
- **Переключение:** CompanySwitcher → store → перезагрузка всех данных компании

## 📦 Система кэширования (2-уровневая)

### Глобальные данные (TTL: 24ч)
```
localStorage:
├── currencies_cache
├── units_cache
```

### Данные по компаниям (TTL: 10мин)
```
localStorage:
├── warehouses_{companyId}
├── cashRegisters_{companyId}
├── clients_{companyId}
├── products_{companyId}
├── services_{companyId}
├── categories_{companyId}
├── projects_{companyId}
```

## 🎯 Store (Vuex)
**State:** все сущности + currentCompany + companyDataCache
**Actions:** loadCompanyData, loadCurrencies, loadUnits, setCurrentCompany
**Getters:** прямой доступ к данным

## 🔄 Загрузка данных
1. **App.vue:** loadCurrencies + loadUnits + loadUserCompanies + loadCurrentCompany + loadCompanyData
2. **Компоненты:** используют store.getters вместо прямых API вызовов
3. **При смене компании:** автоматическая перезагрузка через setCurrentCompany

## 📋 Проекты - фильтрация статусов
- **В формах выбора:** `/projects/active` (исключает статусы 3="Завершен", 4="Отменен")
- **На странице проектов:** `/projects/all` (показывает все проекты)

## 🛠️ Backend - фильтрация по компаниям
**Все Repository используют:**
```php
private function getCurrentCompanyId() {
    return ResolvedCompany::fromRequest();
}

private function addCompanyFilter($query) {
    $companyId = $this->getCurrentCompanyId();
    if ($companyId) {
        $query->where('table.company_id', $companyId);
    } else {
        $query->whereNull('table.company_id');
    }
    return $query;
}
```

## 🚫 Удаленные компоненты
- ❌ SystemSettingsPage (настройки теперь из таблицы companies)
- ❌ SettingsController (фронт/бэк)
- ❌ Таблица settings (миграция удаления создана)
- ✅ Мониторинг производительности сохранен

## 🎨 UI
- **Сайдбар:** "Моя компания" (без мигания)
- **Заголовок:** название компании на главной странице
- **Логотип:** из currentCompany.logo

## ⚡ Производительность
- **Кэш из localStorage:** мгновенная загрузка
- **Параллельная загрузка:** все сущности загружаются одновременно
- **Graceful fallback:** при ошибке сети используется устаревший кэш
- **Автоматическая очистка:** при смене компании

## 🔧 Утилиты
- **CacheUtils:** TTL, set/get/clear методы
- **axiosInstance:** cookie-сессия (SPA); mobile — `company_id` в токене при login

## 📱 Компоненты используют store
```javascript
// ❌ Старый способ:
this.warehouses = await WarehouseController.getListItems();

// ✅ Новый способ:
this.warehouses = this.$store.getters.warehouses;
```

## 🗄️ Основные таблицы с company_id
- warehouses, cash_registers, clients, products, projects
- categories (пока без company_id)
