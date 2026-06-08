export const COMPANY_THEME_KEYS = [
    'colorBrand',
    'colorBrandHover',
    'colorSuccess',
    'colorSuccessHover',
    'colorDanger',
    'colorDangerHover',
    'colorInfo',
    'colorWarning',
    'fontFamilyUi',
    'fontSizeLabel',
    'fontSizeControl',
    'fontSizeTable',
    'fontSizeSection',
    'fontWeightLabel',
];

const CSS_VAR_MAP = {
    colorBrand: '--color-brand',
    colorBrandHover: '--color-brand-hover',
    colorSuccess: '--color-success',
    colorSuccessHover: '--color-success-hover',
    colorDanger: '--color-danger',
    colorDangerHover: '--color-danger-hover',
    colorInfo: '--color-info',
    colorWarning: '--color-warning',
    fontFamilyUi: '--font-family-ui',
    fontSizeLabel: '--font-size-label',
    fontSizeControl: '--font-size-control',
    fontSizeTable: '--font-size-table',
    fontSizeSection: '--font-size-section',
    fontWeightLabel: '--font-weight-label',
};

/**
 * @param {Record<string, string|number|undefined|null>} theme
 */
export function applyCompanyTheme(theme = {}) {
    const root = document.documentElement;
    for (const key of COMPANY_THEME_KEYS) {
        const cssVar = CSS_VAR_MAP[key];
        const value = theme?.[key];
        if (value != null && String(value).trim() !== '') {
            root.style.setProperty(cssVar, String(value).trim());
        } else {
            root.style.removeProperty(cssVar);
        }
    }
}

export function resetCompanyTheme() {
    applyCompanyTheme({});
}
