<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('title') }}</label>
        <input
          v-model="title"
          type="text"
          required
        >
      </div>

      <div class="mt-4">
        <label class="required">{{ $t('content') }}</label>
        <div class="quill-editor-container">
          <QuillEditor
            v-model:content="content"
            :options="editorOptions"
            content-type="html"
            :disabled="saveLoading"
          />
        </div>
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('news_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!title ||
            (editingItemId != null && !$store.getters.hasPermission('news_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('news_create'))"
        />
      </div>
    </teleport>
  </div>

  <AlertDialog 
    :dialog="deleteDialog" 
    :descr="$t('confirmDelete')" 
    :confirm-text="$t('delete')"
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
</template>

<script>
import { defineAsyncComponent } from 'vue';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import NewsController from '@/api/NewsController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

const QuillEditor = defineAsyncComponent(async () => (await import('@vueup/vue-quill')).QuillEditor);

export default {
    components: { 
        QuillEditor,
        PrimaryButton,
        AlertDialog,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            content: this.editingItem ? this.editingItem.content : '',
        }
    },
    computed: {
        editorOptions() {
            return {
                theme: 'snow',
                placeholder: this.$t('contentPlaceholder'),
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            };
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.title = newEditingItem.title ;
                    this.content = newEditingItem.content ;
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(() => {
            if (!this.editingItem) {
                this.clearForm();
            }
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                title: this.title,
                content: this.content,
            };
        },
        clearForm() {
            this.title = '';
            this.content = '';
            this.editingItemId = null;
            this.resetFormChanges();
        },
        prepareSave() {
            return {
                title: this.title.trim(),
                content: this.content,
            };
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await NewsController.updateItem(this.editingItemId, data);
            }
            return await NewsController.createItem(data);
        },
        async performDelete() {
            return await NewsController.deleteItem(this.editingItemId);
        },
        async save() {
            if (!this.validateRequiredFields([
                { value: this.title, message: this.$t('titleRequired') },
                { value: this.content, message: this.$t('contentRequired') }
            ])) {
                return;
            }
            return crudFormMixin.methods.save.call(this);
        },
    },
}
</script>

<style scoped>
.quill-editor-container {
    min-height: 300px;
}

.quill-editor-container :deep(.ql-container) {
    min-height: 300px;
    font-size: 14px;
}
</style>
