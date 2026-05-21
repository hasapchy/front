import { ICON_OPTIONS as CASH_ICON_OPTIONS } from '@/constants/cashIconOptions';
import { HOLIDAY_ICON_OPTIONS } from '@/constants/holidayIconOptions';

export const ICON_FORM_PRESETS = {
  cashRegister: CASH_ICON_OPTIONS,
  transactionTemplate: CASH_ICON_OPTIONS,
  companyHoliday: HOLIDAY_ICON_OPTIONS,
};

/**
 * @param {keyof typeof ICON_FORM_PRESETS} preset
 * @returns {Array<{ value: string, label: string }>}
 */
export function getIconOptionsForPreset(preset) {
  return ICON_FORM_PRESETS[preset] || [];
}

export default ICON_FORM_PRESETS;
