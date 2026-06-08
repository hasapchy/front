<template>
  <div class="flex justify-center">
    <ProjectChatButton :project-id="projectId" />
  </div>
</template>

<script>
import ProjectChatButton from '@/views/components/app/buttons/ProjectChatButton.vue';

export default {
  components: {
    ProjectChatButton,
  },
  props: {
    projectId: {
      type: [Number, String],
      required: true,
    },
  },
};
</script>
