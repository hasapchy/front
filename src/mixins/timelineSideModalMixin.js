export default {
    data() {
        return {
            timelineCollapsed: true,
        };
    },
    methods: {
        toggleTimeline() {
            this.timelineCollapsed = !this.timelineCollapsed;
        },
        resetTimelineSidebar() {
            this.timelineCollapsed = true;
        },
        refreshTimelineIfVisible() {
            const panel = this.$refs.timelinePanel;
            if (panel && !this.timelineCollapsed && typeof panel.refreshTimeline === 'function') {
                panel.refreshTimeline();
            }
        },
        onAfterSaved() {
            this.refreshTimelineIfVisible();
        },
    },
};
