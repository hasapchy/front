/**
 * Форматирует число с разделителями пробелами для тысяч
 * @param {number|string} value - Число для форматирования
 * @param {number} decimals - Количество знаков после запятой (по умолчанию из настроек компании или 2)
 * @param {boolean} showDecimals - Показывать ли десятичные знаки (по умолчанию false)
 * @returns {string} - Отформатированное число
 * 
 * Примеры:
 * formatNumber(100000) => "100 000"
 * formatNumber(1234567.89) => "1 234 567.89"
 * formatNumber(1234567.89, 2, true) => "1 234 567.89"
 * formatNumber(1234567, 2, false) => "1 234 567"
 */
import { getStore } from '@/store/storeManager';

export function formatNumber(value, decimals = null, showDecimals = false) {
  // Если decimals не передан, пытаемся получить из store
  if (decimals === null || decimals === undefined) {
    try {
      const store = getStore && getStore();
      console.log('[formatNumber] Store:', store);
      console.log('[formatNumber] Store getters:', store?.getters);
      console.log('[formatNumber] roundingDecimals:', store?.getters?.roundingDecimals);
      console.log('[formatNumber] currentCompany:', store?.state?.currentCompany);
      console.log('[formatNumber] currentCompany rounding_decimals:', store?.state?.currentCompany?.rounding_decimals);
      
      if (store && store.getters && store.getters.roundingDecimals !== undefined) {
        const roundingDecimals = store.getters.roundingDecimals;
        console.log('[formatNumber] Got roundingDecimals from getter:', roundingDecimals);
        // Используем значение из store, если оно есть и валидно
        if (typeof roundingDecimals === 'number' && roundingDecimals >= 0 && roundingDecimals <= 5) {
          decimals = roundingDecimals;
          console.log('[formatNumber] Using decimals from store:', decimals);
        } else {
          decimals = 2;
          console.log('[formatNumber] roundingDecimals invalid, using default:', decimals);
        }
      } else {
        decimals = 2;
        console.log('[formatNumber] Store or getters not available, using default:', decimals);
      }
    } catch (error) {
      decimals = 2;
      console.log('[formatNumber] Error getting store, using default:', decimals, error);
    }
  } else {
    console.log('[formatNumber] Using provided decimals:', decimals);
  }
  
  console.log('[formatNumber] Final values - value:', value, 'decimals:', decimals, 'showDecimals:', showDecimals);
  // Проверяем на пустое значение
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  // Преобразуем в число
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Проверяем, является ли значение числом
  if (isNaN(num)) {
    return '0';
  }

  // Определяем, есть ли дробная часть
  const hasDecimals = num % 1 !== 0;
  console.log('[formatNumber] num:', num, 'hasDecimals:', hasDecimals);
  
  // Форматируем число
  let result;
  if (showDecimals || hasDecimals) {
    // Округляем до нужного количества знаков
    result = num.toFixed(decimals);
    console.log('[formatNumber] Using toFixed with decimals:', decimals, 'result:', result);
  } else {
    // Целое число без десятичных знаков
    result = Math.round(num).toString();
    console.log('[formatNumber] Using round, result:', result);
  }

  // Разделяем на целую и дробную части
  const parts = result.split('.');
  
  // Добавляем пробелы в целую часть (разделитель тысяч)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  const finalResult = parts.join('.');
  console.log('[formatNumber] Final result:', finalResult);
  
  // Объединяем обратно
  return finalResult;
}

/**
 * Форматирует сумму с символом валюты
 * @param {number|string} value - Сумма для форматирования
 * @param {string} currencySymbol - Символ валюты
 * @param {number} decimals - Количество знаков после запятой
 * @param {boolean} showDecimals - Показывать ли десятичные знаки
 * @returns {string} - Отформатированная сумма с валютой
 */
export function formatCurrency(value, currencySymbol = '', decimals = null, showDecimals = false) {
  const formattedNumber = formatNumber(value, decimals, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
}

/**
 * Парсит отформатированное число обратно в число
 * @param {string} formattedValue - Отформатированная строка
 * @returns {number} - Числовое значение
 */
export function parseFormattedNumber(formattedValue) {
  if (!formattedValue) return 0;
  
  // Убираем все пробелы
  const cleaned = formattedValue.toString().replace(/\s/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

/**
 * Форматирует количество (quantity) с 2 знаками после запятой
 * @param {number|string} value - Количество для форматирования
 * @returns {string} - Отформатированное количество
 * 
 * Примеры:
 * formatQuantity(10) => "10.00"
 * formatQuantity(10.5) => "10.50"
 * formatQuantity(10.567) => "10.57"
 */
export function formatQuantity(value) {
  // Проверяем на пустое значение
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }

  // Преобразуем в число
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Проверяем, является ли значение числом
  if (isNaN(num)) {
    return '0.00';
  }

  // Возвращаем число с 2 знаками после запятой
  return num.toFixed(2);
}

/**
 * Получает шаг (step) для input type="number" на основе количества знаков после запятой
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} - Значение step для атрибута input
 * 
 * Примеры:
 * getStepForDecimals(0) => "1"
 * getStepForDecimals(1) => "0.1"
 * getStepForDecimals(2) => "0.01"
 * getStepForDecimals(5) => "0.00001"
 */
export function getStepForDecimals(decimals) {
  if (decimals === 0) {
    return '1';
  }
  return `0.${'0'.repeat(decimals - 1)}1`;
}
