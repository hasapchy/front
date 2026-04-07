<template>
  <div class="flex flex-col h-full">
    <div
      v-if="!showForm"
      class="flex flex-col flex-1 overflow-auto p-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold">
          {{ $t('transactionTemplates') }}
        </h3>
        <PrimaryButton
          v-if="canCreate"
          :onclick="openCreate"
          icon="fas fa-plus"
        />
      </div>
      <div
        v-if="loading"
        class="flex flex-1 items-center justify-center py-12"
      >
        <SpinnerIcon size-class="text-3xl text-gray-400" />
      </div>
      <template v-else-if="templates.length === 0">
        <div class="text-gray-500 py-4">
          {{ $t('noData') }}
        </div>
      </template>
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <Card
          v-for="t in templates"
          :key="t.id"
          :show-checkbox="false"
          @dblclick="selectTemplate(t)"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <div
              class="flex items-start min-w-0 flex-1"
              @click="selectTemplate(t)"
            >
              <div class="shrink-0 mr-3 flex flex-col items-center">
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-lg"
                  :class="(t.type === 1 || t.type === true) ? 'bg-green-50 text-[#5CB85C]' : 'bg-red-50 text-[#EE4F47]'"
                  :title="(t.type === 1 || t.type === true) ? $t('income') : $t('outcome')"
                >
                  <i
                    v-if="t.icon"
                    :class="t.icon"
                    class="text-lg"
                  />
                  <i
                    v-else
                    :class="(t.type === 1 || t.type === true) ? 'fas fa-circle-down' : 'fas fa-circle-up'"
                    class="text-lg"
                  />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold text-gray-800 truncate">
                  {{ t.name }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Временно отключено: повторы по шаблону
              <button
                v-if="canRecurring"
                type="button"
                class="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                :aria-label="$t('recurring')"
                @click.stop="openRecurringModal(t)"
              >
                <i class="fas fa-redo text-sm" />
              </button>
              -->
              <button
                v-if="canUpdate"
                type="button"
                class="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                :aria-label="$t('edit')"
                @click.stop="openEdit(t)"
              >
                <i class="fas fa-pen text-sm" />
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-1 text-xs text-gray-600 mt-auto pt-2 border-t border-gray-100">
            <i class="fas fa-user text-gray-400 shrink-0" />
            <span class="truncate">{{ t.creator?.name  }}</span>
          </div>
        </Card>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col flex-1 overflow-hidden"
    >
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 class="text-base font-semibold">
          {{ editingTemplate ? $t('editTransactionTemplate') : $t('createTransactionTemplate') }}
        </h3>
      </div>
      <TransactionTemplateCreatePage
        ref="templateFormRef"
        class="flex-1 min-h-0"
        :editing-item="editingTemplate"
        @saved="onTemplateSaved"
        @saved-error="onTemplateSavedError"
        @deleted="onTemplateDeleted"
        @deleted-error="onTemplateDeletedError"
        @close-request="closeForm"
      />
    </div>
    <!-- Временно отключено
    <SideModalDialog
      :show-form="showRecurringModal"
      :title="$t('createRecurringFromTemplate')"
      :onclose="closeRecurringModal"
      :level="2"
    >
      <RecurringScheduleForm
        v-if="templateForRecurring"
        :template-id="templateForRecurring.id"
        :template-name="templateForRecurring.name"
        @saved="onRecurringSaved"
      />
    </SideModalDialog>
    -->
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import Card from '@/views/components/app/cards/Card.vue';
import TransactionTemplateCreatePage from '@/views/pages/transactions/TransactionTemplateCreatePage.vue';
import TransactionTemplateController from '@/api/TransactionTemplateController';

export default {
    name: 'TransactionTemplatesOverlay',
    components: {
        PrimaryButton,
        SpinnerIcon,
        Card,
        TransactionTemplateCreatePage
    },
    props: {
        visible: { type: Boolean, default: false },
        cashId: { type: [Number, String], default: null },
        transactionType: { type: String, default: null }
    },
    emits: ['close', 'select'],
    data() {
        return {
            templates: [],
            loading: false,
            showForm: false,
            editingTemplate: null,
        };
    },
    computed: {
        canCreate() {
            return this.$store.getters.hasPermission('transaction_templates_create');
        },
        canUpdate() {
            return this.$store.getters.hasPermission('transaction_templates_update_own') ||
                this.$store.getters.hasPermission('transaction_templates_update_all');
        },
    },
    watch: {
        visible(val) {
            if (val) this.fetchTemplates();
        }
    },
    mounted() {
        if (this.visible) this.fetchTemplates();
    },
    methods: {
        async fetchTemplates() {
            this.loading = true;
            try {
                const list = await TransactionTemplateController.getAll({});
                this.templates = Array.isArray(list) ? list : [];
            } catch {
                this.templates = [];
            }
            this.loading = false;
        },
        openCreate() {
            this.editingTemplate = null;
            this.showForm = true;
        },
        openEdit(template) {
            this.editingTemplate = template;
            this.showForm = true;
        },
        closeForm() {
            this.showForm = false;
            this.editingTemplate = null;
            this.fetchTemplates();
        },
        onTemplateSaved() {
            this.closeForm();
        },
        onTemplateSavedError(err) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: Array.isArray(err) ? err[0] : (err?.message ?? String(err)),
                isDanger: true
            });
        },
        onTemplateDeleted() {
            this.closeForm();
        },
        onTemplateDeletedError(err) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: Array.isArray(err) ? err[0] : (err?.message ?? String(err)),
                isDanger: true
            });
        },
        selectTemplate(template) {
            this.$emit('select', template.id);
        }
    }
};
</script>
