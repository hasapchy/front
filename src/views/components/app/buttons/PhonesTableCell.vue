<template>
  <span class="inline-flex max-w-full flex-wrap items-center gap-1.5 align-middle">
    <template v-if="primaryMeta">
      <img
        :src="primaryMeta.country.flag"
        :alt="primaryMeta.country.name"
        class="h-4 w-4 shrink-0 rounded object-cover ring-1 ring-black/10 dark:ring-white/15"
        width="16"
        height="16"
        loading="lazy"
        decoding="async"
      >
      <span
        v-if="primaryPhoneDisplayHtml"
        class="min-w-0 truncate"
        :class="{ 'line-through': isDeleted }"
        v-html="primaryPhoneDisplayHtml"
      />
      <span
        v-else
        class="min-w-0 truncate"
        :class="{ 'line-through': isDeleted }"
      >{{ primaryMeta.phone }}</span>
    </template>
    <span
      v-else
      :class="{ 'line-through': isDeleted }"
    >—</span>
    <span
      v-if="extraCount > 0"
      class="shrink-0 whitespace-nowrap rounded border border-gray-200 bg-gray-50 px-1.5 py-px text-[11px] font-medium leading-none text-gray-600 dark:border-white/15 dark:bg-white/[0.08] dark:text-[var(--text-secondary)]"
      :title="tooltipExtra"
      role="status"
    >{{ badgeText }}</span>
  </span>
</template>

<script>
import {
    DEFAULT_PHONE_COUNTRY_ID,
    detectCountryIdByPhone,
    getCountryById,
} from '@/constants/phoneCountries';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    name: 'PhonesTableCell',
    props: {
        phones: {
            type: Array,
            default: () => []
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        searchQuery: {
            type: String,
            default: ''
        }
    },
    computed: {
        trimmedSearch() {
            return String(this.searchQuery || '').trim();
        },
        primaryPhoneDisplayHtml() {
            if (!this.primaryMeta || !this.trimmedSearch) {
                return '';
            }
            return highlightMatches(this.primaryMeta.phone, this.trimmedSearch);
        },
        phoneEntries() {
            return (Array.isArray(this.phones) ? this.phones : [])
                .map((p) => {
                    if (!p || typeof p.phone !== 'string') {
                        return null;
                    }
                    const phone = p.phone.trim();
                    if (!phone) {
                        return null;
                    }
                    return { phone };
                })
                .filter(Boolean);
        },
        primaryMeta() {
            const first = this.phoneEntries[0];
            if (!first) {
                return null;
            }
            const id = detectCountryIdByPhone(first.phone);
            const country = getCountryById(id) || getCountryById(DEFAULT_PHONE_COUNTRY_ID);
            return { phone: first.phone, country };
        },
        extraCount() {
            return Math.max(0, this.phoneEntries.length - 1);
        },
        badgeText() {
            return this.$t('phonesAdditionalShort', { count: this.extraCount });
        },
        tooltipExtra() {
            return this.phoneEntries.slice(1).map((e) => e.phone).join(', ');
        }
    }
};
</script>
