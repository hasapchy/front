<template>
  <div class="flex flex-col overflow-auto h-full p-4">
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

  <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
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

const QuillEditor = defineAsyncComponent(async () => (await import('@vueup/vue-quill')).QuillEditor);

export default {
    components: { 
        QuillEditor,
        PrimaryButton,
        AlertDialog,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin],
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            content: this.editingItem ? this.editingItem.content : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            closeConfirmDialog: false
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
        },
        '$i18n.locale'() {
            // При изменении языка обновляем placeholder редактора
            // Это делается автоматически через computed property editorOptions
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
        async save() {
            if (!this.validateRequiredFields([
                { value: this.title, message: this.$t('titleRequired') },
                { value: this.content, message: this.$t('contentRequired') }
            ])) {
                return;
            }

            this.saveLoading = true;
            try {
                const data = {
                    title: this.title.trim(),
                    content: this.content,
                };

                let response;
                if (this.editingItemId) {
                    response = await NewsController.updateItem(this.editingItemId, data);
                } else {
                    response = await NewsController.createItem(data);
                }

                this.$emit('saved', response);
            } catch (error) {
                this.emitSavedError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await NewsController.deleteItem(this.editingItemId);
                this.$emit('deleted');
            } catch (error) {
                this.emitDeletedError(error);
            }
            this.deleteLoading = false;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
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
