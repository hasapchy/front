import { createI18n } from 'vue-i18n'
import tm from '../lang/tm'
import ru from '../lang/ru'
import en from '../lang/en'
import activityLogLocales from '../lang/activityLog'
import { apiErrorsRu, apiErrorsEn, apiErrorsTm } from '../lang/apiErrorsMessages'
import { displayRu, displayEn, displayTm } from '../lang/displayMessages'
import { fillFromBase } from './fillFromBase'

const messages = {
  tm: { ...fillFromBase(tm, ru), activity_log: activityLogLocales.tm, apiErrors: apiErrorsTm, display: displayTm },
  ru: { ...ru, activity_log: activityLogLocales.ru, apiErrors: apiErrorsRu, display: displayRu },
  en: { ...fillFromBase(en, ru), activity_log: activityLogLocales.en, apiErrors: apiErrorsEn, display: displayEn },
}

const locale = localStorage.getItem('locale') || 'ru'

const i18n = createI18n({
  locale,
  fallbackLocale: 'ru',
  messages,
  legacy: false,
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

const TRANSLATION_LOCALES = ['ru', 'en', 'tm']

export function applyTransactionCategoryTranslationOverrides(dictionaryItems = []) {
  const list = Array.isArray(dictionaryItems) ? dictionaryItems : []
  for (const localeCode of TRANSLATION_LOCALES) {
    const patch = {}
    for (const item of list) {
      const key = typeof item?.key === 'string' ? item.key : ''
      const value = item?.translations?.[localeCode]
      if (!key || typeof value !== 'string' || value.trim() === '') {
        continue
      }
      patch[key] = value
    }
    if (Object.keys(patch).length > 0) {
      i18n.global.mergeLocaleMessage(localeCode, patch)
    }
  }
}

export default i18n
