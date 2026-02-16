<template>
    <span
        v-if="count > 0"
        :class="inline ? 'ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] inline-flex items-center justify-center shrink-0' : 'absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0'"
    >
        {{ count > 99 ? '99+' : count }}
    </span>
</template>

<script>
import OrderController from "@/api/OrderController";
import echo from "@/services/echo";

export default {
    name: "OrdersBadge",
    props: {
        inline: { type: Boolean, default: false }
    },
    data() {
        return { count: 0, channel: null };
    },
    computed: {
        companyId() {
            return this.$store.getters.currentCompanyId;
        },
    },
    watch: {
        companyId() {
            this.unsubscribe();
            this.loadCount();
            this.subscribe();
        },
    },
    async mounted() {
        await this.loadCount();
        this.subscribe();
    },
    beforeUnmount() {
        this.unsubscribe();
    },
    methods: {
        async loadCount() {
            try {
                this.count = await OrderController.getFirstStageCount();
            } catch {
                this.count = 0;
            }
        },
        subscribe() {
            if (!this.companyId || this.channel) return;
            this.channel = echo
                .private(`company.${this.companyId}.orders`)
                .listen(".order.first-stage-count.updated", this.loadCount);
        },
        unsubscribe() {
            if (!this.channel) return;
            this.channel.stopListening(".order.first-stage-count.updated");
            echo.leave(`company.${this.companyId}.orders`);
            this.channel = null;
        },
    },
};
</script>
