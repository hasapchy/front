<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div class="mb-3 text-sm opacity-80">
        {{ $t('languageLabel') }}: RU / EN / TM
      </div>
      <div v-if="loading" class="py-8 text-center opacity-70">
        {{ $t('loading') }}
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="row in rows"
          :key="row.key"
          class="rounded-md border border-[var(--border-primary)] p-3"
        >
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="font-semibold">{{ row.baseLabel }}</span>
            <span class="text-xs opacity-70">{{ row.key }}</span>
          </div>
          <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input v-model="row.translations.ru" type="text" placeholder="RU" />
            <input v-model="row.translations.en" type="text" placeholder="EN" />
            <input v-model="row.translations.tm" type="text" placeholder="TM" />
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-[var(--border-primary)] p-3">
      <div class="flex items-center gap-2">
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" />
        <PrimaryButton icon="fas fa-xmark" :onclick="close" />
      </div>
    </div>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import notificationMixin from '@/mixins/notificationMixin'
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin'
import TransactionCategoryTranslationController from '@/api/TransactionCategoryTranslationController'
import { applyTransactionCategoryTranslationOverrides } from '@/i18n'

export default {
  components: { PrimaryButton },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  emits: ['saved', 'close'],
  data() {
    return {
      rows: [],
      loading: false,
      saveLoading: false,
    }
  },
  mounted() {
    this.fetchDictionary()
  },
  methods: {
    close() {
      this.$emit('close')
    },
    async fetchDictionary() {
      this.loading = true
      try {
        const data = await TransactionCategoryTranslationController.getDictionary()
        this.rows = (Array.isArray(data) ? data : []).map((item) => ({
          key: item.key,
          slug: item.slug,
          baseLabel: this.$t(item.key),
          translations: {
            ru: item?.translations?.ru || '',
            en: item?.translations?.en || '',
            tm: item?.translations?.tm || '',
          },
        }))
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true)
      } finally {
        this.loading = false
      }
    },
    buildPayload() {
      const payload = []
      for (const row of this.rows) {
        for (const locale of ['ru', 'en', 'tm']) {
          const value = String(row?.translations?.[locale] || '').trim()
          if (value === '') {
            continue
          }
          payload.push({
            key: row.key,
            locale,
            value,
          })
        }
      }
      return payload
    },
    async save() {
      this.saveLoading = true
      try {
        const payload = this.buildPayload()
        await TransactionCategoryTranslationController.upsert(payload)
        const dictionary = await TransactionCategoryTranslationController.getDictionary()
        applyTransactionCategoryTranslationOverrides(dictionary)
        this.showNotification(this.$t('savedSuccessfully'), '', false)
        this.$emit('saved')
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true)
      } finally {
        this.saveLoading = false
      }
    },
  },
}
</script>
