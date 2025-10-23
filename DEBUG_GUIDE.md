# 🔍 ОТЛАДКА - Восстановление компании при перезагрузке

## 📋 Что проверить

### Шаг 1: Откройте DevTools (F12)
1. Откройте приложение
2. Нажмите **F12** (или Ctrl+Shift+I)
3. Перейдите на вкладку **Console**

### Шаг 2: Переключитесь на другую компанию
1. Кликните на переключатель компаний (компании в header)
2. Выберите **другую компанию** (например, Компанию B)
3. **В консоли** должны увидеть логи:

```
[setCurrentCompany] 🔄 Переключение на компанию: 2
[setCurrentCompany] Старая компания: 1
[setCurrentCompany] ✅ Получили с сервера: Компания B
[setCurrentCompany] 💾 Сохранили currentCompany
[setCurrentCompany] 🗑️ Инвалидируем кэш старой компании: 1
[setCurrentCompany] 🗑️ Удаляем данные компании из localStorage
[setCurrentCompany] ✅ Очистили persistedstate
[setCurrentCompany] 📡 Загружаем данные новой компании
[setCurrentCompany] 📢 Отправляем company-changed событие
```

### Шаг 3: Перезагрузите страницу
1. Нажмите **F5** (или Ctrl+R)
2. Подождите пока страница загружается
3. **В консоли** должны увидеть логи:

```
[loadCurrentCompany] Начало загрузки текущей компании
[loadCurrentCompany] state.currentCompany: null
[loadCurrentCompany] state.lastCompanyId: 2
[loadCurrentCompany] state.userCompanies: [Array(2)]
[loadCurrentCompany] ❌ currentCompany не в state
[loadCurrentCompany] 🔍 Ищем компанию с ID: 2
[loadCurrentCompany] ✅ Восстановили последнюю компанию: Компания B
[loadCurrentCompany] 📡 Загружаем данные новой компании
```

---

## ⚠️ ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Сценарий 1: currentCompany всегда null после перезагрузки

**Логи показывают:**
```
[loadCurrentCompany] state.currentCompany: null
[loadCurrentCompany] state.lastCompanyId: null
[loadCurrentCompany] ❌ lastCompanyId или userCompanies пусты
[loadCurrentCompany] 📡 Загружаем компанию с сервера
```

**Проблема:** `lastCompanyId` не сохраняется в localStorage

**Решение:**
- Проверьте что `lastCompanyId` в `paths` в `createPersistedState`
- Проверьте что `SET_LAST_COMPANY_ID` вызывается в `setCurrentCompany`

---

### Сценарий 2: lastCompanyId есть, но компания не найдена

**Логи показывают:**
```
[loadCurrentCompany] state.lastCompanyId: 2
[loadCurrentCompany] userCompanies: [Array(1)]
[loadCurrentCompany] ❌ Компания с ID 2 не найдена в userCompanies
```

**Проблема:** `userCompanies` еще не загружены когда вызывается `loadCurrentCompany`

**Решение:**
- В `App.vue` `loadUserCompanies()` должен быть вызван **ПЕРЕД** `loadCurrentCompany()`
- Проверьте порядок вызовов в `App.vue` строке 39-41

---

### Сценарий 3: Компания восстановлена, но данные не загружаются

**Логи показывают:**
```
[loadCurrentCompany] ✅ Восстановили последнюю компанию: Компания B
```

Но данные не появляются на странице.

**Проблема:** `loadCompanyData()` не закончила загрузку

**Решение:**
- Посмотрите логи в консоли, есть ли ошибки в `loadCompanyData`
- Проверьте Network tab в DevTools - есть ли API запросы
- Проверьте есть ли ошибки в API ответах

---

## 📊 Полная диаграмма логирования

```
F5 - Перезагрузка
      ↓
App.vue created()
      ↓
loadUserCompanies() ✅
      ↓
loadCurrentCompany() 🔍 START
      ├─ currentCompany в state? ❌
      ├─ lastCompanyId есть? ✅
      ├─ userCompanies загружены? ✅
      ├─ Найти компанию по ID ✅
      ├─ Восстановить компанию ✅
      ├─ loadCompanyData() 📡
      └─ FINISH ✅
      ↓
Страница загружена с правильной компанией ✅
```

---

## 🛠️ Команды для быстрой отладки в консоли

```javascript
// Проверить currentCompany
console.log(this.$store.state.currentCompany);

// Проверить lastCompanyId
console.log(this.$store.state.lastCompanyId);

// Проверить userCompanies
console.log(this.$store.state.userCompanies);

// Проверить persisted state в localStorage
JSON.parse(localStorage.getItem('birhasap_vuex_cache')).currentCompany;

// Вручную переключиться на компанию
this.$store.dispatch('setCurrentCompany', 2);

// Вручную очистить localStorage
localStorage.clear();
```

---

## ✅ Ожидаемое поведение

### При переключении компании:
1. ✅ Видите логи переключения в консоли
2. ✅ Данные обновляются на странице
3. ✅ `lastCompanyId` сохраняется в localStorage

### При перезагрузке страницы:
1. ✅ Видите логи восстановления в консоли
2. ✅ **Та же компания** восстанавливается (не первая)
3. ✅ Данные этой компании загружаются
4. ✅ Все работает правильно

---

**Если все логи есть и нормальные, но компания все равно не восстанавливается - напишите все логи из консоли, помогу отладить!**
