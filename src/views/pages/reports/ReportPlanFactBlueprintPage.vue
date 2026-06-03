<template>
  <div class="space-y-4">
    <div class="bg-white border rounded p-4">
      <h3 class="text-sm font-semibold mb-2">Plan/Fact Blueprint</h3>
      <div class="text-sm"><span class="font-semibold">Entity:</span> {{ blueprint.entity }}</div>
      <div class="text-sm"><span class="font-semibold">Report:</span> {{ blueprint.report }}</div>
      <div class="text-sm">
        <span class="font-semibold">Statuses:</span>
        {{ (blueprint.statuses || []).join(', ') }}
      </div>
    </div>
    <div class="bg-white border rounded p-4">
      <h3 class="text-sm font-semibold mb-2">Required Fields</h3>
      <ul class="list-disc pl-5 text-sm">
        <li v-for="field in (blueprint.required_fields || [])" :key="field">
          {{ field }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import ReportsController from '@/api/ReportsController';
import notificationMixin from '@/mixins/notificationMixin';

export default {
  mixins: [notificationMixin],
  data() {
    return {
      blueprint: {},
    };
  },
  async created() {
    try {
      this.blueprint = await ReportsController.getPlanFactBlueprint();
    } catch (error) {
      this.showNotification(this.$t('error'), error?.message, true);
    }
  },
};
</script>
