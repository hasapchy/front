/**
 * @param {string} key
 * @param {string} label
 * @param {string} value
 * @returns {{ key: string, label: string, value: string }}
 */
export function buildFilterChip(key, label, value) {
  return {
    key,
    label,
    value: String(value),
  };
}

/**
 * @param {import('vue').ComponentPublicInstance['$t']} t
 * @param {string} dateFilter
 * @param {string|null} startDate
 * @param {string|null} endDate
 * @returns {{ key: string, label: string, value: string }|null}
 */
export function buildDateFilterChip(t, dateFilter, startDate, endDate) {
  const summary = formatDateFilterSummary(t, dateFilter, startDate, endDate);
  if (!summary) {
    return null;
  }
  const value = summary.includes(': ') ? summary.split(': ').slice(1).join(': ') : summary;
  return buildFilterChip('dateFilter', t('period'), value);
}

const DATE_FILTER_I18N_KEYS = {
  today: 'today',
  yesterday: 'yesterday',
  this_week: 'thisWeek',
  this_month: 'thisMonth',
  last_week: 'lastWeek',
  last_month: 'lastMonth',
  custom: 'selectDates',
  all_time: 'allTime',
};

/**
 * @param {import('vue').ComponentPublicInstance['$t']} t
 * @param {string} dateFilter
 * @param {string|null} startDate
 * @param {string|null} endDate
 * @returns {string|null}
 */
export function formatDateFilterSummary(t, dateFilter, startDate, endDate) {
  if (!dateFilter || dateFilter === 'all_time') {
    return null;
  }
  if (dateFilter === 'custom') {
    if (!startDate && !endDate) {
      return null;
    }
    const range = [startDate, endDate].filter(Boolean).join(' — ');
    return `${t('period')}: ${range}`;
  }
  const key = DATE_FILTER_I18N_KEYS[dateFilter];
  return key ? `${t('period')}: ${t(key)}` : null;
}
