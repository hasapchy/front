<template>
  <div class="space-y-3">
    <div>
      <label class="required">{{ $t('title') }}</label>
      <input
        ref="titleInput"
        v-model="title"
        type="text"
      >
    </div>

    <div>
      <label>{{ $t('description') }}</label>
      <textarea
        v-model="description"
        rows="4"
      />
    </div>

    <div>
      <UserSearch
        :selected-user="selectedExecutor"
        :required="true"
        :label="$t('executor')"
        @update:selected-user="onExecutorUpdated"
      />
    </div>

    <div>
      <ProjectSearch
        :selected-project="selectedProject"
        :project-id="projectId"
        :active-projects-only="false"
        @update:selected-project="onProjectUpdated"
      />
    </div>

    <div>
      <label>{{ $t('deadline') }}</label>
      <input
        v-model="deadline"
        type="datetime-local"
      >
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import TaskController from '@/api/TaskController';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import ProjectSearch from '@/views/components/app/search/ProjectSearch.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { getDefaultTaskDeadline } from '@/utils/taskDefaultDeadline';
import {
  readLastQuickTaskExecutor,
  writeLastQuickTaskExecutor,
} from '@/utils/taskQuickCreateStorage';

export default {
  name: 'TaskQuickCreateForm',
  components: { UserSearch, ProjectSearch },
  mixins: [getApiErrorMessageMixin, notificationMixin],
  emits: ['saved', 'open-full-form', 'cancel'],
  data() {
    return {
      title: '',
      description: '',
      selectedExecutor: null,
      selectedSupervisor: null,
      selectedProject: null,
      projectId: null,
      deadline: '',
      saveLoading: false,
    };
  },
  computed: {
    companyId() {
      return this.$store.getters.currentCompany?.id ?? null;
    },
  },
  mounted() {
    this.applyDefaults();
    this.$nextTick(() => {
      this.$refs.titleInput?.focus?.();
    });
  },
  methods: {
    applyDefaults() {
      const lastExecutor = readLastQuickTaskExecutor(this.companyId);
      this.selectedExecutor = lastExecutor ?? this.$store.state.user ?? null;
      this.selectedSupervisor = this.$store.state.user ?? null;
      this.deadline = getDefaultTaskDeadline(this.$store.getters.currentCompany);
    },
    onExecutorUpdated(user) {
      this.selectedExecutor = user;
      if (user?.id) {
        writeLastQuickTaskExecutor(this.companyId, user);
      }
    },
    onProjectUpdated(project) {
      this.selectedProject = project ?? null;
      this.projectId = project?.id ?? null;
    },
    getDraftPayload() {
      return {
        title: this.title?.trim() || '',
        description: this.description || '',
        executor: this.selectedExecutor ? { ...this.selectedExecutor } : null,
        supervisor: this.selectedSupervisor ? { ...this.selectedSupervisor } : null,
        project: this.selectedProject ? { ...this.selectedProject } : null,
        projectId: this.projectId || null,
        deadline: this.deadline || null,
      };
    },
    async saveQuick() {
      if (this.saveLoading) {
        return;
      }
      if (!this.title?.trim()) {
        this.showNotification(this.$t('error'), this.$t('titleRequired'), true);
        return;
      }
      if (!this.selectedSupervisor?.id) {
        this.showNotification(this.$t('error'), this.$t('supervisorRequired'), true);
        return;
      }
      if (!this.selectedExecutor?.id) {
        this.showNotification(this.$t('error'), this.$t('executorRequired'), true);
        return;
      }

      this.saveLoading = true;
      try {
        const payload = {
          title: this.title.trim(),
          description: this.description || null,
          supervisorId: this.selectedSupervisor.id,
          executorId: this.selectedExecutor.id,
          projectId: this.projectId || null,
          deadline: this.deadline ? dayjs(this.deadline).format('YYYY-MM-DD HH:mm:ss') : null,
        };
        await TaskController.createItem(payload);
        writeLastQuickTaskExecutor(this.companyId, this.selectedExecutor);
        this.$emit('saved');
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      } finally {
        this.saveLoading = false;
      }
    },
    openFullForm() {
      this.$emit('open-full-form', this.getDraftPayload());
    },
  },
};
</script>
