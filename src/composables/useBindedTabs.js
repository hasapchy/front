import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { getBindedList } from '@/utils/headerBindedTabs';

export function useBindedTabs() {
    const route = useRoute();
    const store = useStore();
    const { t } = useI18n();
    return computed(() => getBindedList(route, store, t));
}
