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
  let roundingEnabled = true;
  let roundingDirection = 'standard';
  let customThreshold = 0.5;
  
  if (decimals === null || decimals === undefined) {
    try {
      const store = getStore && getStore();
      if (store && store.getters) {
        roundingEnabled = store.getters.roundingEnabled ?? true;
        roundingDirection = store.getters.roundingDirection || 'standard';
        customThreshold = store.getters.roundingCustomThreshold ?? 0.5;
        
        const roundingDecimals = store.getters.roundingDecimals;
        if (typeof roundingDecimals === 'number' && roundingDecimals >= 0 && roundingDecimals <= 5) {
          decimals = roundingDecimals;
        } else {
          decimals = 2;
        }
      } else {
        decimals = 2;
      }
    } catch {
      decimals = 2;
    }
  }
  
  // Проверяем на пустое значение
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  // Преобразуем в число
  let num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Проверяем, является ли значение числом
  if (isNaN(num)) {
    return '0';
  }

  // Реальное округление в зависимости от настроек (влияет на логику, не только визуально)
  if (roundingEnabled && decimals >= 0) {
    const factor = Math.pow(10, decimals);
    
    if (roundingDirection === 'up') {
      // Всегда округляем вверх (в большую сторону)
      num = Math.ceil(num * factor) / factor;
    } else if (roundingDirection === 'down') {
      // Всегда округляем вниз (в меньшую сторону)
      num = Math.floor(num * factor) / factor;
    } else if (roundingDirection === 'custom') {
      // Округление с порогом
      const floored = Math.floor(num * factor) / factor;
      const frac = num - floored; // дробная часть на уровне decimals
      
      if (frac >= customThreshold) {
        num = Math.ceil(num * factor) / factor;
      } else {
        num = floored;
      }
    } else {
      // Стандартное округление (round)
      num = Math.round(num * factor) / factor;
    }
  }

  // Определяем, есть ли дробная часть
  const hasDecimals = num % 1 !== 0;
  
  // Форматируем число для отображения
  let result;
  if (showDecimals || hasDecimals) {
    result = num.toFixed(decimals);
  } else {
    result = Math.round(num).toString();
  }

  // Разделяем на целую и дробную части
  const parts = result.split('.');

  // Добавляем пробелы в целую часть (разделитель тысяч)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return parts.join('.');
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
 * Округление с порогом: если дробная часть (на уровне decimals) >= threshold, округляем вверх,
 * иначе используем выбранную стратегию (по умолчанию вниз до шага decimals).
 * Пример: decimals=1, threshold=0.6 → 2.59 → 2.5, 2.60 → 2.6
 */
export function roundWithThreshold(value, decimals = 2, threshold = 0.5, fallback = 'down') {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  if (!decimals || decimals < 0) return Math.round(num);

  const factor = Math.pow(10, decimals);
  const floored = Math.floor(num * factor) / factor;
  const frac = num - floored; // дробная часть на уровне decimals

  if (frac >= threshold) {
    return Math.ceil(num * factor) / factor;
  }

  if (fallback === 'half-up') {
    return Number(num.toFixed(decimals));
  }
  // По умолчанию: вниз до ближайшего шага
  return floored;
}

/**
 * Форматирует число с учётом порога округления
 */
export function formatNumberWithThreshold(value, decimals = null, showDecimals = false, threshold = null, fallback = 'down') {
  // Подхватываем decimals из настроек компании, если не передан
  if (decimals === null || decimals === undefined) {
    try {
      const store = getStore && getStore();
      if (store && store.getters && store.getters.roundingDecimals !== undefined) {
        const roundingDecimals = store.getters.roundingDecimals;
        if (typeof roundingDecimals === 'number' && roundingDecimals >= 0 && roundingDecimals <= 5) {
          decimals = roundingDecimals;
        } else {
          decimals = 2;
        }
      } else {
        decimals = 2;
      }
    } catch {
      decimals = 2;
    }
  }

  let rounded = Number(value);
  if (threshold !== null && threshold !== undefined && decimals > 0) {
    rounded = roundWithThreshold(value, decimals, threshold, fallback);
  } else {
    // Без порога — обычная логика formatNumber
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    const hasDecimals = num % 1 !== 0;
    rounded = (showDecimals || hasDecimals) ? Number(num.toFixed(decimals)) : Math.round(num);
  }

  const result = showDecimals ? rounded.toFixed(decimals) : String(rounded);
  const parts = result.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

/**
 * Форматирует сумму с символом валюты с учётом порога округления
 */
export function formatCurrencyWithThreshold(value, currencySymbol = '', decimals = null, showDecimals = false, threshold = null, fallback = 'down') {
  const formattedNumber = formatNumberWithThreshold(value, decimals, showDecimals, threshold, fallback);
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
 * Реально округляет число в зависимости от настроек компании (для логики, не визуально)
 * @param {number|string} value - Число для округления
 * @param {number} decimals - Количество знаков после запятой (если null, берется из настроек компании)
 * @returns {number} - Округленное число
 * 
 * Примеры:
 * roundValue(1.1, 0, 'up') => 2 (всегда вверх до целого)
 * roundValue(1.99, 0, 'down') => 1 (всегда вниз до целого)
 * roundValue(2.59, 1, 'custom', 0.6) => 2.5 (порог 0.6)
 * roundValue(2.60, 1, 'custom', 0.6) => 2.6 (порог 0.6)
 */
export function roundValue(value, decimals = null, roundingDirection = null, customThreshold = null) {
  // Получаем настройки из store, если не переданы явно
  let roundingEnabled = true;
  let direction = 'standard';
  let threshold = 0.5;
  
  if (decimals === null || roundingDirection === null) {
    try {
      const store = getStore && getStore();
      if (store && store.getters) {
        if (decimals === null) {
          const roundingDecimals = store.getters.roundingDecimals;
          decimals = (typeof roundingDecimals === 'number' && roundingDecimals >= 0 && roundingDecimals <= 5) 
            ? roundingDecimals 
            : 2;
        }
        
        if (roundingDirection === null) {
          roundingEnabled = store.getters.roundingEnabled ?? true;
          direction = store.getters.roundingDirection || 'standard';
          threshold = store.getters.roundingCustomThreshold ?? 0.5;
        }
      } else {
        if (decimals === null) decimals = 2;
        if (roundingDirection === null) {
          direction = 'standard';
        }
      }
    } catch {
      if (decimals === null) decimals = 2;
      if (roundingDirection === null) {
        direction = 'standard';
      }
    }
  } else {
    direction = roundingDirection;
    if (customThreshold !== null) {
      threshold = customThreshold;
    }
  }
  
  // Преобразуем в число
  let num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  
  // Если округление отключено, возвращаем как есть (без округления)
  if (!roundingEnabled) {
    return num;
  }
  
  // Применяем реальное округление
  if (decimals >= 0) {
    const factor = Math.pow(10, decimals);
    
    if (direction === 'up') {
      // Всегда округляем вверх (в большую сторону): 1.1 => 2 (при decimals=0)
      num = Math.ceil(num * factor) / factor;
    } else if (direction === 'down') {
      // Всегда округляем вниз (в меньшую сторону): 1.99 => 1 (при decimals=0)
      num = Math.floor(num * factor) / factor;
    } else if (direction === 'custom') {
      // Округление с порогом
      const floored = Math.floor(num * factor) / factor;
      const frac = num - floored; // дробная часть на уровне decimals
      
      if (frac >= threshold) {
        num = Math.ceil(num * factor) / factor;
      } else {
        num = floored;
      }
    } else {
      // Стандартное округление (round)
      num = Math.round(num * factor) / factor;
    }
  }
  
  return num;
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
