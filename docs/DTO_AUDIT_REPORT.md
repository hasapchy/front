# Аудит DTO на фронтенде

**Дата аудита:** 2024  
**Всего DTO файлов:** 44  
**Директория:** `src/dto/`

## Содержание

1. [Общая статистика](#общая-статистика)
2. [Структура DTO](#структура-dto)
3. [Выявленные проблемы](#выявленные-проблемы)
4. [Рекомендации](#рекомендации)
5. [Детальный анализ по категориям](#детальный-анализ-по-категориям)

---

## Общая статистика

### Распределение по категориям

- **app** - 3 DTO (CurrencyDto, PaginatedResponseDto, UnitDto)
- **cash_register** - 3 DTO (CashRegisterDto, CashRegisterBalanceDto, CashRegisterBalanceItemDto)
- **category** - 1 DTO (CategoryDto)
- **client** - 5 DTO (ClientDto, ClientEmailDto, ClientPhoneDto, ClientSearchDto, ClientBalanceHistoryDto)
- **companies** - 1 DTO (CompanyDto)
- **currency** - 1 DTO (CurrencyHistoryDto)
- **invoice** - 2 DTO (InvoiceDto, InvoiceProductDto)
- **order** - 7 DTO (OrderDto, OrderCategoryDto, OrderProductDto, OrderStatusDto, OrderStatusCategoryDto, OrderTempProductDto, OrderTransactionDto)
- **product** - 2 DTO (ProductDto, ProductSearchDto)
- **project** - 5 DTO (ProjectDto, ProjectBalanceHistoryDto, ProjectContractDto, ProjectStatusDto, ProjectTransactionDto)
- **sale** - 2 DTO (SaleDto, SaleProductDto)
- **transaction** - 2 DTO (TransactionDto, TransactionCategoryDto)
- **transfer** - 1 DTO (TransferDto)
- **users** - 1 DTO (UserDto)
- **warehouse** - 8 DTO (WarehouseDto, WarehouseMovementDto, WarehouseMovementProductDto, WarehouseReceiptDto, WarehouseReceiptProductDto, WarehouseStockDto, WarehouseWriteoffDto, WarehouseWriteoffProductDto)

### Методы создания экземпляров

- **fromApiArray** - 39 DTO (88.6%)
- **fromApi** - 2 DTO (OrderTransactionDto, ProjectTransactionDto)
- **Без статических методов** - 3 DTO (ClientEmailDto, ClientPhoneDto, PaginatedResponseDto)

### Экспорт

- **export default** - 41 DTO (93.2%)
- **export class** - 2 DTO (CompanyDto, UserDto)
- **class без export** - 1 DTO (ProductDto - экспортируется в конце)

---

## Структура DTO

### Паттерны конструкторов

1. **Объект в конструкторе** (7 DTO):
   - CurrencyDto
   - ProductDto
   - ProductSearchDto
   - CompanyDto
   - TransactionCategoryDto
   - OrderTempProductDto
   - UserDto

2. **Отдельные параметры** (38 DTO):
   - Все остальные DTO

### Методы форматирования

**DTO с методами форматирования дат:**
- ClientDto, OrderDto, ProductDto, CategoryDto, CashRegisterDto, CurrencyHistoryDto, InvoiceDto, OrderCategoryDto, OrderStatusDto, OrderStatusCategoryDto, ProjectDto, ProjectStatusDto, SaleDto, TransactionDto, TransactionCategoryDto, TransferDto, WarehouseDto, WarehouseMovementDto, WarehouseReceiptDto, WarehouseWriteoffDto

**DTO с методами форматирования чисел/валют:**
- ClientDto, OrderDto, ProductDto, ClientSearchDto, ClientBalanceHistoryDto, InvoiceDto, InvoiceProductDto, OrderTempProductDto, ProjectDto, ProjectContractDto, ProjectTransactionDto, SaleDto, TransactionDto, TransferDto, WarehouseReceiptDto

**DTO с методами форматирования HTML:**
- ClientDto, OrderDto, ProductDto, ClientSearchDto, InvoiceDto, SaleDto, OrderTempProductDto, SaleProductDto

---

## Выявленные проблемы

### 🔴 Критические проблемы

1. **Отсутствие статических методов создания**
   - `ClientEmailDto` - нет `fromApiArray`
   - `ClientPhoneDto` - нет `fromApiArray`
   - `PaginatedResponseDto` - нет `fromApiArray`

2. **Непоследовательность в именовании методов**
   - Большинство используют `fromApiArray`
   - `OrderTransactionDto` и `ProjectTransactionDto` используют `fromApi`
   - Нет единого стандарта

3. **Непоследовательность в стиле конструкторов**
   - 8 DTO используют объект в конструкторе
   - 37 DTO используют отдельные параметры
   - Это усложняет поддержку и понимание кода

4. **Дублирование логики**
   - Методы форматирования дат дублируются во многих DTO
   - Логика преобразования snake_case в camelCase дублируется
   - Методы форматирования чисел/валют дублируются

5. **Закомментированный код**
   - `OrderDto` содержит большой блок закомментированного кода (строки 29-31, 62-181)
   - Это нарушает принцип чистоты кода

### 🟡 Средние проблемы

6. **Непоследовательность в экспорте**
   - Большинство используют `export default`
   - `CompanyDto` и `UserDto` используют `export class`
   - `ProductDto` объявлен как `class`, экспортируется в конце

7. **Отсутствие методов toApi()**
   - Только `OrderTransactionDto`, `OrderTempProductDto` и `ProjectContractDto` имеют метод `toApi()`
   - Остальные DTO не могут быть легко преобразованы обратно в API формат

8. **Непоследовательность в обработке вложенных объектов**
   - Некоторые DTO создают вложенные DTO (ClientDto создает ClientEmailDto, ClientPhoneDto)
   - Другие просто сохраняют объекты как есть
   - Нет единого подхода

9. **Дублирование свойств для совместимости**
   - `ClientBalanceHistoryDto` имеет `userName` и `user_name` (строка 13)
   - Это указывает на проблемы с миграцией

10. **Отсутствие валидации данных**
    - Нет проверки обязательных полей
    - Нет проверки типов данных
    - Нет обработки некорректных данных

### 🟢 Мелкие проблемы

11. **Разные стили форматирования**
    - Некоторые методы используют стрелочные функции
    - Другие используют обычные функции
    - Нет единого стиля

12. **Отсутствие JSDoc комментариев**
    - Нет документации для методов
    - Нет описания параметров
    - Нет примеров использования

13. **Непоследовательность в обработке null/undefined**
    - Некоторые DTO используют `??` оператор
    - Другие используют `||`
    - Нет единого подхода

14. **Разные подходы к значениям по умолчанию**
    - Некоторые используют параметры по умолчанию в конструкторе
    - Другие используют тернарные операторы
    - Нет единого стандарта

---

## Рекомендации

### Приоритет 1: Критические исправления

1. **Унифицировать стиль конструкторов**
   - Рекомендуется использовать объект в конструкторе для всех DTO
   - Это упростит поддержку и сделает код более читаемым
   - Пример:
   ```javascript
   constructor(data) {
     this.id = data.id;
     this.name = data.name;
     // ...
   }
   ```

2. **Добавить статические методы создания**
   - Все DTO должны иметь `fromApiArray(dataArray)`
   - Унифицировать использование `fromApiArray` вместо `fromApi`
   - Добавить `fromApi(data)` для создания одного экземпляра

3. **Удалить закомментированный код**
   - Удалить закомментированный код из `OrderDto`
   - Если функциональность нужна, восстановить её или удалить полностью

4. **Унифицировать экспорт**
   - Использовать `export default` для всех DTO
   - Это соответствует текущему стилю проекта

### Приоритет 2: Улучшения архитектуры

5. **Создать базовый класс BaseDto**
   - Вынести общие методы форматирования дат
   - Вынести общую логику преобразования
   - Пример:
   ```javascript
   class BaseDto {
     formatDate(date) {
       return dtoDateFormatters.formatDate(date);
     }
     
     formatCreatedAt() {
       return dtoDateFormatters.formatCreatedAt(this.createdAt);
     }
     
     formatUpdatedAt() {
       return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
     }
   }
   ```

6. **Добавить методы toApi()**
   - Все DTO должны иметь метод `toApi()` для преобразования обратно в API формат
   - Это упростит отправку данных на сервер

7. **Унифицировать обработку вложенных объектов**
   - Создать единый подход к созданию вложенных DTO
   - Использовать фабричные методы для создания связанных DTO

8. **Добавить валидацию**
   - Добавить проверку обязательных полей
   - Добавить проверку типов данных
   - Выбрасывать понятные ошибки при некорректных данных

### Приоритет 3: Улучшения качества кода

9. **Добавить JSDoc комментарии**
   - Документировать все классы и методы
   - Описать параметры и возвращаемые значения
   - Добавить примеры использования

10. **Унифицировать обработку null/undefined**
    - Использовать оператор `??` для значений по умолчанию
    - Это более явно указывает на намерение использовать null/undefined

11. **Создать утилиты для общих операций**
    - Вынести дублирующуюся логику в утилиты
    - Создать функции для преобразования snake_case в camelCase
    - Создать функции для валидации данных

12. **Добавить TypeScript или JSDoc типы**
    - Добавить типизацию для лучшей поддержки IDE
    - Это улучшит автодополнение и обнаружение ошибок

---

## Детальный анализ по категориям

### app/

#### CurrencyDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует `createFromApiArray` утилиту
- ⚠️ Использует объект в конструкторе (непоследовательно)
- ⚠️ Нет методов форматирования

#### PaginatedResponseDto.js
- ❌ Нет статического метода `fromApiArray`
- ✅ Простая структура
- ⚠️ Нет методов форматирования

#### UnitDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует `createFromApiArray` утилиту
- ⚠️ Нет методов форматирования

### cash_register/

#### CashRegisterDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ✅ Использует утилиты для работы с пользователями
- ⚠️ Использует отдельные параметры в конструкторе

#### CashRegisterBalanceDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (CashRegisterBalanceItemDto)
- ⚠️ Нет методов форматирования

#### CashRegisterBalanceItemDto.js
- ✅ Использует `fromApiArray`
- ✅ Простая структура
- ⚠️ Нет методов форматирования

### client/

#### ClientDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientEmailDto, ClientPhoneDto)
- ✅ Имеет методы форматирования
- ✅ Использует утилиты
- ⚠️ Использует отдельные параметры в конструкторе (много параметров)

#### ClientEmailDto.js
- ❌ Нет статического метода `fromApiArray`
- ✅ Простая структура
- ⚠️ Нет методов форматирования

#### ClientPhoneDto.js
- ❌ Нет статического метода `fromApiArray`
- ✅ Простая структура
- ⚠️ Нет методов форматирования

#### ClientSearchDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ✅ Обрабатывает разные форматы данных (строки и объекты)
- ⚠️ Использует отдельные параметры в конструкторе

#### ClientBalanceHistoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ❌ Дублирование свойств (`userName` и `user_name`)
- ⚠️ Использует отдельные параметры в конструкторе

### companies/

#### CompanyDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует объект в конструкторе
- ✅ Имеет нормализацию данных (normalizeNumber, normalizeBoolean)
- ✅ Имеет метод `logoUrl()`
- ⚠️ Использует `export class` вместо `export default`

### currency/

#### CurrencyHistoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (isActive, getDuration)
- ⚠️ Использует отдельные параметры в конструкторе

### invoice/

#### InvoiceDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto, OrderDto, InvoiceProductDto)
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (getStatusLabel, getStatusClass)
- ⚠️ Использует отдельные параметры в конструкторе
- ⚠️ Сложная логика в `amountInfo()` с проверкой валюты

#### InvoiceProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ⚠️ Использует отдельные параметры в конструкторе

### order/

#### OrderDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto, OrderProductDto)
- ✅ Имеет методы форматирования
- ❌ Большой блок закомментированного кода (строки 29-31, 62-181)
- ⚠️ Использует отдельные параметры в конструкторе

#### OrderCategoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ⚠️ Использует отдельные параметры в конструкторе

#### OrderProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `imgUrl()`
- ⚠️ Использует отдельные параметры в конструкторе

#### OrderStatusDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (OrderStatusCategoryDto)
- ✅ Имеет методы форматирования
- ✅ Использует геттер `categoryName`
- ⚠️ Использует отдельные параметры в конструкторе

#### OrderStatusCategoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ⚠️ Использует отдельные параметры в конструкторе

#### OrderTempProductDto.js
- ✅ Использует объект в конструкторе
- ✅ Имеет методы форматирования
- ✅ Имеет методы `toApi()`, `clone()`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `icons()`
- ⚠️ Нет статического метода `fromApiArray`

#### OrderTransactionDto.js
- ❌ Использует `fromApi` вместо `fromApiArray`
- ✅ Имеет метод `toApi()`
- ⚠️ Использует отдельные параметры в конструкторе

### product/

#### ProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует объект в конструкторе
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (getPrimaryCategory, hasCategory)
- ✅ Обрабатывает разные варианты названий полей для stock_quantity
- ⚠️ Класс объявлен без export, экспортируется в конце

#### ProductSearchDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует объект в конструкторе
- ✅ Имеет методы форматирования
- ✅ Обрабатывает разные варианты названий полей для stock_quantity
- ⚠️ Дублирует логику с ProductDto

### project/

#### ProjectDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto, CurrencyDto)
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (getBudgetInManat, getBudgetDisplay)
- ✅ Имеет методы для работы с файлами
- ✅ Использует JSDoc комментарии (`/** @type {ClientDto | null} */`)
- ⚠️ Использует отдельные параметры в конструкторе (много параметров)

#### ProjectBalanceHistoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ✅ Использует геттер `dateUser`
- ⚠️ Использует отдельные параметры в конструкторе

#### ProjectContractDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования
- ✅ Имеет метод `toApi()`
- ✅ Обрабатывает разные варианты названий полей
- ⚠️ Использует отдельные параметры в конструкторе

#### ProjectStatusDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ⚠️ Использует отдельные параметры в конструкторе

#### ProjectTransactionDto.js
- ❌ Использует `fromApi` вместо `fromApiArray`
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (getSource, getLabel)
- ⚠️ Использует отдельные параметры в конструкторе

### sale/

#### SaleDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto, SaleProductDto)
- ✅ Имеет методы форматирования
- ✅ Использует JSDoc комментарии
- ⚠️ Использует отдельные параметры в конструкторе (много параметров)

#### SaleProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `imgUrl()`
- ✅ Имеет метод `icons()`
- ⚠️ Использует отдельные параметры в конструкторе

### transaction/

#### TransactionDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto)
- ✅ Имеет методы форматирования
- ✅ Имеет метод `clone()`
- ✅ Использует JSDoc комментарии
- ⚠️ Использует отдельные параметры в конструкторе (много параметров)

#### TransactionCategoryDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует объект в конструкторе
- ✅ Имеет методы форматирования
- ✅ Использует эмодзи в методах (typeClass)

### transfer/

#### TransferDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ⚠️ Использует отдельные параметры в конструкторе (много параметров)

### users/

#### UserDto.js
- ✅ Использует `fromApiArray`
- ✅ Использует объект в конструкторе
- ✅ Имеет метод `photoUrl()`
- ✅ Обрабатывает массивы (permissions, roles, companies)
- ⚠️ Использует `export class` вместо `export default`

### warehouse/

#### WarehouseDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ✅ Использует утилиты для работы с пользователями
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseMovementDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (WarehouseMovementProductDto)
- ✅ Имеет методы форматирования дат
- ✅ Использует JSDoc комментарии
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseMovementProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `imgUrl()`
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseReceiptDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (ClientDto, WarehouseReceiptProductDto)
- ✅ Имеет методы форматирования
- ✅ Имеет бизнес-логику (paymentTypeDisplay)
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseReceiptProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `imgUrl()`
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseStockDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет методы форматирования дат
- ✅ Имеет метод `imgUrl()`
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseWriteoffDto.js
- ✅ Использует `fromApiArray`
- ✅ Создает вложенные DTO (WarehouseWriteoffProductDto)
- ✅ Имеет методы форматирования дат
- ✅ Использует JSDoc комментарии
- ⚠️ Использует отдельные параметры в конструкторе

#### WarehouseWriteoffProductDto.js
- ✅ Использует `fromApiArray`
- ✅ Имеет статический метод `fromProductDto`
- ✅ Имеет метод `imgUrl()`
- ⚠️ Использует отдельные параметры в конструкторе

---

## Статистика проблем

### По приоритетам

- **Критические:** 5 проблем
- **Средние:** 5 проблем
- **Мелкие:** 4 проблемы

### По типам

- **Архитектурные:** 8 проблем
- **Стилистические:** 4 проблемы
- **Функциональные:** 2 проблемы

---

## План действий

### Этап 1: Критические исправления (1-2 недели)

1. Добавить `fromApiArray` в ClientEmailDto, ClientPhoneDto, PaginatedResponseDto
2. Унифицировать использование `fromApiArray` (переименовать `fromApi` в `fromApiArray`)
3. Удалить закомментированный код из OrderDto
4. Унифицировать экспорт (все DTO должны использовать `export default`)

### Этап 2: Улучшения архитектуры (2-3 недели)

5. Создать базовый класс BaseDto
6. Унифицировать стиль конструкторов (перейти на объект в конструкторе)
7. Добавить методы `toApi()` во все DTO
8. Добавить валидацию данных

### Этап 3: Улучшения качества кода (1-2 недели)

9. Добавить JSDoc комментарии
10. Унифицировать обработку null/undefined
11. Вынести дублирующуюся логику в утилиты
12. Удалить дублирование свойств (userName/user_name)

---

## Заключение

DTO на фронтенде в целом хорошо структурированы и используют утилиты для общих операций. Однако есть несколько критических проблем, которые необходимо исправить:

1. Непоследовательность в стиле конструкторов
2. Отсутствие статических методов создания в некоторых DTO
3. Закомментированный код
4. Дублирование логики

Рекомендуется начать с критических исправлений, затем перейти к улучшениям архитектуры и качества кода.

---

**Автор отчета:** AI Assistant  
**Версия:** 1.0



