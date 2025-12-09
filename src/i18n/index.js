import { createI18n } from 'vue-i18n'
import tm from '../lang/tm'
import ru from '../lang/ru'
import en from '../lang/en'

const messages = {
  tm,
  ru,
  en
}

// Получаем язык из localStorage или используем русский по умолчанию
const locale = localStorage.getItem('locale') || 'ru'

export default createI18n({
  locale,
  fallbackLocale: 'ru',
  messages,
  legacy: false, // Для Vue 3
  globalInjection: true, // Автоматически внедрять $t в компоненты
  silentTranslationWarn: true, // Отключать предупреждения о недостающих переводах
  silentFallbackWarn: true // Отключать предупреждения о fallback
})
