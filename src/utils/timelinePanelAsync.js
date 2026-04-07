import { defineAsyncComponent } from 'vue';

export const TimelinePanelAsync = defineAsyncComponent(() =>
    import('@/views/components/app/dialog/TimelinePanel.vue')
);
