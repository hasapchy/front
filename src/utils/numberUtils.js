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
  // Если decimals не передан, пытаемся получить из настроек компании для отображения
  // ВАЖНО: formatNumber только форматирует для отображения, не изменяет реальное значение
  // Реальное округление применяется только через roundValue() при сохранении новых записей
  
  if (decimals === null || decimals === undefined) {
    try {
      const store = getStore && getStore();
      if (store && store.getters) {
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

  // Преобразуем в число (без реального округления!)
  let num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Проверяем, является ли значение числом
  if (isNaN(num)) {
    return '0';
  }

  // ТОЛЬКО форматирование для отображения, БЕЗ округления
  // decimals из настроек используется только для ограничения количества знаков при отображении
  // Реальное округление применяется только через roundValue() при сохранении новых записей
  
  // Всегда обрезаем без округления (для отображения старых значений)
  // Округление применяется только при сохранении через roundValue()
  const numStr = num.toString();
  const decimalIndex = numStr.indexOf('.');
  
  let result;
  if (decimalIndex !== -1) {
    // Есть дробная часть
    const integerPart = numStr.substring(0, decimalIndex);
    let decimalPart = numStr.substring(decimalIndex + 1);
    
    // Ограничиваем количество знаков после запятой (без округления, просто отсекаем лишнее)
    if (decimals >= 0) {
      decimalPart = decimalPart.substring(0, decimals);
    }
    
    // Если decimals=0, всегда не показываем дробную часть (независимо от showDecimals)
    if (decimals === 0) {
      result = integerPart;
    } else if (showDecimals && decimals > 0) {
      // Если showDecimals=true и decimals>0, всегда показываем decimals знаков после запятой (добавляем нули если нужно)
      while (decimalPart.length < decimals) {
        decimalPart += '0';
      }
      result = `${integerPart}.${decimalPart}`;
    } else {
      // Если showDecimals=false, показываем только если есть значащие цифры
      if (decimalPart.match(/^0+$/)) {
        result = integerPart;
      } else if (decimalPart.length > 0) {
        result = `${integerPart}.${decimalPart}`;
      } else {
        result = integerPart;
      }
    }
  } else {
    // Нет дробной части
    // Если decimals=0, никогда не добавляем .00
    if (decimals === 0) {
      result = numStr;
    } else if (showDecimals && decimals > 0) {
      // Если showDecimals=true и decimals>0, добавляем .00
      result = `${numStr}.${'0'.repeat(decimals)}`;
    } else {
      result = numStr;
    }
  }

  // Разделяем на целую и дробную части
  const parts = result.split('.');
  
  // Обрабатываем отрицательные числа
  const isNegative = parts[0].startsWith('-');
  if (isNegative) {
    parts[0] = parts[0].substring(1);
  }

  // Добавляем пробелы в целую часть (разделитель тысяч)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Возвращаем знак минуса, если был
  if (isNegative) {
    parts[0] = '-' + parts[0];
  }

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
 * Внутренняя функция для округления с настройками из store
 */
function roundWithSettings(value, getters, decimalsKey, enabledKey, directionKey, thresholdKey, defaultDecimals = 2) {
  // Получаем настройки из store
  let roundingEnabled = true;
  let direction = 'standard';
  let threshold = 0.5;
  let decimals = defaultDecimals;
  
  try {
    const store = getStore && getStore();
    if (store && store.getters) {
      const roundingDecimals = store.getters[decimalsKey];
      decimals = (typeof roundingDecimals === 'number' && roundingDecimals >= 0 && roundingDecimals <= 5) 
        ? roundingDecimals 
        : defaultDecimals;
      
      roundingEnabled = store.getters[enabledKey] ?? true;
      direction = store.getters[directionKey] || 'standard';
      threshold = store.getters[thresholdKey] ?? 0.5;
      
      // Используем настройки из store
    }
  } catch (error) {
    // Используем значения по умолчанию
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
      num = Math.ceil(num * factor) / factor;
    } else if (direction === 'down') {
      num = Math.floor(num * factor) / factor;
    } else if (direction === 'custom') {
      const floored = Math.floor(num * factor) / factor;
      const frac = num - floored;
      
      if (frac >= threshold) {
        num = Math.ceil(num * factor) / factor;
      } else {
        num = floored;
      }
    } else {
      num = Math.round(num * factor) / factor;
    }
  }
  
  return num;
}

/**
 * Реально округляет число для сумм в зависимости от настроек компании
 * @param {number|string} value - Число для округления
 * @returns {number} - Округленное число
 */
export function roundValue(value) {
  return roundWithSettings(
    value,
    null,
    'roundingDecimals',
    'roundingEnabled',
    'roundingDirection',
    'roundingCustomThreshold',
    2
  );
}

/**
 * Реально округляет число для количества товара в зависимости от настроек компании
 * @param {number|string} value - Число для округления
 * @returns {number} - Округленное число
 */
export function roundQuantityValue(value) {
  return roundWithSettings(
    value,
    null,
    'roundingQuantityDecimals',
    'roundingQuantityEnabled',
    'roundingQuantityDirection',
    'roundingQuantityCustomThreshold',
    2
  );
}

/**
 * Форматирует число для отображения с учетом настроек округления компании
 * НЕ округляет значения, только обрезает до нужного количества знаков после запятой
 * Округление применяется только при сохранении через roundValue()
 * @param {number|string} value - Число для форматирования
 * @param {boolean} showDecimals - Показывать ли десятичные знаки
 * @returns {string} - Отформатированное число
 */
export function formatNumberWithRounding(value, showDecimals = false) {
  try {
    const store = getStore && getStore();
    if (store && store.getters) {
      const roundingDecimals = store.getters.roundingDecimals;
      
      // Просто форматируем с обрезкой до нужного количества знаков (без округления)
      return formatNumber(value, roundingDecimals, showDecimals);
    }
  } catch (error) {
    // Если ошибка, используем обычное форматирование
  }
  
  return formatNumber(value, null, showDecimals);
}

/**
 * Форматирует сумму с символом валюты с применением реального округления для отображения
 * @param {number|string} value - Сумма для форматирования
 * @param {string} currencySymbol - Символ валюты
 * @param {boolean} showDecimals - Показывать ли десятичные знаки
 * @returns {string} - Отформатированная сумма с валютой
 */
export function formatCurrencyWithRounding(value, currencySymbol = '', showDecimals = false) {
  const formattedNumber = formatNumberWithRounding(value, showDecimals);
  return currencySymbol ? `${formattedNumber} ${currencySymbol}` : formattedNumber;
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