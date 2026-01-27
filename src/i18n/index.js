import { createI18n } from 'vue-i18n'
import tm from '../lang/tm'
import ru from '../lang/ru'
import en from '../lang/en'

const messages = {
  tm,
  ru,
  en
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
