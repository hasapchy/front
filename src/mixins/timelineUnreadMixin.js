import CommentController from "@/api/CommentController";

export default {
    data() {
        return {
            timelineUnreadCounts: {},
        };
    },
    methods: {
        getTimelineUnreadCount(entityId) {
            return Number(this.timelineUnreadCounts?.[entityId] || 0);
        },
        async fetchTimelineUnreadCounts(type, ids) {
            const normalizedIds = Array.from(
                new Set((ids || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))
            );
            if (!normalizedIds.length) {
                this.timelineUnreadCounts = {};
                return {};
            }

            try {
                const counts = await CommentController.getTimelineUnreadCounts(type, normalizedIds);
                this.timelineUnreadCounts = Object.fromEntries(
                    normalizedIds.map(id => [id, Number(counts?.[id] || counts?.[String(id)] || 0)])
                );
                return this.timelineUnreadCounts;
            } catch {
                return {};
            }
        },
        applyTimelineUnreadCounts(items) {
            if (!Array.isArray(items)) {
                return;
            }
            items.forEach(item => {
                if (!item || !item.id) {
                    return;
                }
                item.unreadTimelineCommentsCount = this.getTimelineUnreadCount(item.id);
            });
        },
        async markTimelineEntityAsRead(type, id) {
            const entityId = Number(id);
            if (!Number.isInteger(entityId) || entityId <= 0) {
                return;
            }

            await CommentController.markTimelineRead(type, entityId);
            this.timelineUnreadCounts = {
                ...this.timelineUnreadCounts,
                [entityId]: 0,
            };
        },
    },
};
