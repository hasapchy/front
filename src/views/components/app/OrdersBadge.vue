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
import { eventBus } from "@/eventBus";
import { COMPANY_BROADCAST } from "@/services/companyBroadcastHub";

export default {
    name: "OrdersBadge",
    props: {
        inline: { type: Boolean, default: false }
    },
    data() {
        return { count: 0 };
    },
    computed: {
        companyId() {
            return this.$store.getters.currentCompanyId;
        },
    },
    watch: {
        companyId: {
            immediate: true,
            handler() {
                this.loadCount();
            },
        },
    },
    mounted() {
        eventBus.on(COMPANY_BROADCAST.ORDERS_FIRST_STAGE, this.loadCount);
    },
    beforeUnmount() {
        eventBus.off(COMPANY_BROADCAST.ORDERS_FIRST_STAGE, this.loadCount);
    },
    methods: {
        async loadCount() {
            try {
                this.count = await OrderController.getFirstStageCount();
            } catch {
                this.count = 0;
            }
        },
    },
};
</script>
