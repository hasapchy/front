/**
 * Утилита для построения параметров фильтрации по датам
 */

/**
 * Построить параметры фильтрации по датам
 * @param {string} dateFilter - Тип фильтра ('all_time', 'today', 'week', 'month', 'year', 'custom')
 * @param {string|null} [startDate=null] - Начальная дата (для custom фильтра)
 * @param {string|null} [endDate=null] - Конечная дата (для custom фильтра)
 * @param {string} [paramPrefix='date'] - Префикс для параметров (date_filter_type, start_date, end_date)
 * @returns {Object} Объект с параметрами фильтрации
 */
export function buildDateFilterParams(dateFilter, startDate = null, endDate = null, paramPrefix = 'date') {
  const params = {};

  if (dateFilter && dateFilter !== 'all_time') {
    params[`${paramPrefix}_filter_type`] = dateFilter;

    if (dateFilter === 'custom' && startDate && endDate) {
      params[`start_${paramPrefix}`] = startDate;
      params[`end_${paramPrefix}`] = endDate;
    }
  }

  return params;
}

