<template>
  <div
    v-if="hasContent"
    class="task-assignees-flow"
  >
    <span
      v-if="supervisorUser"
      class="task-assignees-flow__person"
      :title="supervisorTitle"
    >
      <EntityCardCreatorAvatar :user="supervisorUser" />
    </span>
    <i
      v-if="supervisorUser && executorUser"
      class="fas fa-chevron-right task-assignees-flow__chevron"
      aria-hidden="true"
    />
    <span
      v-if="executorUser"
      class="task-assignees-flow__person"
      :title="executorTitle"
    >
      <EntityCardCreatorAvatar :user="executorUser" />
    </span>
  </div>
</template>

<script>
import EntityCardCreatorAvatar from '@/views/components/app/cards/EntityCardCreatorAvatar.vue';
import { getUserDisplayName } from '@/utils/displayUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';

export default {
    name: 'TaskAssigneesFlow',
    components: { EntityCardCreatorAvatar },
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    computed: {
        supervisorUser() {
            return this.normalizeUser(this.item?.supervisor);
        },
        executorUser() {
            return this.normalizeUser(this.item?.executor);
        },
        hasContent() {
            return Boolean(this.supervisorUser || this.executorUser);
        },
        supervisorTitle() {
            if (!this.supervisorUser) {
                return '';
            }
            return `${this.$t('supervisor')}: ${getUserDisplayName(this.supervisorUser)}`;
        },
        executorTitle() {
            if (!this.executorUser) {
                return '';
            }
            return `${this.$t('executor')}: ${getUserDisplayName(this.executorUser)}`;
        },
    },
    methods: {
        normalizeUser(user) {
            if (!user) {
                return null;
            }
            const normalized = normalizeUserForCell(user);
            if (!normalized?.id && !normalized?.name) {
                return null;
            }
            return normalized;
        },
    },
};
</script>
