<template>
    <div>
        <div v-if="selectedProject == null" class="relative">
            <label class="block mb-1" :class="{ 'required': required }">{{ $t('project') }}</label>
            <input type="text" v-model="projectSearch" :placeholder="$t('enterProjectName')"
                class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur"
                :disabled="disabled" />
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="projectSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                    <template v-else-if="projectSearch.length === 0">
                        <li v-for="project in lastProjects" :key="project.id" @mousedown.prevent="selectProject(project)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div>{{ project.name }}</div>
                                <div class="text-[#337AB7] text-sm">{{ getClientName(project) }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="projectSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                    <li v-else-if="projectResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                    <li v-for="project in projectResults" :key="project.id" @mousedown.prevent="() => selectProject(project)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div>{{ project.name }}</div>
                            <div class="text-[#337AB7] text-sm">{{ getClientName(project) }}</div>
                        </div>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class="mt-2">
            <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label :class="{ 'required': required }">{{ $t('project') }}</label>
                        <p><span class="font-semibold text-sm">{{ $t('name') }}:</span> {{ selectedProject.name }}</p>
                        <p v-if="getClientName(selectedProject) !== $t('noClient')"><span class="font-semibold text-sm">{{ $t('client') }}:</span> {{ getClientName(selectedProject) }}</p>
                    </div>
                    <button v-on:click="deselectProject" class="text-red-500 text-2xl cursor-pointer"
                        :disabled="disabled">×</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import BasementProjectController from '@/api/BasementProjectController';
import debounce from 'lodash.debounce';

export default {
    props: {
        selectedProject: {
            type: [Object, Number],
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
    },
    data() {
        return {
            projectSearch: '',
            projectSearchLoading: false,
            projectResults: [],
            lastProjects: [],
            showDropdown: false,
        };
    },
    created() {
        this.fetchLastProjects();
    },
    emits: ['update:selectedProject'],
    methods: {
        getClientName(project) {
            if (!project) return this.$t('noClient');
            
            // Проверяем объект клиента
            if (project.client) {
                // Если есть contact_person, используем его
                if (project.client.contact_person) {
                    return `${project.client.first_name} ${project.client.last_name} (${project.client.contact_person})`;
                }
                
                // Если есть first_name и last_name
                if (project.client.first_name && project.client.last_name) {
                    return `${project.client.first_name} ${project.client.last_name}`;
                }
                
                // Если есть только first_name
                if (project.client.first_name) {
                    return project.client.first_name;
                }
                
                // Если есть name
                if (project.client.name) {
                    return project.client.name;
                }
            }
            
            // Если нет клиента
            if (!project.clientId) {
                return this.$t('noClient');
            }
            
            return this.$t('noClient');
        },
        async fetchLastProjects() {
            try {
                const paginated = await BasementProjectController.getItems(1);
                this.lastProjects = paginated.items.slice(0, 10);
                
            } catch (error) {
                this.lastProjects = [];
            }
        },
        searchProjects: debounce(async function () {
            if (this.projectSearch.length >= 3) {
                this.projectSearchLoading = true;
                try {
                    const results = await BasementProjectController.search(this.projectSearch);
                    this.projectResults = results;
                } catch (error) {
                    this.projectResults = [];
                } finally {
                    this.projectSearchLoading = false;
                }
            } else {
                this.projectResults = [];
            }
        }, 250),
        async selectProject(project) {
            this.showDropdown = false;
            this.projectSearch = '';
            this.projectResults = [];
            
            try {
                const updatedProject = await BasementProjectController.getItem(project.id);
                this.$emit('update:selectedProject', updatedProject);
            } catch (error) {
                this.$emit('update:selectedProject', project);
            }
        },
        deselectProject() {
            this.$emit('update:selectedProject', null);
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
    },
    watch: {
        projectSearch: {
            handler: 'searchProjects',
            immediate: true,
        },
    },
};
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>

