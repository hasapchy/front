<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="app-form-scroll-container">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <TabBar
          class="min-w-0 flex-1"
          :tabs="translatedTabs"
          :active-tab="currentTab"
          :tab-click="(t) => { changeTab(t) }"
        />
        <ProjectChatButton
          v-if="canOpenProjectChat"
          :project-id="editingItemId"
          :before-open="saveProjectDataIfDirty"
          close-on-success
          @close-request="$emit('close-request')"
        />
      </div>
      <div v-show="currentTab === 'info'">
        <ClientSearch
          v-model:selected-client="selectedClient"
          :disabled="!!editingItemId"
        />
        <div>
          <label class="required">{{ $t('name') }}</label>
          <input
            v-model="name"
            type="text"
          >
        </div>
        <div>
          <label>{{ $t('description') }}</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Введите описание проекта"
          />
        </div>
        <div>
          <label>{{ $t('projectDate') }}</label>
          <input
            v-model="date"
            type="datetime-local"
            :disabled="!!editingItemId && !canEditDate()"
            :min="getMinDate()"
          >
        </div>
        <div
          v-if="canViewProjectBudget"
          class="flex items-center space-x-2"
        >
          <div class="w-full">
            <label class="inline-flex items-center gap-1 mb-1">
              <span>{{ $t('projectBudget') }}</span>
              <FieldHint
                :text="$t('projectBudgetFromContracts')"
                :aria-label="$t('projectBudgetFromContractsAria')"
                placement="top"
              />
            </label>
            <FormattedDecimalInput
              v-model="budget"
              variant="amount"
              min="0"
              disabled
            />
          </div>
          <div class="w-full">
            <label class="inline-flex items-center gap-1 mb-1">
              <span class="required">{{ $t('projectCurrency') }}</span>
              <FieldHint
                v-if="isProjectCurrencyLocked"
                :text="$t('projectCurrencyLockedHint')"
                :aria-label="$t('projectCurrencyLockedHintAria')"
                placement="top"
              />
            </label>
            <select
              v-model="currencyId"
              :disabled="isProjectCurrencyLocked"
            >
              <option value="">
                {{ $t('no') }}
              </option>
              <template v-if="currencies.length">
                <option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :value="currency.id"
                >
                  {{ currency.code }}
                </option>
              </template>
            </select>
          </div>
        </div>
      </div>
      <div
        v-show="currentTab === 'balance' && editingItem && canViewProjectBalance"
        class="mt-4"
      >
        <ProjectBalanceTab :editing-item="editingItem" />
      </div>
      <div
        v-show="currentTab === 'contracts' && editingItem && canViewProjectContracts"
        class="mt-4"
      >
        <ProjectContractsTab
          :editing-item="editingItem"
          @budget-updated="onContractsChanged"
        />
      </div>
      <div
        v-show="currentTab === 'employees' && editingItem"
        class="mt-4"
      >
        <ProjectEmployeesTab :editing-item="editingItem" />
      </div>
    </div>
        
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null && canDeleteProject"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!canEditProject"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('deleteProject')"
      :confirm-text="$t('deleteProject')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
    <ProjectParticipantsDialog
      :visible="participantsModalOpen"
      :selected-user-ids="selectedUserIds"
      :locked-user-ids="lockedUserIds"
      @update:selected-user-ids="selectedUserIds = $event"
      @close="participantsModalOpen = false"
    />
  </div>
</template>

<script>
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProjectDto from '@/dto/project/ProjectDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import ProjectChatButton from '@/views/components/app/buttons/ProjectChatButton.vue';
import { hasChatsViewPermission } from '@/utils/projectChat';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProjectParticipantsDialog from '@/views/pages/projects/ProjectParticipantsDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';

import ProjectBalanceTab from '@/views/pages/projects/ProjectBalanceTab.vue';
import ProjectContractsTab from '@/views/pages/projects/ProjectContractsTab.vue';
import ProjectEmployeesTab from '@/views/pages/projects/ProjectEmployeesTab.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import dayjs from 'dayjs';
import { dateFormMixin } from '@/utils/dateUtils';

export default {
    components: { PrimaryButton, ProjectChatButton, AlertDialog, TabBar, ClientSearch, ProjectParticipantsDialog, ProjectBalanceTab, ProjectContractsTab, ProjectEmployeesTab, FieldHint },
    mixins: [getApiErrorMessage, companyChangeMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: ProjectDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            budget: this.editingItem ? this.editingItem.budget : 0,
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            description: this.editingItem ? this.editingItem.description : '',
            selectedClient: this.editingItem ? this.editingItem.client : null,
            currencies: [],

            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'contracts', label: 'contracts', permission: 'contracts_view' },
                { name: 'balance', label: 'balance', permission: 'settings_project_balance_view' },
                { name: 'participants', label: 'participants', hidden: true },
                { name: 'employees', label: 'employees' },
            ],

            selectedUserIds: this.getProjectUserIds(this.editingItem),
            projectHasContracts: false,
            participantsModalOpen: false,
        }
    },
    computed: {
        isProjectCurrencyLocked() {
            return Boolean(this.editingItemId && this.projectHasContracts);
        },
        canViewProjectBudget() {
            return this.$store.getters.hasPermission('settings_project_budget_view');
        },
        canViewProjectBalance() {
            return this.$store.getters.hasPermission('settings_project_balance_view');
        },
        canViewProjectContracts() {
            return this.$store.getters.hasPermission('contracts_view') || 
                   this.$store.getters.hasPermission('contracts_view_all') || 
                   this.$store.getters.hasPermission('contracts_view_own');
        },
        canDeleteProject() {
            return this.$store.getters.hasPermission('projects_delete');
        },
        canEditProject() {
            if (this.editingItemId != null) {
                return this.$store.getters.hasPermission('projects_update');
            } else {
                return this.$store.getters.hasPermission('projects_create');
            }
        },
        projectCreatorId() {
            return Number(this.editingItem?.creator?.id || 0);
        },
        lockedUserIds() {
            return this.projectCreatorId ? [this.projectCreatorId] : [];
        },
        canOpenProjectChat() {
            return Boolean(this.editingItemId) && hasChatsViewPermission(this.$store.getters);
        },
        visibleTabs() {
            const baseTabs = this.editingItem ? this.tabs : this.tabs.filter(tab => ['info'].includes(tab.name));
            return baseTabs.filter(tab => !tab.hidden && (!tab.permission || this.$store.getters.hasPermission(tab.permission)));
        },
        translatedTabs() {
            return this.visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
    },

    watch: {
        visibleTabs: {
            handler(tabs) {
                if (!tabs?.length) {
                    this.currentTab = 'info';
                    return;
                }
                if (!tabs.find(tab => tab.name === this.currentTab)) {
                    this.currentTab = tabs[0].name;
                }
            },
            immediate: true,
            deep: true,
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchCurrencies();
            await this.$store.dispatch('loadUsers');
            if (this.editingItemId) {
                if (hasChatsViewPermission(this.$store.getters)) {
                    await this.$store.dispatch('loadChats');
                }
                await this.refreshProjectHasContracts();
            }
            this.saveInitialState();
        });
    },

    methods: {
        clearForm() {
            this.name = '';
            this.budget = 0;
            this.currencyId = '';
            this.date = this.getCurrentLocalDateTime();
            this.description = '';
            this.selectedClient = null;
            this.editingItemId = null;
            this.currentTab = 'info';
            this.selectedUserIds = [];
            this.projectHasContracts = false;
            this.participantsModalOpen = false;
            this.resetFormChanges();
        },
        getProjectUserIds(item) {
            return item?.getUserIds?.() || [];
        },
        changeTab(tabName) {
            if (!this.visibleTabs.find(tab => tab.name === tabName)) {
                return;
            }
            if (tabName === 'participants') {
                this.participantsModalOpen = true;
                return;
            }
            this.currentTab = tabName;
            if (tabName === 'info' && this.editingItemId) {
                this.onContractsChanged();
            }
        },
        getFormState() {
            return {
                name: this.name,
                currencyId: this.currencyId,
                date: this.date,
                description: this.description,
                selectedClient: this.selectedClient?.id || null,
                selectedUserIds: this.selectedUserIds
            };
        },
        async refreshProjectBudget() {
            if (!this.editingItemId) {
                return;
            }
            try {
                const project = await ProjectController.getItem(this.editingItemId);
                this.budget = project.budget || 0;
            } catch {
                // ignore
            }
        },
        async refreshProjectHasContracts() {
            if (!this.editingItemId) {
                this.projectHasContracts = false;
                return;
            }
            try {
                const items = await this.$store.dispatch(
                    'loadProjectContractsByProject',
                    this.editingItemId
                );
                this.projectHasContracts = Array.isArray(items) && items.length > 0;
            } catch {
                this.projectHasContracts = false;
            }
        },
        async onContractsChanged() {
            await Promise.all([
                this.refreshProjectBudget(),
                this.refreshProjectHasContracts(),
            ]);
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: [],
                onLoaded: (currencies) => {
                    if (!this.editingItem && !this.currencyId) {
                        const defaultCurrency = currencies.find(c => c.isDefault);
                        if (defaultCurrency) {
                            this.currencyId = defaultCurrency.id;
                        }
                    }
                }
            });
        },
        prepareSave() {
            if (this.canViewProjectBudget) {
                if (!this.currencyId) {
                    throw new Error('Пожалуйста, выберите валюту проекта');
                }
            }

            const formData = {
                name: this.name,
                date: this.date ? dayjs(this.date).format('YYYY-MM-DD HH:mm:ss') : null,
                description: this.description || null,
                clientId: this.selectedClient?.id,
                users: this.selectedUserIds || []
            };

            if (this.canViewProjectBudget) {
                formData.currencyId = this.currencyId || null;
            }

            return formData;
        },
        async performSave(data) {
            let resp;
            if (this.editingItemId != null) {
                resp = await ProjectController.updateItem(this.editingItemId, data);
            } else {
                resp = await ProjectController.storeItem(data);
            }

            if (resp.message) {
                this.$store.commit('SET_PROJECTS', []);
                this.$store.commit('SET_PROJECTS_DATA', []);
                return resp.item || data;
            }
            throw new Error('Failed to save');
        },
        async performDelete() {
            await ProjectController.deleteItem(this.editingItemId);
            return { message: 'deleted' };
        },
        async saveProjectDataIfDirty() {
            if (!this.checkForChanges()) {
                return true;
            }
            if (!this.validateForm()) {
                return false;
            }
            await this.performSave(this.prepareSave());
            this.saveInitialState();
            return true;
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem === this._lastEditingItemRef) {
                return;
            }
            this._lastEditingItemRef = newEditingItem;
            if (newEditingItem) {
                this.name = newEditingItem.name ;
                this.budget = newEditingItem.budget || 0;
                this.currencyId = newEditingItem.currencyId ;
                this.date = newEditingItem.date
                    ? this.getFormattedDate(newEditingItem.date)
                    : this.getCurrentLocalDateTime();
                this.description = newEditingItem.description ;
                this.selectedClient = newEditingItem.client || null;
                this.selectedUserIds = this.getProjectUserIds(newEditingItem);
                this.currentTab = 'info';
                this.participantsModalOpen = false;
                this.refreshProjectHasContracts();
            } else {
                this.currentTab = 'info';
                this.projectHasContracts = false;
                this.participantsModalOpen = false;
            }
        }
    }

}
</script>