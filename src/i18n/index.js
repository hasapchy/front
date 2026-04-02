import { createI18n } from 'vue-i18n'
import tm from '../lang/tm'
import ru from '../lang/ru'
import en from '../lang/en'
import { apiErrorsRu, apiErrorsEn, apiErrorsTm } from '../lang/apiErrorsMessages'
import { displayRu, displayEn, displayTm } from '../lang/displayMessages'

const messages = {
  tm: { ...tm, apiErrors: apiErrorsTm, display: displayTm },
  ru: { ...ru, apiErrors: apiErrorsRu, display: displayRu },
  en: { ...en, apiErrors: apiErrorsEn, display: displayEn },
}

const locale = localStorage.getItem('locale') || 'ru'

export default createI18n({
  locale,
  fallbackLocale: 'ru',
  messages,
  legacy: false,
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true
})
