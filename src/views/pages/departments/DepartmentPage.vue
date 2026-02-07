<template>
    <div class="flex flex-col h-full">
        <!-- Main Content Area - Transparent background as requested -->
        <div class="flex-1 bg-transparent overflow-auto">
            <div v-if="loading" class="flex justify-center items-center h-64">
                <SpinnerIcon />
            </div>

            <div v-else class="py-8 px-6">
                <div class="flex flex-col items-center">
                    <div class="org-chart-scroll overflow-x-auto w-full px-8 pt-8 pb-12">
                        <div class="relative org-chart-container min-w-max flex flex-col items-center">
                            <!-- SVG Connectors Layer -->
                            <OrgChartConnectors v-if="rootDepartments.length > 0" :nodes="rootDepartments"
                                :key="connectorsKey" />

                            <!-- Company Card -->
                            <div
                                class="company-card bg-white rounded-lg shadow-sm border-2 border-[#337AB7]/20 w-72 group relative transition-all duration-200 hover:shadow-md hover:border-[#337AB7] hover:ring-2 hover:ring-[#337AB7]/20 z-10">
                                <div
                                    class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#337AB7] text-white text-[10px] font-semibold px-4 py-1 rounded-full uppercase tracking-wide shadow-sm z-10">
                                    Организация
                                </div>

                                <div class="p-6 text-center">
                                    <div
                                        class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-200">
                                        <i class="fas fa-building text-[#337AB7] text-4xl"></i>
                                    </div>
                                    <div class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Название
                                        компании</div>
                                    <div class="text-base font-bold text-gray-900 break-words leading-tight px-2">
                                        {{ currentCompanyName }}
                                    </div>
                                </div>

                                <div
                                    class="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-center rounded-b-lg">
                                    <button @click.stop="showCreateModal(null)"
                                        :disabled="!$store.getters.hasPermission('departments_create')"
                                        class="px-4 py-2 text-xs font-semibold text-white bg-[#5CB85C] hover:bg-[#4EA84E] rounded-md transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#5CB85C] shadow-sm"
                                        title="Создать новый отдел">
                                        <i class="fas fa-plus text-[10px]"></i>
                                        <span>Добавить отдел</span>
                                    </button>
                                </div>
                            </div>

                            <div v-if="rootDepartments.length > 0" class="flex flex-col items-center mt-28">
                                <div class="relative flex items-start" :style="rootDepartmentsContainerStyle">
                                    <div v-for="(dept) in rootDepartments" :key="dept.id" class="mx-4">
                                        <OrgNode :node="dept" :level="0" @edit="showEditModal"
                                            @add-child="showCreateModal" @delete="handleDelete" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
            <DepartmentCreatePage ref="departmentcreatepageForm" :editingItem="editingItem" :parentId="parentId"
                @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
                @deleted-error="handleDeletedError" @close-request="closeModal" />
        </SideModalDialog>


        <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDelete" @leave="deleteDialog = false" />
    </div>
</template>

<script>
import DepartmentController from '@/api/DepartmentController';
import OrgNode from './components/OrgNode.vue';
import OrgChartConnectors from './components/OrgChartConnectors.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import DepartmentCreatePage from './DepartmentCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';

const CARD_WIDTH = 288; 
const HORIZONTAL_GAP = 40; 

export default {
    name: 'DepartmentPage',
    mixins: [notificationMixin, modalMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin],
    components: {
        OrgNode,
        OrgChartConnectors,
        PrimaryButton,
        SideModalDialog,
        AlertDialog,
        DepartmentCreatePage,
        SpinnerIcon
    },
    data() {
        return {
            controller: DepartmentController,
            cacheInvalidationType: 'departments',
            savedSuccessText: this.$t('departmentSaved') ,
            savedErrorText: this.$t('errorSavingDepartment') ,
            deletedSuccessText: this.$t('departmentDeleted') ,
            deletedErrorText: this.$t('errorDeletingDepartment') ,
            departments: [],
            loading: false,
            parentId: null,
            deleteDialog: false,
            itemToDelete: null,
            connectorsKey: 0
        };
    },
    computed: {
        currentCompanyName() {
            return this.$store.getters.currentCompany?.name ;
        },
        rootDepartments() {
            const map = {};
            this.departments.forEach(d => {
                map[d.id] = { ...d, children: [] };
            });
            const roots = [];
            this.departments.forEach(d => {
                const node = map[d.id];
                if (d.parentId && map[d.parentId]) {
                    map[d.parentId].children.push(node);
                } else {
                    roots.push(node);
                }
            });
            return roots;
        },
        rootDepartmentsContainerStyle() {
            const containerWidth = this.calculateContainerWidth(this.rootDepartments);
            return {
                width: `${containerWidth}px`,
                columnGap: `${HORIZONTAL_GAP}px`,
                marginTop: '12px'
            };
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },
    mounted() {
        this.fetchDepartments();
    },
    methods: {
        getSubtreeWidth(node) {
            if (!node) return CARD_WIDTH;
            const children = node.children || [];
            if (!children.length) {
                return CARD_WIDTH;
            }

            const childWidths = children.map(child => this.getSubtreeWidth(child));
            const gaps = HORIZONTAL_GAP * Math.max(children.length - 1, 0);
            const childrenWidth = childWidths.reduce((acc, width) => acc + width, 0) + gaps;

            return Math.max(CARD_WIDTH, childrenWidth);
        },
        calculateContainerWidth(nodes = []) {
            if (!nodes.length) return CARD_WIDTH;

            const widths = nodes.map(node => this.getSubtreeWidth(node));
            const gaps = HORIZONTAL_GAP * Math.max(nodes.length - 1, 0);

            return widths.reduce((acc, width) => acc + width, 0) + gaps;
        },
        refreshDataAfterOperation() {
            if (this.fetchDepartments) {
                this.fetchDepartments(1, true)
                    .catch((error) => console.error("Ошибка обновления данных:", error));
            }
            this.editingItem = null;
            this.parentId = null;
            if (this.closeModal) {
                this.shouldRestoreScrollOnClose = false;
                this.closeModal(true);
            }
        },
        handleModalClose() {
            this.editingItem = null;
            this.parentId = null;
            const formRef = Object.values(this.$refs || {}).find(ref => ref?.handleCloseRequest);
            if (formRef?.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        showCreateModal(parentId = null) {
            this.editingItem = null;
            this.parentId = parentId;
            this.$nextTick(() => {
                this.modalDialog = true;
            });
        },
        showEditModal(item) {
            this.editingItem = item;
            this.parentId = item.parentId;
            this.modalDialog = true;
        },
        handleDelete(item) {
            this.itemToDelete = item;
            this.deleteDialog = true;
        },
        async confirmDelete() {
            if (!this.itemToDelete) return;
            try {
                await DepartmentController.deleteItem(this.itemToDelete.id);
                this.deleteDialog = false;
                this.itemToDelete = null;
                this.invalidateCache('onDelete');
                this.fetchDepartments();
                this.showNotification(
                    this.deletedSuccessText ,
                    '',
                    false
                );
            } catch (error) {
                const messages = this.getApiErrorMessage(error);
                this.showNotification(
                    this.deletedErrorText ,
                    messages,
                    true
                );
            }
        },
        async fetchDepartments(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.departments = await DepartmentController.getAllItems();
                this.$nextTick(() => {
                    this.connectorsKey++;
                });
            } catch (error) {
                this.showNotification(
                    this.$t('errorLoadingDepartments') ,
                    error.message,
                    true
                );
            } finally {
                if (!silent) {
                    this.loading = false;
                }
            }
        },
        async handleCompanyChanged(companyId) {
            this.departments = [];
            await this.fetchDepartments();
        }
    }
};
</script>

<style scoped>
.bg-transparent {
    background-color: transparent !important;
}

.org-chart-container {
    position: relative;
}

.org-chart-scroll {
    scrollbar-color: #cbd5e1 transparent;
}

.company-card {
    transition: all 0.2s ease;
}

div[style*="overflow-x: auto"]::-webkit-scrollbar {
    height: 10px;
    width: 10px;
}

div[style*="overflow-x: auto"]::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
}

div[style*="overflow-x: auto"]::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
}

div[style*="overflow-x: auto"]::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.org-chart-scroll::-webkit-scrollbar {
    height: 14px;
}

.org-chart-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 8px;
    margin: 0 20px;
}

.org-chart-scroll::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 8px;
    border: 3px solid #f1f5f9;
}

.org-chart-scroll::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
