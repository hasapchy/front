function kanbanLog(...args) {
    if (typeof window !== 'undefined' && window.__KANBAN_DEBUG__ !== false) {
        console.log('[Kanban]', new Date().toISOString().slice(11, 23), ...args);
    }
}

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
            const prevCount = this.kanbanOrdersStable?.length ?? 0;
            this.kanbanOrdersStable = (this.statuses ?? []).flatMap(s => this.kanbanByStatus[s.id]?.items ?? []);
            const byStatus = (this.statuses ?? []).map(s => ({
                id: s.id,
                name: s.name,
                count: (this.kanbanByStatus[s.id]?.items ?? []).length
            }));
            kanbanLog('syncKanbanOrdersStable', { prevCount, newCount: this.kanbanOrdersStable.length, byStatus });
        },
        resetKanbanPagination() {
            kanbanLog('resetKanbanPagination', { hadItems: this.kanbanOrdersStable?.length ?? 0 });
            this.kanbanByStatus = {};
            this.kanbanOrdersStable = [];
        },
        async fetchKanbanInitial() {
            kanbanLog('fetchKanbanInitial start', { statusesCount: this.statuses?.length ?? 0 });
            if (this.ensureKanbanStatuses) await this.ensureKanbanStatuses();
            if (!this.statuses?.length) {
                kanbanLog('fetchKanbanInitial abort', 'no statuses');
                return;
            }
            const statusIds = this.statuses.map(s => s.id);
            kanbanLog('fetchKanbanInitial fetching', { statusIds });
            const responses = await Promise.all(this.statuses.map(s => this.fetchKanbanStatusPage(s.id, 1)));
            const responseSummary = responses.map((r, i) => ({
                statusId: statusIds[i],
                itemsCount: r?.items?.length ?? 0,
                nextPage: r?.nextPage ?? null
            }));
            kanbanLog('fetchKanbanInitial responses', responseSummary);
            this.kanbanByStatus = Object.fromEntries(this.statuses.map((s, i) => [
                s.id,
                { items: responses[i]?.items ?? [], page: 1, hasMore: responses[i]?.nextPage != null, loading: false }
            ]));
            this.syncKanbanOrdersStable();
            if (this.afterFetchKanbanInitial) this.afterFetchKanbanInitial(responses);
            kanbanLog('fetchKanbanInitial done', { totalItems: this.kanbanOrdersStable.length });
        },
        async loadMoreKanbanItems(statusId) {
            const state = this.kanbanByStatus[statusId];
            if (!state?.hasMore || state.loading) return;
            kanbanLog('loadMoreKanbanItems', { statusId, page: state.page });
            state.loading = true;
            try {
                const res = await this.fetchKanbanStatusPage(statusId, state.page + 1);
                const added = res?.items?.length ?? 0;
                state.items.push(...(res?.items ?? []));
                state.page = res?.currentPage ?? state.page + 1;
                state.hasMore = res?.nextPage != null;
                this.syncKanbanOrdersStable();
                kanbanLog('loadMoreKanbanItems done', { statusId, added, totalInColumn: state.items.length });
            } catch (error) {
                const msg = this.kanbanErrorMessage ? this.$t(this.kanbanErrorMessage) : this.$t('error');
                this.showNotification(msg, this.getApiErrorMessage?.(error) ?? error.message, true);
            } finally {
                state.loading = false;
            }
        }
    }
};
