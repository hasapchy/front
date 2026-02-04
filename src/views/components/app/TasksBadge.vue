<template>
    <span
        v-if="count > 0"
        class="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] inline-flex items-center justify-center shrink-0"
    >
        {{ count > 99 ? '99+' : count }}
    </span>
</template>

<script>
import TaskController from "@/api/TaskController";

export default {
    name: "TasksBadge",
    data() {
        return { count: 0 };
    },
    computed: {
        companyId() {
            return this.$store.getters.currentCompanyId;
        },
    },
    watch: {
        companyId() {
            this.loadCount();
        },
    },
    async mounted() {
        await this.loadCount();
    },
    methods: {
        async loadCount() {
            try {
                this.count = await TaskController.getOverdueCount();
            } catch {
                this.count = 0;
            }
        },
    },
};
</script>
