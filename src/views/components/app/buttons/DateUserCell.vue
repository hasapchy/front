<template>
  <div class="flex h-full w-full flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
    <span
      v-if="dateText"
      v-html="dateHtml"
    />
    <span
      v-if="dateText && showUserPart"
      class="text-gray-500 dark:text-[var(--text-secondary)]"
    >/</span>
    <UserButtonCell
      v-if="showUserPart"
      :user="user"
      :search-query="searchQuery"
      :level="level"
    />
    <span v-else-if="!dateText">-</span>
  </div>
</template>

<script>
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';
import { highlightMatches } from '@/utils/searchUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';

export default {
    name: 'DateUserCell',
    components: {
        UserButtonCell,
    },
    props: {
        date: {
            type: String,
            default: ''
        },
        user: {
            type: Object,
            default: null
        },
        searchQuery: {
            type: String,
            default: ''
        },
        level: {
            type: Number,
            default: 3
        }
    },
    computed: {
        dateText() {
            return String(this.date ?? '').trim();
        },
        resolvedUser() {
            return normalizeUserForCell(this.user);
        },
        showUserPart() {
            return Boolean(this.resolvedUser);
        },
        dateHtml() {
            const query = this.searchQuery?.trim();
            return query ? highlightMatches(this.dateText, query) : this.dateText;
        },
    },
};
</script>
