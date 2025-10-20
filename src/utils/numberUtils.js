/**
 * Форматирует число с разделителями пробелами для тысяч
 * @param {number|string} value - Число для форматирования
 * @param {number} decimals - Количество знаков после запятой (по умолчанию 2)
 * @param {boolean} showDecimals - Показывать ли десятичные знаки (по умолчанию false)
 * @returns {string} - Отформатированное число
 * 
 * Примеры:
 * formatNumber(100000) => "100 000"
 * formatNumber(1234567.89) => "1 234 567.89"
 * formatNumber(1234567.89, 2, true) => "1 234 567.89"
 * formatNumber(1234567, 2, false) => "1 234 567"
 */
export function formatNumber(value, decimals = 2, showDecimals = false) {
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
  
  // Форматируем число
  let result;
  if (showDecimals || hasDecimals) {
    // Округляем до нужного количества знаков
    result = num.toFixed(decimals);
  } else {
    // Целое число без десятичных знаков
    result = Math.round(num).toString();
  }

  // Разделяем на целую и дробную части
  const parts = result.split('.');
  
  // Добавляем пробелы в целую часть (разделитель тысяч)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Объединяем обратно
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
export function formatCurrency(value, currencySymbol = '', decimals = 2, showDecimals = false) {
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

