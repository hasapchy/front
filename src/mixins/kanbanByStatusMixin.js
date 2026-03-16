export default {
    data() {
        return {
            kanbanByStatus: {},
            kanbanFetchPerPage: 50,
            kanbanOrdersStable: []
        };
    },
    computed: {
        allKanbanItems() {
            return this.kanbanOrdersStable;
        }
    },
    methods: {
        syncKanbanOrdersStable() {
            this.kanbanOrdersStable = (this.statuses ?? []).flatMap(s => this.kanbanByStatus[s.id]?.items ?? []);
        },
        resetKanbanPagination() {
            this.kanbanByStatus = {};
            this.kanbanOrdersStable = [];
        },
        async fetchKanbanInitial() {
            if (this.ensureKanbanStatuses) await this.ensureKanbanStatuses();
            if (!this.statuses?.length) {
                return;
            }
            const responses = await Promise.all(this.statuses.map(s => this.fetchKanbanStatusPage(s.id, 1)));
            this.kanbanByStatus = Object.fromEntries(this.statuses.map((s, i) => [
                s.id,
                { items: responses[i]?.items ?? [], page: 1, hasMore: responses[i]?.nextPage != null, loading: false }
            ]));
            this.syncKanbanOrdersStable();
            if (this.afterFetchKanbanInitial) this.afterFetchKanbanInitial(responses);
        },
        async loadMoreKanbanItems(statusId) {
            const state = this.kanbanByStatus[statusId];
            if (!state?.hasMore || state.loading) return;
            state.loading = true;
            try {
                const res = await this.fetchKanbanStatusPage(statusId, state.page + 1);
                state.items.push(...(res?.items ?? []));
                state.page = res?.currentPage ?? state.page + 1;
                state.hasMore = res?.nextPage != null;
                this.syncKanbanOrdersStable();
            } catch (error) {
                const msg = this.kanbanErrorMessage ? this.$t(this.kanbanErrorMessage) : this.$t('error');
                this.showNotification(msg, this.getApiErrorMessage?.(error) ?? error.message, true);
            } finally {
                state.loading = false;
            }
        }
    }
};
