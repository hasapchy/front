import { formatQuantity } from './numberUtils';

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
    'product_id': 'Товар',
    // 'order_category_id': 'Категория заказа',
    'order_status_id': 'Статус заказа',
    'project_id': 'Проект',
    'cash_register_id': 'Касса',
    'amount': 'Сумма',
    'name': 'Название',
    'title': 'Заголовок',
    'body': 'Текст',
    'created_at': 'Дата создания',
    'updated_at': 'Дата обновления',
    'currency_id': 'Валюта',
    'transaction_category_id': 'Категория транзакции',
    'type': 'Тип',
    'orig_amount': 'Исходная сумма'
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
    
    // Для количества добавляем форматирование с 2 знаками после запятой
    if (fieldName === 'quantity') {
        return formatQuantity(value);
    }
    
    // Для цен добавляем форматирование без валюты
    if (fieldName === 'total_price' || fieldName === 'price' || fieldName === 'discount' || fieldName === 'amount' || fieldName === 'orig_amount') {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    // Для дат
    if (fieldName === 'date') {
        return new Date(value).toLocaleDateString('ru-RU');
    }

    // Для типа транзакции
    if (fieldName === 'type') {
        return value === 1 ? 'Расход' : 'Доход';
    }
    
    // Для ID полей возвращаем как есть (названия будут загружены с сервера)
    if (fieldName.endsWith('_id')) {
        return value;
    }
    
    return value;
} 