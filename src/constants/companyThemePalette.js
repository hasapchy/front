export const DEFAULT_COMPANY_THEME_COLORS = {
  colorBrand: '#043c6b',
  colorBrandHover: '#065a9e',
  colorSuccess: '#5CB85C',
  colorSuccessHover: '#4EA84E',
  colorDanger: '#EE4F47',
  colorDangerHover: '#D53935',
  colorInfo: '#337AB7',
  colorWarning: '#f0ad4e',
};

export const DEFAULT_COMPANY_THEME_TYPOGRAPHY = {
  fontFamilyUi: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSizeLabel: '12px',
  fontSizeControl: '12px',
  fontSizeTable: '12px',
  fontSizeSection: '11px',
  fontWeightLabel: '650',
};

export const COMPANY_THEME_FONT_FAMILY_OPTIONS = [
  {
    value: DEFAULT_COMPANY_THEME_TYPOGRAPHY.fontFamilyUi,
    labelKey: 'companyThemeFontSystem',
  },
  {
    value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    labelKey: 'companyThemeFontSegoeUi',
  },
  {
    value: 'Arial, Helvetica, sans-serif',
    labelKey: 'companyThemeFontArial',
  },
  {
    value: 'Tahoma, Geneva, Verdana, sans-serif',
    labelKey: 'companyThemeFontTahoma',
  },
  {
    value: 'Verdana, Geneva, sans-serif',
    labelKey: 'companyThemeFontVerdana',
  },
  {
    value: 'Georgia, "Times New Roman", Times, serif',
    labelKey: 'companyThemeFontGeorgia',
  },
  {
    value: '"Times New Roman", Times, serif',
    labelKey: 'companyThemeFontTimes',
  },
];

export const COMPANY_THEME_FONT_WEIGHT_OPTIONS = [
  { value: '400', labelKey: 'companyThemeFontWeight400' },
  { value: '500', labelKey: 'companyThemeFontWeight500' },
  { value: '600', labelKey: 'companyThemeFontWeight600' },
  { value: '650', labelKey: 'companyThemeFontWeight650' },
  { value: '700', labelKey: 'companyThemeFontWeight700' },
];

const FONT_SIZE_KEYS = ['fontSizeLabel', 'fontSizeControl', 'fontSizeTable', 'fontSizeSection'];

export const COMPANY_THEME_COLOR_FIELDS = [
  { key: 'colorBrand', labelKey: 'companyThemeColorBrand' },
  { key: 'colorBrandHover', labelKey: 'companyThemeColorBrandHover' },
  { key: 'colorSuccess', labelKey: 'companyThemeColorSuccess' },
  { key: 'colorSuccessHover', labelKey: 'companyThemeColorSuccessHover' },
  { key: 'colorDanger', labelKey: 'companyThemeColorDanger' },
  { key: 'colorDangerHover', labelKey: 'companyThemeColorDangerHover' },
  { key: 'colorInfo', labelKey: 'companyThemeColorInfo' },
  { key: 'colorWarning', labelKey: 'companyThemeColorWarning' },
];

export const COMPANY_THEME_TYPOGRAPHY_FIELDS = [
  { key: 'fontFamilyUi', labelKey: 'companyThemeFontFamilyUi', type: 'select' },
  { key: 'fontSizeLabel', labelKey: 'companyThemeFontSizeLabel', type: 'numberPx' },
  { key: 'fontSizeControl', labelKey: 'companyThemeFontSizeControl', type: 'numberPx' },
  { key: 'fontSizeTable', labelKey: 'companyThemeFontSizeTable', type: 'numberPx' },
  { key: 'fontSizeSection', labelKey: 'companyThemeFontSizeSection', type: 'numberPx' },
  { key: 'fontWeightLabel', labelKey: 'companyThemeFontWeightLabel', type: 'selectWeight' },
];

const API_KEYS = {
  colorBrand: 'color_brand',
  colorBrandHover: 'color_brand_hover',
  colorSuccess: 'color_success',
  colorSuccessHover: 'color_success_hover',
  colorDanger: 'color_danger',
  colorDangerHover: 'color_danger_hover',
  colorInfo: 'color_info',
  colorWarning: 'color_warning',
  fontFamilyUi: 'font_family_ui',
  fontSizeLabel: 'font_size_label',
  fontSizeControl: 'font_size_control',
  fontSizeTable: 'font_size_table',
  fontSizeSection: 'font_size_section',
  fontWeightLabel: 'font_weight_label',
};

/**
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
export function fontSizePxToNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)px$/i);
  if (match) {
    return Number(match[1]);
  }
  const num = Number(trimmed.replace(/px$/i, ''));
  return Number.isFinite(num) ? num : null;
}

/**
 * @param {string|number|null|undefined} value
 * @returns {string|null}
 */
export function fontSizeNumberToPx(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return null;
  }
  return `${num}px`;
}

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function resolveFontFamilyUi(value) {
  const trimmed = value != null ? String(value).trim() : '';
  if (!trimmed) {
    return DEFAULT_COMPANY_THEME_TYPOGRAPHY.fontFamilyUi;
  }
  const found = COMPANY_THEME_FONT_FAMILY_OPTIONS.some((option) => option.value === trimmed);
  return found ? trimmed : DEFAULT_COMPANY_THEME_TYPOGRAPHY.fontFamilyUi;
}

/**
 * @param {Record<string, string>|null|undefined} uiTheme
 * @returns {Record<string, number>}
 */
export function syncUiThemeFontSizes(uiTheme) {
  const theme = companyThemeFormFromApi(uiTheme);
  const sizes = {};
  for (const key of FONT_SIZE_KEYS) {
    const parsed = fontSizePxToNumber(theme[key]);
    sizes[key] = parsed ?? fontSizePxToNumber(DEFAULT_COMPANY_THEME_TYPOGRAPHY[key]) ?? 12;
  }
  return sizes;
}

/**
 * @param {Record<string, string>} uiTheme
 * @param {Record<string, number>} fontSizes
 * @returns {Record<string, string>}
 */
export function mergeUiThemeFromFontSizes(uiTheme, fontSizes) {
  const result = { ...uiTheme };
  for (const key of FONT_SIZE_KEYS) {
    const px = fontSizeNumberToPx(fontSizes?.[key]);
    if (px) {
      result[key] = px;
    }
  }
  return result;
}

/**
 * @param {Record<string, string>|null|undefined} raw
 * @returns {Record<string, string>}
 */
export function companyThemeFormFromApi(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = {};
  for (const field of COMPANY_THEME_COLOR_FIELDS) {
    const apiKey = API_KEYS[field.key];
    const value = source[field.key] ?? source[apiKey];
    result[field.key] = value && String(value).trim() !== ''
      ? String(value).trim()
      : DEFAULT_COMPANY_THEME_COLORS[field.key];
  }
  for (const field of COMPANY_THEME_TYPOGRAPHY_FIELDS) {
    const apiKey = API_KEYS[field.key];
    const value = source[field.key] ?? source[apiKey];
    if (field.key === 'fontFamilyUi') {
      result[field.key] = resolveFontFamilyUi(value && String(value).trim() !== '' ? String(value).trim() : '');
      continue;
    }
    result[field.key] = value && String(value).trim() !== ''
      ? String(value).trim()
      : DEFAULT_COMPANY_THEME_TYPOGRAPHY[field.key];
  }
  return result;
}

/**
 * @param {Record<string, string>|null|undefined} uiTheme
 * @returns {Record<string, string>|null}
 */
export function companyThemeForApiSave(uiTheme) {
  const merged = companyThemeFormFromApi(uiTheme);
  const payload = {};

  for (const field of COMPANY_THEME_COLOR_FIELDS) {
    const value = merged[field.key];
    if (value && value !== DEFAULT_COMPANY_THEME_COLORS[field.key]) {
      payload[field.key] = value;
    }
  }
  for (const field of COMPANY_THEME_TYPOGRAPHY_FIELDS) {
    const value = merged[field.key];
    if (value && value !== DEFAULT_COMPANY_THEME_TYPOGRAPHY[field.key]) {
      payload[field.key] = value;
    }
  }

  return Object.keys(payload).length > 0 ? payload : null;
}
