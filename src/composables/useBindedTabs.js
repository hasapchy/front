import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { getPageRouteTabs } from '@/utils/pageRouteTabGroups';

export function useBindedTabs() {
    const route = useRoute();
    const store = useStore();
    const { t, locale } = useI18n();

    return computed(() => {
        void store.state.permissions;
        void store.state.permissionsLoaded;
        void store.state.user;
        void store.state.pageTabOrders;
        void locale.value;
        return getPageRouteTabs(route.path, store, t);
    });
}
