// Переводы полей для таймлайна
export const fieldTranslations = {
    'date': 'Дата',
    'note': 'Комментарий',
    'description': 'Описание',
    'total_price': 'Общая сумма',
    'discount': 'Скидка',
    'status_id': 'Статус',
    'category_id': 'Категория',
    'client_id': 'Клиент',
    'warehouse_id': 'Склад',
    'cash_id': 'Касса',
    'user_id': 'Пользователь',
    'price': 'Цена',
    'quantity': 'Количество',
    'product_id': 'Товар'
};

// Функция для перевода названий полей
export function translateField(fieldName) {
    return fieldTranslations[fieldName] || fieldName;
}

// Функция для форматирования значений полей
export function formatFieldValue(fieldName, value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    
    // Для цен добавляем форматирование без валюты
    if (fieldName === 'total_price' || fieldName === 'price' || fieldName === 'discount') {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    // Для дат
    if (fieldName === 'date') {
        return new Date(value).toLocaleDateString('ru-RU');
    }
    
    // Для ID полей возвращаем как есть (названия будут загружены с сервера)
    if (fieldName.endsWith('_id')) {
        return value;
    }
    
    return value;
} 