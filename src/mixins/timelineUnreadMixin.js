import CommentController from "@/api/CommentController";
import { eventBus } from "@/eventBus";

export default {
    data() {
        return {
            timelineUnreadCounts: {},
            lastTimelineUnreadType: null,
        };
    },
    mounted() {
        eventBus.on("timeline-item-created", this.onTimelineItemCreated);
    },
    beforeUnmount() {
        eventBus.off("timeline-item-created", this.onTimelineItemCreated);
    },
    methods: {
        onTimelineItemCreated(payload) {
            const type = payload?.apiType;
            const entityId = Number(payload?.entityId);
            if (!type || !entityId || (this.lastTimelineUnreadType && type !== this.lastTimelineUnreadType)) {
                return;
            }
            this.fetchTimelineUnreadCounts(type, [entityId]);
        },
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
                this.lastTimelineUnreadType = type;
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
