<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ editingItem ? ($t('editNews') || 'Редактировать новость') : ($t('createNews') || 'Создать новость') }}
        </h2>

        <div>
            <label class="required">{{ $t('title') || 'Заголовок' }}</label>
            <input type="text" v-model="title" required />
        </div>

        <div class="mt-4">
            <label class="required">{{ $t('content') || 'Содержание' }}</label>
            <div class="quill-editor-container">
                <QuillEditor
                    v-model:content="content"
                    :options="editorOptions"
                    contentType="html"
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
            :disabled="!$store.getters.hasPermission('news_delete')">
        </PrimaryButton>
        <PrimaryButton 
            icon="fas fa-save" 
            :onclick="save" 
            :is-loading="saveLoading"
            :disabled="!title || 
            (editingItemId != null && !$store.getters.hasPermission('news_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('news_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog 
        :dialog="deleteDialog" 
        @confirm="deleteItem" 
        @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" 
        :confirm-text="$t('delete')" 
        :leave-text="$t('cancel')" />
    <AlertDialog 
        :dialog="closeConfirmDialog" 
        @confirm="confirmClose" 
        @leave="cancelClose"
        :descr="$t('unsavedChanges')" 
        :confirm-text="$t('closeWithoutSaving')" 
        :leave-text="$t('stay')" />
</template>

<script>
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import NewsController from '@/api/NewsController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { 
        QuillEditor,
        PrimaryButton,
        AlertDialog,
    },
    props: {
        editingItem: { type: Object, default: null }
    },
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
                placeholder: this.$t('contentPlaceholder') || 'Введите текст новости...',
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
    mounted() {
        this.$nextTick(() => {
            if (!this.editingItem) {
                this.clearForm();
            }
            this.saveInitialState();
        });
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.title = newEditingItem.title || '';
                    this.content = newEditingItem.content || '';
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
            if (!this.title || this.title.trim() === '') {
                this.$emit('saved-error', this.$t('titleRequired') || 'Заголовок обязателен');
                return;
            }

            if (!this.content || this.content.trim() === '') {
                this.$emit('saved-error', this.$t('contentRequired') || 'Содержание обязательно');
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
                this.$emit('saved-error', this.getApiErrorMessage(error));
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
                this.$emit('deleted-error', this.getApiErrorMessage(error));
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
