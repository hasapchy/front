<template>
  <AppFieldPicker
    :has-selection="selectedProject != null"
    inline-selected
    :inline-selected-value="selectedProjectPrimary"
    :show-label="showLabel"
    :label="$t('project')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="allowDeselect"
    :dropdown-open="showDropdown"
    :search-value="projectSearch"
    :placeholder="$t('searchProjectByNameOrClient')"
    @update:search-value="projectSearch = $event"
    @focus="handleFocus"
    @blur="handleBlur"
    @deselect="deselectProject"
  >
    <template #dropdown>
      <li
        v-if="dropdownStatus === 'loading'"
        class="app-field-picker__message"
      >
        {{ $t('loading') }}
      </li>
      <li
        v-else-if="dropdownStatus === 'minChars'"
        class="app-field-picker__message"
      >
        {{ $t('minimum2Characters') }}
      </li>
      <li
        v-else-if="dropdownStatus === 'notFound'"
        class="app-field-picker__message"
      >
        {{ $t('notFound') }}
      </li>
      <AppFieldPickerOption
        v-for="project in dropdownProjects"
        :key="project.id"
        :primary="projectOptionPrimary(project)"
        :meta="projectStatusLabel(project)"
        meta-badge
        :meta-style="projectStatusBadgeStyle(project)"
        @select="selectProject(project)"
      />
    </template>
    <template #selected>
      <div class="min-w-0">
        <p class="app-field-picker__selected-line">
          {{ selectedProjectPrimary }}
        </p>
        <span
          v-if="selectedProjectStatus"
          class="app-field-picker__option-meta app-field-picker__option-meta--badge mt-1 inline-block"
          :style="selectedProjectStatusStyle"
        >{{ selectedProjectStatus }}</span>
      </div>
    </template>
  </AppFieldPicker>
</template>

<script>
import ProjectController from '@/api/ProjectController';
import debounce from 'lodash.debounce';
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';
import {
  filterProjectsForSelect,
  getProjectOptionPrimary,
  getProjectStatusBadgeStyle,
  getProjectStatusLabel,
} from '@/utils/projectSearchUtils';

const SEARCH_MIN_LENGTH = 2;
const LIST_LIMIT = 20;

export default {
    components: { AppFieldPicker, AppFieldPickerOption },
    props: {
        selectedProject: {
            type: Object,
            default: null,
        },
        projectId: {
            type: [Number, String],
            default: null,
        },
        activeProjectsOnly: {
            type: Boolean,
            default: true,
        },
        clientId: {
            type: [Number, String],
            default: null,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
        allowDeselect: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['update:selectedProject'],
    data() {
        return {
            projectSearch: '',
            projectSearchLoading: false,
            projectResults: [],
            lastProjects: [],
            showDropdown: false,
        };
    },
    computed: {
        filterOptions() {
            return {
                activeOnly: this.activeProjectsOnly,
                clientId: this.clientId,
            };
        },
        isSearchActive() {
            return this.projectSearch.length > 0;
        },
        dropdownProjects() {
            if (!this.isSearchActive) {
                return this.lastProjects;
            }
            if (this.projectSearch.length < SEARCH_MIN_LENGTH) {
                return [];
            }
            return this.projectResults;
        },
        dropdownStatus() {
            if (this.projectSearchLoading) {
                return 'loading';
            }
            if (this.isSearchActive && this.projectSearch.length < SEARCH_MIN_LENGTH) {
                return 'minChars';
            }
            if (this.isSearchActive && this.projectResults.length === 0) {
                return 'notFound';
            }
            return null;
        },
        selectedProjectPrimary() {
            if (!this.selectedProject) {
                return '';
            }
            return getProjectOptionPrimary(this.selectedProject, this.$t);
        },
        selectedProjectStatus() {
            if (!this.selectedProject) {
                return '';
            }
            return getProjectStatusLabel(this.selectedProject, this.$t);
        },
        selectedProjectStatusStyle() {
            if (!this.selectedProject) {
                return {};
            }
            return getProjectStatusBadgeStyle(this.selectedProject);
        },
    },
    watch: {
        projectSearch: {
            handler: 'searchProjects',
            immediate: true,
        },
        projectId: {
            async handler(id) {
                if (!id) {
                    if (this.selectedProject) {
                        this.$emit('update:selectedProject', null);
                    }
                    return;
                }
                if (this.selectedProject && Number(this.selectedProject.id) === Number(id)) {
                    return;
                }
                try {
                    const project = await ProjectController.getItem(id);
                    this.$emit('update:selectedProject', project);
                } catch {
                    if (this.selectedProject && Number(this.selectedProject.id) === Number(id)) {
                        return;
                    }
                    this.$emit('update:selectedProject', null);
                }
            },
            immediate: true,
        },
        filterOptions: {
            handler() {
                this.projectResults = [];
                this.fetchLastProjects();
            },
            deep: true,
        },
    },
    async created() {
        await this.fetchLastProjects();
    },
    methods: {
        projectOptionPrimary(project) {
            return getProjectOptionPrimary(project, this.$t);
        },
        projectStatusLabel(project) {
            return getProjectStatusLabel(project, this.$t);
        },
        projectStatusBadgeStyle(project) {
            return getProjectStatusBadgeStyle(project);
        },
        filterProjects(projects) {
            return filterProjectsForSelect(projects, this.filterOptions);
        },
        getProjectsFromStore() {
            const projects = this.$store.getters.projects;
            if (Array.isArray(projects) && projects.length > 0) {
                return projects;
            }
            return [];
        },
        filterProjectsByQuery(projects, query) {
            const normalizedQuery = String(query || '').trim().toLowerCase();
            if (!normalizedQuery) {
                return projects;
            }
            return projects.filter((project) => {
                const projectName = String(project?.name || '').toLowerCase();
                const clientName = String(project?.client?.name || '').toLowerCase();
                return projectName.includes(normalizedQuery) || clientName.includes(normalizedQuery);
            });
        },
        async fetchLastProjects() {
            try {
                let items = this.getProjectsFromStore();
                if (items.length === 0) {
                    await this.$store.dispatch('loadProjects');
                    items = this.getProjectsFromStore();
                }
                if (items.length === 0) {
                    items = await ProjectController.getListItems();
                }
                this.lastProjects = this.filterProjects(items).slice(0, LIST_LIMIT);
            } catch {
                this.lastProjects = [];
            }
        },
        searchProjects: debounce(async function () {
            if (this.projectSearch.length < SEARCH_MIN_LENGTH) {
                this.projectResults = [];
                return;
            }
            this.projectSearchLoading = true;
            try {
                const storeProjects = this.getProjectsFromStore();
                if (storeProjects.length > 0) {
                    const filtered = this.filterProjectsByQuery(storeProjects, this.projectSearch);
                    this.projectResults = this.filterProjects(filtered).slice(0, LIST_LIMIT);
                    return;
                }
                const params = { search: this.projectSearch };
                if (this.clientId != null && this.clientId !== '') {
                    params.client_id = this.clientId;
                }
                const response = await ProjectController.getItems(1, params, LIST_LIMIT);
                this.projectResults = this.filterProjects(response?.items ?? []);
            } catch {
                this.projectResults = [];
            } finally {
                this.projectSearchLoading = false;
            }
        }, 1200),
        selectProject(project) {
            this.showDropdown = false;
            this.projectSearch = '';
            this.projectResults = [];
            this.$emit('update:selectedProject', project);
        },
        deselectProject() {
            this.$emit('update:selectedProject', null);
        },
        async handleFocus() {
            this.showDropdown = true;
            if (this.lastProjects.length === 0) {
                await this.fetchLastProjects();
            }
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
    },
};
</script>
